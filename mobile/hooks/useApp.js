// ============================================
// ZAVARA useApp.js - v2.0
// Handles app startup, onboarding, auto-login
// ============================================
import { useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';

const ONBOARDING_KEY = '@zavara_onboarding_done';

export function useApp() {

  const {
    setUserId,
    setUserRole,
    setLoggedInUser,
    setEmail,
    setProfileImage,
    setScreen,
  } = useAppContext();

  const [appReady, setAppReady]           = useState(false);
  const [showRetry, setShowRetry]         = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ============================================
  // CHECK ONBOARDING
  // ============================================
  const checkOnboarding = useCallback(async () => {
    try {
      const done = await AsyncStorage.getItem(
        ONBOARDING_KEY
      );
      return done === 'true';
    } catch {
      return false;
    }
  }, []);

  // ============================================
  // FINISH ONBOARDING
  // ============================================
  const finishOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_KEY, 'true'
      );
    } catch {}
    setShowOnboarding(false);
    setScreen('login');
    setAppReady(true);
  }, [setScreen]);

  // ============================================
  // AUTO LOGIN
  // Try to log user back in using saved creds
  // ============================================
  const tryAutoLogin = useCallback(async () => {
    try {
      const [
        savedEmail,
        savedPassword,
        savedName,
        savedId,
        savedRole,
        savedImage,
      ] = await Promise.all([
        SecureStore.getItemAsync('userEmail'),
        SecureStore.getItemAsync('userPassword'),
        SecureStore.getItemAsync('userName'),
        SecureStore.getItemAsync('userId'),
        SecureStore.getItemAsync('userRole'),
        SecureStore.getItemAsync('profileImage'),
      ]);

      // No saved credentials
      if (!savedEmail || !savedPassword) {
        return false;
      }

      // Try to login with saved credentials
      const response = await axios.post(
        `${API_URL}/users/login`,
        {
          email:    savedEmail,
          password: savedPassword,
        },
        { timeout: 10000 }
      );

      const data = response.data;

      // Set auth state
      setUserId(data.user_id);
      setUserRole(data.role);
      setLoggedInUser(data.user_name);
      setEmail(savedEmail);
      if (savedImage) setProfileImage(savedImage);

      // Update stored values with fresh data
      await Promise.all([
        SecureStore.setItemAsync(
          'userId', data.user_id.toString()
        ),
        SecureStore.setItemAsync(
          'userRole', data.role
        ),
        SecureStore.setItemAsync(
          'userName', data.user_name
        ),
      ]);

      return true;

    } catch (err) {
      if (__DEV__) {
        console.log('Auto-login failed:', err?.message);
      }
      return false;
    }
  }, [
    setUserId,
    setUserRole,
    setLoggedInUser,
    setEmail,
    setProfileImage,
  ]);

  // ============================================
  // PREPARE APP - Main startup function
  // Called once when app opens
  // ============================================
  const prepareApp = useCallback(async () => {
    try {
      setAppReady(false);
      setShowRetry(false);

      // Small delay for splash screen
      await new Promise(r => setTimeout(r, 800));

      // Check onboarding first
      const onboardingDone = await checkOnboarding();

      if (!onboardingDone) {
        // Show onboarding for new users
        setShowOnboarding(true);
        await SplashScreen.hideAsync().catch(() => {});
        return;
      }

      // Try auto-login
      const loggedIn = await tryAutoLogin();

      if (loggedIn) {
        setScreen('home');
      } else {
        setScreen('login');
      }

      setAppReady(true);

    } catch (err) {
      if (__DEV__) {
        console.log('App prepare error:', err?.message);
      }
      // Show retry button if startup fails
      setShowRetry(true);
      setAppReady(true);
    } finally {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [
    checkOnboarding,
    tryAutoLogin,
    setScreen,
  ]);

  return {
    appReady,
    setAppReady,
    showRetry,
    setShowRetry,
    showOnboarding,
    prepareApp,
    finishOnboarding,
  };
}