// FILE: mobile/hooks/useapp.js
// REPLACE the WHOLE file with this:

// ============================================
// ZAVARA useApp.js - v3.0 FIXED
// ✅ Fixed race condition bug
// ✅ Auto login no longer overwrites navigation
// ✅ Uses saved data first (no API needed!)
// ============================================
import { useState, useCallback, useRef } from 'react';
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

  const [appReady, setAppReady]             = useState(false);
  const [showRetry, setShowRetry]           = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ✅ Track if user navigated manually
  // If they did, dont overwrite their screen!
  const screenLockedRef = useRef(false);

  // ============================================
  // CHECK ONBOARDING
  // ============================================
  const checkOnboarding = useCallback(async () => {
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
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
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    setShowOnboarding(false);
    setScreen('login');
    setAppReady(true);
  }, [setScreen]);

  // ============================================
  // AUTO LOGIN v2.0
  // ✅ Uses saved data FIRST (instant!)
  // ✅ Verifies in background (no blocking!)
  // ✅ No more race condition!
  // ============================================
  const tryAutoLogin = useCallback(async () => {
    try {
      // ── STEP 1: Load saved credentials ──────
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

      // No saved credentials = go to login
      if (!savedEmail || !savedPassword || !savedId) {
        console.log('No saved credentials');
        return false;
      }

      // ── STEP 2: Restore session INSTANTLY! ──
      // Use saved data right away!
      // No API call needed for this part!
      setUserId(parseInt(savedId));
      setUserRole(savedRole || 'regular');
      setLoggedInUser(savedName || '');
      setEmail(savedEmail);
      if (savedImage) setProfileImage(savedImage);

      console.log('✅ Session restored instantly!',
        'userId:', savedId, 'role:', savedRole);

      // ── STEP 3: Verify in BACKGROUND ────────
      // This runs AFTER screen is already shown!
      // Does NOT block or overwrite navigation!
      setTimeout(async () => {
        try {
          console.log('🔄 Background verification...');

          const response = await axios.post(
            `${API_URL}/users/login`,
            {
              email:    savedEmail,
              password: savedPassword,
            },
            { timeout: 15000 }
          );

          const data = response.data;

          // Update with fresh data silently
          // ✅ NO setScreen here! Never overwrite navigation!
          setUserId(data.user_id);
          setUserRole(data.role);
          setLoggedInUser(data.user_name);

          // Update stored values
          await Promise.all([
            SecureStore.setItemAsync(
              'userId', data.user_id.toString()
            ),
            SecureStore.setItemAsync('userRole', data.role),
            SecureStore.setItemAsync('userName', data.user_name),
          ]);

          console.log('✅ Background verification done!');

        } catch (err) {
          // Background verification failed
          // But user is already inside the app!
          // Don't kick them out!
          console.log('Background verify failed:', err?.message);
          // Only logout if server says credentials wrong
          if (err?.response?.status === 401) {
            console.log('❌ Invalid credentials - logging out');
            setUserId(null);
            setUserRole('regular');
            setScreen('login');
          }
          // For network errors - stay logged in!
          // User experience > perfect auth
        }
      }, 2000); // wait 2 seconds after app is ready!

      return true; // ✅ Return true immediately!

    } catch (err) {
      console.log('Auto-login error:', err?.message);
      return false;
    }
  }, [
    setUserId,
    setUserRole,
    setLoggedInUser,
    setEmail,
    setProfileImage,
    setScreen,
  ]);

  // ============================================
  // PREPARE APP v2.0
  // ✅ Faster startup
  // ✅ No race conditions
  // ============================================
  const prepareApp = useCallback(async () => {
    try {
      setAppReady(false);
      setShowRetry(false);

      // Small delay for splash
      await new Promise(r => setTimeout(r, 600));

      // Check onboarding
      const onboardingDone = await checkOnboarding();

      if (!onboardingDone) {
        setShowOnboarding(true);
        await SplashScreen.hideAsync().catch(() => {});
        return;
      }

      // Try auto login with saved data
      const loggedIn = await tryAutoLogin();

      if (loggedIn) {
        setScreen('home');
      } else {
        setScreen('login');
      }

      // App is ready!
      setAppReady(true);

    } catch (err) {
      console.log('App prepare error:', err?.message);
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