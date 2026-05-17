// ============================================
// context/AppContext.js - v3.0
// ✅ Cart persistence
// ✅ pendingNavigation for deep linking
// ✅ notification deep link support
// ============================================
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

const AppContext = createContext(null);

const CART_STORAGE_KEY = '@zavara_cart';

export function AppProvider({ children }) {

  // ── AUTH STATE ──────────────────────────────
  const [userId, setUserId]             = useState(null);
  const [userRole, setUserRole]         = useState('regular');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [email, setEmail]               = useState('');
  const [profileImage, setProfileImage] = useState(null);

  // ── APP STATE ───────────────────────────────
  const [screen, setScreen]         = useState('loading');
  const [authLoaded, setAuthLoaded] = useState(false);
  const [cartCount, setCartCount]   = useState(0);
  const [location, setLocation]     = useState(null);

  // ✅ DEEP LINK NAVIGATION STATE
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // ── CART STATE ──────────────────────────────
  const [persistedCart, setPersistedCart] = useState([]);
  const [cartLoaded, setCartLoaded]       = useState(false);

  // ── LOAD CART ON STARTUP ─────────────────────
  useEffect(() => { loadCart(); }, []);

  const loadCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPersistedCart(parsed);
        const total = parsed.reduce((s, i) => s + i.quantity, 0);
        setCartCount(total);
      }
    } catch (err) {
      console.log('Cart load error:', err?.message);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  const saveCart = useCallback(async (cart) => {
    try {
      await AsyncStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (err) {
      console.log('Cart save error:', err?.message);
    }
  }, []);

  const clearPersistedCart = useCallback(async () => {
    setPersistedCart([]);
    setCartCount(0);
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  // ── AUTH METHODS ────────────────────────────
  const clearAuth = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('userEmail'),
      SecureStore.deleteItemAsync('userPassword'),
      SecureStore.deleteItemAsync('userName'),
      SecureStore.deleteItemAsync('userId'),
      SecureStore.deleteItemAsync('userRole'),
      SecureStore.deleteItemAsync('profileImage'),
    ]);
    setUserId(null);
    setUserRole('regular');
    setLoggedInUser('');
    setEmail('');
    setProfileImage(null);
    setCartCount(0);
    setPendingNavigation(null);
    await clearPersistedCart();
  }, [clearPersistedCart]);

  const setAuth = useCallback(async ({
    user_id, user_name, role,
    userEmail, password, image,
  }) => {
    setUserId(user_id);
    setUserRole(role);
    setLoggedInUser(user_name);
    setEmail(userEmail);
    if (image) setProfileImage(image);

    await Promise.all([
      SecureStore.setItemAsync('userEmail', userEmail),
      SecureStore.setItemAsync('userPassword', password),
      SecureStore.setItemAsync('userName', user_name),
      SecureStore.setItemAsync('userId', user_id.toString()),
      SecureStore.setItemAsync('userRole', role),
    ]);
  }, []);
     
  // ✅ PInanatili ko ang bersyon na may mas detalyadong debug logs
  const loadSavedAuth = useCallback(async () => {
    try {
      const savedId    = await SecureStore.getItemAsync('userId');
      const savedRole  = await SecureStore.getItemAsync('userRole');
      const savedName  = await SecureStore.getItemAsync('userName');
      const savedEmail = await SecureStore.getItemAsync('userEmail');
      const savedImage = await SecureStore.getItemAsync('profileImage');

      if (savedId && savedRole) {
        setUserId(parseInt(savedId));
        setUserRole(savedRole);
        setLoggedInUser(savedName || '');
        setEmail(savedEmail || '');
        if (savedImage) setProfileImage(savedImage);
        console.log('✅ Session restored! userId:', savedId);
      } else {
        console.log('No saved session found');
      }
    } catch (err) {
      console.log('Auth load error:', err?.message);
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  // ✅ Load saved auth when app starts!
  useEffect(() => {
    loadSavedAuth();
  }, [loadSavedAuth]);

  // ── ROLE DATA ────────────────────────────────
  const roleData = useMemo(() => {
    const map = {
      regular: {
        badge:  '👤 Member',
        banner: '',
        color:  colors.primary,
        bg:     colors.primaryPale,
      },
      producer: {
        badge:  '🌾 Harvest Partner',
        banner: '🌾 Verified Harvest Partner',
        color:  colors.farmerColor,
        bg:     colors.farmerBg,
      },
      seller: {
        badge:  '🏪 Market Seller',
        banner: '🏪 Verified Market Seller',
        color:  colors.vendorColor,
        bg:     colors.vendorBg,
      },
      transport: {
        badge:  '🚐 Swift Partner',
        banner: '🚐 Verified Swift Partner',
        color:  colors.riderColor,
        bg:     colors.riderBg,
      },
      haven: {
        badge:  '🏨 Haven Partner',
        banner: '🏨 Verified Haven Partner',
        color:  colors.havenColor,
        bg:     colors.havenBg,
      },
      cuisine: {
        badge:  '🍴 Cuisine Partner',
        banner: '🍴 Verified Cuisine Partner',
        color:  colors.cuisineColor,
        bg:     colors.cuisineBg,
      },
      admin: {
        badge:  '⚙️ Overseer',
        banner: '⚙️ Overseer Account',
        color:  colors.adminColor,
        bg:     colors.adminBg,
      },
    };
    return map[userRole] || map.regular;
  }, [userRole]);

  // ── NAV TABS ─────────────────────────────────
  const navTabs = useMemo(() => {
    if (userRole === 'admin') {
      return [
        { s: 'home',       icon: '🏠', label: 'Home'   },
        { s: 'admin_dash', icon: '⚙️', label: 'Admin'  },
        { s: 'restaurants',icon: '🍴', label: 'Food'   },
        { s: 'orders',     icon: '📦', label: 'Orders' },
        { s: 'profile',    icon: '👤', label: 'Me'     },
      ];
    }
    if (userRole === 'producer') {
      return [
        { s: 'home',          icon: '🏠', label: 'Home'      },
        { s: 'restaurants',   icon: '🍴', label: 'Food'      },
        { s: 'producer_dash', icon: '🌾', label: 'Dashboard' },
        { s: 'orders',        icon: '📦', label: 'Orders'    },
        { s: 'profile',       icon: '👤', label: 'Me'        },
      ];
    }
    if (userRole === 'cuisine') {
      return [
        { s: 'home',         icon: '🏠', label: 'Home'      },
        { s: 'restaurants',  icon: '🍴', label: 'Food'      },
        { s: 'cuisine_dash', icon: '🍴', label: 'Dashboard' },
        { s: 'orders',       icon: '📦', label: 'Orders'    },
        { s: 'profile',      icon: '👤', label: 'Me'        },
      ];
    }
    return [
      { s: 'home',        icon: '🏠', label: 'Home'   },
      { s: 'restaurants', icon: '🍴', label: 'Food'   },
      { s: 'market',      icon: '🛒', label: 'Market' },
      { s: 'orders',      icon: '📦', label: 'Orders' },
      { s: 'profile',     icon: '👤', label: 'Me'     },
    ];
  }, [userRole]);

  const value = useMemo(() => ({
    // Auth
    userId, userRole, loggedInUser,
    email, setEmail,
    profileImage, setProfileImage,
    setLoggedInUser, setUserId, setUserRole,
    setAuth, clearAuth,
    authLoaded,

    // App
    screen, setScreen,
    cartCount, setCartCount,
    location, setLocation,

    // Cart
    persistedCart, setPersistedCart,
    cartLoaded, saveCart, clearPersistedCart,

    // Deep link
    pendingNavigation, setPendingNavigation,

    // Computed
    roleData, navTabs,
  }), [
    userId, userRole, loggedInUser,
    email, profileImage,
    screen, cartCount, location,
    persistedCart, cartLoaded,
    pendingNavigation,
    roleData, navTabs,
    setAuth, clearAuth,
    saveCart, clearPersistedCart,
    authLoaded,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error(
    'useAppContext must be inside AppProvider'
  );
  return ctx;
}