// ============================================
// hooks/useAuth.js
// All auth logic in one place
// Like Grab's useAuth hook
// ============================================
import { useCallback, useState } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { showToast } from '../screens/ToastManager';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';

export function useAuth() {
  const {
    setAuth,
    clearAuth,
    setScreen,
    email, setEmail,
    setLoggedInUser,
    setUserId,
    setUserRole,
    setProfileImage,
  } = useAppContext();

  const [loading, setLoading] = useState(false);

  // ── LOGIN ───────────────────────────────────
  const handleLogin = useCallback(async (
    emailInput, password
  ) => {
    if (!emailInput?.trim() || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      showToast('warning', 'Invalid Email',
        'Please enter a valid email address');
      return false;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/users/login`,
        { email: emailInput.trim(), password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const savedImg = await SecureStore.getItemAsync(
        'profileImage'
      );

      await setAuth({
        user_id:   res.data.user_id,
        user_name: res.data.user_name,
        role:      res.data.role,
        userEmail: emailInput.trim(),
        password,
        image:     savedImg,
      });

      showToast('success', 'Welcome Back! 👋',
        `Good to see you, ${res.data.user_name}!`);

      setTimeout(() => setScreen('home'), 900);
      return true;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 404) {
        showToast('error', 'Login Failed',
          'Invalid email or password');
      } else {
        showToast('error', 'Connection Error',
          'Could not reach server. Try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [setAuth, setScreen]);

  // ── REGISTER ────────────────────────────────
  const handleRegister = useCallback(async ({
    name, email, password, phone,
  }) => {
    if (!name?.trim() || !email?.trim() || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('warning', 'Invalid Email',
        'Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      showToast('warning', 'Weak Password',
        'Password must be at least 6 characters');
      return false;
    }
    if (phone && phone.length < 11) {
      showToast('warning', 'Invalid Phone',
        'Please enter a valid phone number');
      return false;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/users/register`,
        {
          name:     name.trim(),
          email:    email.trim(),
          password,
          phone,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      showToast('success', 'Account Created! 🎉',
        'Welcome to ZAVARA! Please login.');
      setTimeout(() => setScreen('login'), 1500);
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail ||
        'Email may already be registered.';
      showToast('error', 'Registration Failed', msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setScreen]);

  // ── LOGOUT ──────────────────────────────────
  const handleLogout = useCallback(async () => {
    await clearAuth();
    showToast('info', 'Logged Out',
      'See you next time! 👋');
    setTimeout(() => setScreen('login'), 300);
  }, [clearAuth, setScreen]);

  // ── AUTO LOGIN ──────────────────────────────
  const tryAutoLogin = useCallback(async () => {
    const savedEmail =
      await SecureStore.getItemAsync('userEmail');
    const savedPassword =
      await SecureStore.getItemAsync('userPassword');

    if (!savedEmail || !savedPassword) return false;

    try {
      const res = await axios.post(
        `${API_URL}/users/login`,
        { email: savedEmail, password: savedPassword },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );

      const savedImg = await SecureStore.getItemAsync(
        'profileImage'
      );

      await setAuth({
        user_id:   res.data.user_id,
        user_name: res.data.user_name,
        role:      res.data.role,
        userEmail: savedEmail,
        password:  savedPassword,
        image:     savedImg,
      });

      setScreen('home');
      return true;
    } catch {
      // Bad credentials - clear and go to login
      await clearAuth();
      setScreen('login');
      return false;
    }
  }, [setAuth, clearAuth, setScreen]);

  return {
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    tryAutoLogin,
  };
}