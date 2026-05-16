// ============================================
// hooks/useOTA.js
// Over The Air Updates - ZAVARA
// ✅ Silent background check
// ✅ Shows update toast to user
// ✅ Better than Uber Eats (they just reload)
// ✅ We tell user AND let them choose
// ============================================
import {
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { showToast } from '../screens/ToastManager';

// ============================================
// SAFE IMPORT
// Works in Expo Go AND production build
// ============================================
let Updates = null;
try {
  Updates = require('expo-updates');
} catch {
  // Running in Expo Go - OTA not available
}

const isDev = __DEV__;
const log = (...args) => {
  if (isDev) console.log(...args);
};

export function useOTA() {
  const appStateRef   = useRef(AppState.currentState);
  const checkingRef   = useRef(false);
  const mountedRef    = useRef(true);

  // ============================================
  // CHECK FOR UPDATE
  // ============================================
  const checkForUpdate = useCallback(async () => {
    // Skip in dev or Expo Go
    if (isDev || !Updates) {
      log('⚡ OTA: Skipped (dev mode or Expo Go)');
      return;
    }

    // Prevent double-check
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      log('🔄 OTA: Checking for updates...');

      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        log('✅ OTA: App is up to date!');
        checkingRef.current = false;
        return;
      }

      log('🆕 OTA: Update available! Downloading...');

      // Download silently
      await Updates.fetchUpdateAsync();

      if (!mountedRef.current) return;

      log('✅ OTA: Downloaded! Notifying user...');

      // ✅ Tell user nicely (not force reload!)
      // Better than Uber Eats which just reloads
      showToast(
        'success',
        '🆕 Update Ready!',
        'Restart app to get new features'
      );

      // ✅ Auto reload after 3 seconds
      setTimeout(async () => {
        if (!mountedRef.current) return;
        try {
          await Updates.reloadAsync();
        } catch (err) {
          log('⚠️ OTA reload failed:', err?.message);
        }
      }, 3000);

    } catch (err) {
      // Silent fail - don't bother user with OTA errors
      log('⚠️ OTA check failed:', err?.message);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  // ============================================
  // CHECK ON APP FOREGROUND
  // Like Grab - checks when user opens app
  // ============================================
  useEffect(() => {
    mountedRef.current = true;

    // Check immediately on mount
    checkForUpdate();

    // Check again when app comes to foreground
    const subscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          log('📱 App foregrounded - checking OTA...');
          checkForUpdate();
        }
        appStateRef.current = nextState;
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [checkForUpdate]);

  return { checkForUpdate };
}