// ============================================
// ZAVARA APP.JS - COMPLETE v4.0
// ============================================
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LogBox,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import FoodScreen from './screens/FoodScreen';
import MarketScreen from './screens/MarketScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProducerDashboardScreen from './screens/ProducerDashboardScreen';
import CartScreen from './screens/CartScreen';

import { ToastProvider, showToast } from './screens/ToastManager';
import {
  pickImageFromGallery,
  takePhoto,
  uploadProfilePhoto,
} from './screens/ImagePickerHelper';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  removeNotificationListeners,
} from './screens/NotificationHelper';

import {
  colors,
  shadow,
  shadowMd,
  shadowDark,
  shadowGold,
  borderRadius,
} from './theme';

import { API_URL } from './config';

LogBox.ignoreLogs(['Warning:']);
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

// ============================================
// HELPERS
// ============================================
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getGreetingEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  if (hour < 21) return '🌅';
  return '🌙';
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ onRetry, showRetry }) {
  const logoScale     = useRef(new Animated.Value(0.5)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const lineWidth     = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const shimmer       = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;
  const retryOpacity  = useRef(new Animated.Value(0)).current;
  const retrySlide    = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 35,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: 60,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer loop on ZAVARA text
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Smooth slide + fade in retry when offline
  useEffect(() => {
    if (showRetry) {
      Animated.parallel([
        Animated.timing(retryOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(retrySlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      retryOpacity.setValue(0);
      retrySlide.setValue(30);
    }
  }, [showRetry]);

  return (
    <View style={LS.container}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />

      {/* Glow + Logo */}
      <Animated.View style={[LS.logoSection, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <View style={LS.glowCircle}>
          <View style={LS.glowCircleInner} />
        </View>
        <Animated.Text style={[LS.brand, {
          opacity: shimmer.interpolate({
            inputRange:  [0, 0.5, 1],
            outputRange: [1, 0.65, 1],
          }),
        }]}>
          ZAVARA
        </Animated.Text>
      </Animated.View>

      {/* Divider */}
      <Animated.View style={[LS.line, { width: lineWidth }]} />

      {/* Tagline */}
      <Animated.Text style={[LS.tagline, { opacity: tagOpacity }]}>
        THE ISLAND'S PULSE
      </Animated.Text>

      {/* Animated dots */}
      <Animated.View style={[LS.dotsWrap, { opacity: bottomOpacity }]}>
        <Animated.View style={[LS.dot,
          { transform: [{ scale: pulseAnim }] }]} />
        <View style={[LS.dot, LS.dotFade2]} />
        <View style={[LS.dot, LS.dotFade3]} />
      </Animated.View>

      {/* Location tag */}
      <Animated.View style={[LS.bottomWrap, { opacity: bottomOpacity }]}>
        <Text style={LS.bottomText}>Bohol, Philippines 🌴</Text>
      </Animated.View>

      {/* Retry block - slides up when offline */}
      {showRetry && (
        <Animated.View style={[LS.retryWrap, {
          opacity: retryOpacity,
          transform: [{ translateY: retrySlide }],
        }]}>
          <View style={LS.retryIconRow}>
            <Text style={LS.retryWifiIcon}>📵</Text>
          </View>
          <Text style={LS.retryOfflineTitle}>
            No Internet Connection
          </Text>
          <Text style={LS.retryOfflineText}>
            Check your load or WiFi then retry
          </Text>
          <TouchableOpacity
            style={LS.retryBtn}
            onPress={onRetry}
            activeOpacity={0.75}>
            <Text style={LS.retryBtnText}>↻  TAP TO RETRY</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const LS = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryGlow2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircleInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primaryGlow,
  },
  brand: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 14,
    textShadowColor: 'rgba(196,149,30,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  line: {
    height: 2,
    backgroundColor: colors.primary,
    marginBottom: 18,
    borderRadius: 2,
    opacity: 0.65,
  },
  tagline: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 6,
    marginBottom: 64,
    fontWeight: '600',
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 64,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotFade2: { opacity: 0.45 },
  dotFade3: { opacity: 0.18 },
  bottomWrap: {
    position: 'absolute',
    bottom: 52,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.20)',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '500',
  },
  // Retry
  retryWrap: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  retryIconRow: {
    marginBottom: 10,
  },
  retryWifiIcon: {
    fontSize: 36,
  },
  retryOfflineTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  retryOfflineText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginBottom: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.primary + '80',
    backgroundColor: colors.primary + '15',
  },
  retryBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
});

// ============================================
// MAIN APP CONTENT
// ============================================
function AppContent() {

  const [screen, setScreen]                 = useState('loading');
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false); // 🆕 show/hide pw
  const [phone, setPhone]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [loggedInUser, setLoggedInUser]     = useState('');
  const [userId, setUserId]                 = useState(null);
  const [userRole, setUserRole]             = useState('regular');
  const [appReady, setAppReady]             = useState(false);
  const [location, setLocation]             = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileImage, setProfileImage]     = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cartCount, setCartCount]           = useState(0);
  const [showRetry, setShowRetry]           = useState(false);

  // ── NOTIFICATION SETUP ───────────────────────
  useEffect(() => { prepareApp(); }, []);

  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId);
    const listeners = setupNotificationListeners(
      (notification) => {
        console.log('📬 Notification!', notification);
      },
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.order_id) setScreen('orders');
      }
    );
    return () => removeNotificationListeners(listeners);
  }, [userId]);

  // ── CHECK INTERNET ──────────────────────────
  const checkInternet = useCallback(async () => {
    try {
      await axios.get(`${API_URL}/`, { timeout: 4000 });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── PREPARE APP ─────────────────────────────
  const prepareApp = useCallback(async () => {
    try {
      setShowRetry(false);
      await new Promise(r => setTimeout(r, 2800));

      try { await SplashScreen.hideAsync(); } catch {}

      const online = await checkInternet();

      if (!online) {
        setAppReady(true);
        setShowRetry(true);
        showToast('error', 'No Internet 📵',
          'Please check your load or WiFi');
        return;
      }

      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!seen) {
        setShowOnboarding(true);
        setAppReady(true);
      } else {
        await loadApp();
      }
    } catch {
      setAppReady(true);
    }
  }, []);

  // ── LOAD APP ────────────────────────────────
  const loadApp = useCallback(async () => {
    try {
      // Location - non-blocking
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch {}

      const savedEmail    = await SecureStore.getItemAsync('userEmail');
      const savedPassword = await SecureStore.getItemAsync('userPassword');

      if (savedEmail && savedPassword) {
        try {
          const res = await axios.post(
            `${API_URL}/users/login`,
            { email: savedEmail, password: savedPassword },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 8000,
            }
          );
          setLoggedInUser(res.data.user_name);
          setUserId(res.data.user_id);
          setUserRole(res.data.role);
          setEmail(savedEmail);
          const savedImg = await SecureStore.getItemAsync('profileImage');
          if (savedImg) setProfileImage(savedImg);
          setScreen('home');
        } catch {
          await SecureStore.deleteItemAsync('userEmail');
          await SecureStore.deleteItemAsync('userPassword');
          setScreen('login');
        }
      } else {
        setScreen('login');
      }
    } catch {
      setScreen('login');
    } finally {
      setAppReady(true);
    }
  }, []);

  // ── AUTH HELPERS ────────────────────────────
  const saveLogin = useCallback(async (e, p, n, i, r) => {
    await Promise.all([
      SecureStore.setItemAsync('userEmail', e),
      SecureStore.setItemAsync('userPassword', p),
      SecureStore.setItemAsync('userName', n),
      SecureStore.setItemAsync('userId', i.toString()),
      SecureStore.setItemAsync('userRole', r),
    ]);
  }, []);

  const clearLogin = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('userEmail'),
      SecureStore.deleteItemAsync('userPassword'),
      SecureStore.deleteItemAsync('userName'),
      SecureStore.deleteItemAsync('userId'),
      SecureStore.deleteItemAsync('userRole'),
      SecureStore.deleteItemAsync('profileImage'),
    ]);
  }, []);

  // ── LOGIN ───────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('warning', 'Invalid Email',
        'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/users/login`,
        { email: email.trim(), password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      setLoggedInUser(res.data.user_name);
      setUserId(res.data.user_id);
      setUserRole(res.data.role);
      await saveLogin(
        email.trim(), password,
        res.data.user_name,
        res.data.user_id,
        res.data.role
      );
      const savedImg = await SecureStore.getItemAsync('profileImage');
      if (savedImg) setProfileImage(savedImg);
      showToast('success', 'Welcome Back! 👋',
        `Good to see you, ${res.data.user_name}!`);
      setTimeout(() => setScreen('home'), 900);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 404) {
        showToast('error', 'Login Failed',
          'Invalid email or password');
      } else {
        showToast('error', 'Connection Error',
          'Could not reach server. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  // ── REGISTER ────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('warning', 'Invalid Email',
        'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Weak Password',
        'Password must be at least 6 characters');
      return;
    }
    if (phone && phone.length < 11) {
      showToast('warning', 'Invalid Phone',
        'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/users/register`,
        { name: name.trim(), email: email.trim(), password, phone },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      showToast('success', 'Account Created! 🎉',
        'Welcome to ZAVARA! Please login.');
      setTimeout(() => {
        setScreen('login');
        setName('');
        setPhone('');
        setPassword('');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail ||
        'Email may already be registered.';
      showToast('error', 'Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, phone]);

  // ── LOGOUT ──────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearLogin();
            // Reset ALL state before switching screen
            // to prevent white flash
            setEmail('');
            setPassword('');
            setName('');
            setPhone('');
            setLoggedInUser('');
            setUserId(null);
            setUserRole('regular');
            setProfileImage(null);
            setCartCount(0);
            setShowPassword(false);
            showToast('info', 'Logged Out',
              'See you next time! 👋');
            // Small delay so state settles, no flash
            setTimeout(() => setScreen('login'), 300);
          },
        },
      ]
    );
  }, []);

  // ── PROFILE PHOTO ───────────────────────────
  const handleProfilePhotoUpload = useCallback(async (source) => {
    let imageAsset = null;
    if (source === 'gallery') {
      imageAsset = await pickImageFromGallery();
    } else {
      imageAsset = await takePhoto();
    }
    if (!imageAsset) return;
    setUploadingPhoto(true);
    const result = await uploadProfilePhoto(userId, imageAsset);
    if (result.success) {
      setProfileImage(result.url);
      await SecureStore.setItemAsync('profileImage', result.url);
      showToast('success', 'Photo Updated! ✅',
        'Profile photo updated!');
    } else {
      showToast('error', 'Upload Failed',
        'Could not upload photo. Try again.');
    }
    setUploadingPhoto(false);
  }, [userId]);

  // ── ROLE HELPERS (memoized) ──────────────────
  const roleData = useMemo(() => {
    const badges = {
      regular:   '👤 Member',
      producer:  '🌾 Harvest Partner',
      seller:    '🏪 Market Seller',
      transport: '🚐 Swift Partner',
      haven:     '🏨 Haven Partner',
      cuisine:   '🍴 Cuisine Partner',
      admin:     '⚙️ Overseer',
    };
    const banners = {
      producer:  '🌾 Verified Harvest Partner',
      seller:    '🏪 Verified Market Seller',
      transport: '🚐 Verified Swift Partner',
      haven:     '🏨 Verified Haven Partner',
      cuisine:   '🍴 Verified Cuisine Partner',
      admin:     '⚙️ Overseer Account',
    };
    const roleColors = {
      producer:  colors.farmerColor,
      seller:    colors.vendorColor,
      transport: colors.riderColor,
      haven:     colors.havenColor,
      cuisine:   colors.cuisineColor,
      admin:     colors.adminColor,
    };
    const roleBgs = {
      producer:  colors.farmerBg,
      seller:    colors.vendorBg,
      transport: colors.riderBg,
      haven:     colors.havenBg,
      cuisine:   colors.cuisineBg,
      admin:     colors.adminBg,
    };
    return {
      badge:  badges[userRole]     || userRole.toUpperCase(),
      banner: banners[userRole]    || '',
      color:  roleColors[userRole] || colors.primary,
      bg:     roleBgs[userRole]    || colors.primaryPale,
    };
  }, [userRole]);

  // ── BOTTOM NAV TABS (memoized) ───────────────
  const navTabs = useMemo(() => {
    if (['producer', 'admin'].includes(userRole)) {
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

  // ── BOTTOM NAV ──────────────────────────────
  const BottomNav = useCallback(() => (
    <View style={styles.bottomNav}>
      {navTabs.map((tab) => {
        const isActive = screen === tab.s;
        return (
          <TouchableOpacity
            key={tab.s}
            style={styles.navItem}
            onPress={() => setScreen(tab.s)}
            activeOpacity={0.7}>
            <View style={styles.navIconWrap}>
              <Text style={[
                styles.navIcon,
                isActive && styles.navIconActive,
              ]}>
                {tab.icon}
              </Text>
              {tab.s === 'market' && cartCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.navLabel,
              isActive && styles.navLabelActive,
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.navDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  ), [screen, cartCount, navTabs]);

  // ============================================
  // SCREEN ROUTER
  // ============================================

  // ── ONBOARDING ──────────────────────────────
  if (showOnboarding) {
    return (
      <OnboardingScreen
        onFinish={async () => {
          await AsyncStorage.setItem('hasSeenOnboarding', 'true');
          setShowOnboarding(false);
          await loadApp();
        }}
      />
    );
  }

  // ── LOADING / OFFLINE ────────────────────────
  if (!appReady || screen === 'loading') {
    return (
      <LoadingScreen
        showRetry={showRetry}
        onRetry={() => {
          setAppReady(false);
          setShowRetry(false);
          prepareApp();
        }}
      />
    );
  }

  // ── PRODUCER DASHBOARD ───────────────────────
  if (screen === 'producer_dash') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <ProducerDashboardScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
        <BottomNav />
      </View>
    );
  }

  // ── ORDERS ───────────────────────────────────
  if (screen === 'orders') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <OrderHistoryScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
        <BottomNav />
      </View>
    );
  }

  // ── FOOD ─────────────────────────────────────
  if (screen === 'restaurants') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <FoodScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
      </View>
    );
  }

  // ── MARKET ───────────────────────────────────
  if (screen === 'market') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <MarketScreen
          userId={userId}
          userRole={userRole}
          onBack={() => setScreen('home')}
          onCartUpdate={(count) => setCartCount(count)}
        />
        <BottomNav />
      </View>
    );
  }

  // ── CART ─────────────────────────────────────
  if (screen === 'cart') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <CartScreen
          userId={userId}
          onBack={() => setScreen('market')}
          onOrderPlaced={() => {
            setCartCount(0);
            setScreen('orders');
          }}
        />
        <BottomNav />
      </View>
    );
  }

  // ── COMING SOON SCREENS ──────────────────────
  if ([
    'ride', 'jobs', 'sos',
    'my_products', 'add_product',
    'wholesale', 'my_store',
    'cuisine_dash', 'haven_dash',
  ].includes(screen)) {
    const cfg = {
      ride:         { icon: '🏎️', title: 'Transport',        color: colors.riderColor   },
      jobs:         { icon: '💼', title: 'Careers',           color: colors.primary      },
      sos:          { icon: '🛡️', title: 'Safety & SOS',      color: colors.danger       },
      my_products:  { icon: '🌾', title: 'My Products',       color: colors.farmerColor  },
      add_product:  { icon: '➕', title: 'Add Product',        color: colors.farmerColor  },
      wholesale:    { icon: '🛒', title: 'Wholesale Market',  color: colors.primary      },
      my_store:     { icon: '🏪', title: 'My Store',          color: colors.vendorColor  },
      cuisine_dash: { icon: '🍴', title: 'Cuisine Dashboard', color: colors.cuisineColor },
      haven_dash:   { icon: '🏨', title: 'Haven Dashboard',   color: colors.havenColor   },
    }[screen];

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <View style={styles.elegantHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setScreen('home')}>
            <Text style={styles.headerBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>
            {cfg.title}
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centerContent}>
          <View style={[styles.comingSoonCircle,
            { backgroundColor: cfg.color + '14' }]}>
            <Text style={styles.comingSoonIcon}>{cfg.icon}</Text>
          </View>
          <Text style={styles.comingSoonTitle}>{cfg.title}</Text>
          <Text style={styles.comingSoonSub}>COMING SOON</Text>
          <View style={[styles.comingSoonBadge,
            { borderColor: cfg.color + '40',
              backgroundColor: cfg.color + '10' }]}>
            <Text style={[styles.comingSoonBadgeText,
              { color: cfg.color }]}>
              We're working on it 🔥
            </Text>
          </View>
          <TouchableOpacity
            style={styles.comingSoonBack}
            onPress={() => setScreen('home')}>
            <Text style={styles.comingSoonBackText}>
              ← Back to Home
            </Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </View>
    );
  }

  // ============================================
  // PROFILE
  // ============================================
  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.dark} barStyle="light-content" />

        {/* Dark header */}
        <View style={styles.profileDarkHeader}>
          <View style={styles.profileDarkHeaderTop}>
            <TouchableOpacity
              style={styles.profileDarkBackBtn}
              onPress={() => setScreen('home')}>
              <Text style={styles.profileDarkBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.profileDarkTitle}>My Profile</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Alert.alert('Update Photo', 'Choose source', [
                {
                  text: '📷 Camera',
                  onPress: () => handleProfilePhotoUpload('camera'),
                },
                {
                  text: '🖼️ Gallery',
                  onPress: () => handleProfilePhotoUpload('gallery'),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}>
            <View style={styles.profileAvatarBig}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileAvatarBigImg}
                />
              ) : (
                <View style={styles.profileAvatarBigImg}>
                  {uploadingPhoto ? (
                    <ActivityIndicator
                      color={colors.primary}
                      size="large"
                    />
                  ) : (
                    <Text style={styles.profileAvatarBigLetter}>
                      {loggedInUser?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.profileCameraCircle}>
                <Text style={{ fontSize: 13 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.profileDarkName}>{loggedInUser}</Text>
          <Text style={styles.profileDarkEmail}>{email}</Text>

          <View style={[styles.profileRolePill, {
            borderColor: roleData.color + '60',
            backgroundColor: roleData.color + '18',
          }]}>
            <Text style={[styles.profileRolePillText,
              { color: roleData.color }]}>
              {roleData.badge}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.profileBody}>

          {/* Stats row */}
          <View style={styles.profileStatsRow}>
            <TouchableOpacity
              style={styles.profileStatBox}
              onPress={() => setScreen('orders')}>
              <Text style={styles.profileStatEmoji}>📦</Text>
              <Text style={styles.profileStatNum}>—</Text>
              <Text style={styles.profileStatLbl}>Orders</Text>
            </TouchableOpacity>
            <View style={styles.profileStatBox}>
              <Text style={styles.profileStatEmoji}>⭐</Text>
              <Text style={styles.profileStatNum}>—</Text>
              <Text style={styles.profileStatLbl}>Reviews</Text>
            </View>
            <View style={styles.profileStatBox}>
              <Text style={styles.profileStatEmoji}>🌴</Text>
              <Text style={styles.profileStatNum}>2025</Text>
              <Text style={styles.profileStatLbl}>Member</Text>
            </View>
          </View>

          {/* Account section */}
          <Text style={styles.profileSecLabel}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.profileMenuRow}
            onPress={() => setScreen('orders')}>
            <View style={[styles.profileMenuIconBox,
              { backgroundColor: colors.primaryPale }]}>
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
            <View style={styles.profileMenuTextWrap}>
              <Text style={styles.profileMenuRowTitle}>Order History</Text>
              <Text style={styles.profileMenuRowSub}>Track all your orders</Text>
            </View>
            <Text style={styles.profileMenuChev}>›</Text>
          </TouchableOpacity>

          {userRole === 'producer' && (
            <TouchableOpacity
              style={styles.profileMenuRow}
              onPress={() => setScreen('producer_dash')}>
              <View style={[styles.profileMenuIconBox,
                { backgroundColor: colors.farmerBg }]}>
                <Text style={{ fontSize: 18 }}>🌾</Text>
              </View>
              <View style={styles.profileMenuTextWrap}>
                <Text style={styles.profileMenuRowTitle}>
                  Producer Dashboard
                </Text>
                <Text style={styles.profileMenuRowSub}>
                  Manage products & orders
                </Text>
              </View>
              <Text style={styles.profileMenuChev}>›</Text>
            </TouchableOpacity>
          )}

          {userRole === 'cuisine' && (
            <TouchableOpacity
              style={styles.profileMenuRow}
              onPress={() => setScreen('cuisine_dash')}>
              <View style={[styles.profileMenuIconBox,
                { backgroundColor: colors.cuisineBg }]}>
                <Text style={{ fontSize: 18 }}>🍴</Text>
              </View>
              <View style={styles.profileMenuTextWrap}>
                <Text style={styles.profileMenuRowTitle}>
                  Cuisine Dashboard
                </Text>
                <Text style={styles.profileMenuRowSub}>
                  Manage restaurant
                </Text>
              </View>
              <Text style={styles.profileMenuChev}>›</Text>
            </TouchableOpacity>
          )}

          {userRole === 'regular' && (
            <TouchableOpacity
              style={[styles.profileMenuRow,
                styles.profileMenuRowHighlight]}
              onPress={() => setScreen('verify')}>
              <View style={[styles.profileMenuIconBox,
                { backgroundColor: colors.primaryPale }]}>
                <Text style={{ fontSize: 18 }}>✦</Text>
              </View>
              <View style={styles.profileMenuTextWrap}>
                <Text style={[styles.profileMenuRowTitle,
                  { color: colors.primary }]}>
                  Become a Partner
                </Text>
                <Text style={styles.profileMenuRowSub}>
                  Harvest · Seller · Swift · Haven
                </Text>
              </View>
              <Text style={[styles.profileMenuChev,
                { color: colors.primary }]}>›</Text>
            </TouchableOpacity>
          )}

          {/* Support section */}
          <Text style={[styles.profileSecLabel, { marginTop: 20 }]}>
            SUPPORT
          </Text>

          <TouchableOpacity style={styles.profileMenuRow}>
            <View style={[styles.profileMenuIconBox,
              { backgroundColor: colors.infoPale }]}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </View>
            <View style={styles.profileMenuTextWrap}>
              <Text style={styles.profileMenuRowTitle}>Help & Support</Text>
              <Text style={styles.profileMenuRowSub}>FAQ and contact us</Text>
            </View>
            <Text style={styles.profileMenuChev}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileMenuRow}>
            <View style={[styles.profileMenuIconBox,
              { backgroundColor: colors.warningPale }]}>
              <Text style={{ fontSize: 18 }}>📋</Text>
            </View>
            <View style={styles.profileMenuTextWrap}>
              <Text style={styles.profileMenuRowTitle}>Terms & Privacy</Text>
              <Text style={styles.profileMenuRowSub}>Legal information</Text>
            </View>
            <Text style={styles.profileMenuChev}>›</Text>
          </TouchableOpacity>

          {/* App footer */}
          <View style={styles.profileAppFooter}>
            <Text style={styles.profileAppBrand}>ZAVARA</Text>
            <Text style={styles.profileAppVersion}>
              Version 4.0.0 · Bohol, Philippines
            </Text>
            <Text style={styles.profileAppTagline}>
              The Island's Pulse 🌴
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.profileLogoutBtn}
            onPress={handleLogout}
            activeOpacity={0.75}>
            <Text style={styles.profileLogoutIcon}>🚪</Text>
            <Text style={styles.profileLogoutTxt}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ============================================
  // VERIFY
  // ============================================
  if (screen === 'verify') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />
        <View style={styles.elegantHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setScreen('profile')}>
            <Text style={styles.headerBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>
            Become a Partner
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={styles.verifyContainer}>
          <Text style={styles.verifyTitle}>Choose Your Path</Text>
          <Text style={styles.verifySubtitle}>
            Join the ZAVARA ecosystem and unlock exclusive
            features for your business in Bohol 🌴
          </Text>

          <View style={styles.verifyNoteCard}>
            <Text style={styles.verifyNoteIcon}>📋</Text>
            <View style={styles.verifyNoteContent}>
              <Text style={styles.verifyNoteTitle}>REQUIREMENTS</Text>
              <Text style={styles.verifyNoteText}>
                Valid ID + Business Documents required.
                Review takes 1-4 hours.
              </Text>
            </View>
          </View>

          {[
            {
              role: 'producer',   icon: '🌾',
              title: 'Harvest Partner',
              subtitle: 'Farmer · Fisherman · Livestock',
              desc: 'Sell your harvest directly to buyers across Bohol',
              color: colors.farmerColor,
              bg: colors.farmerBg,
              docs: 'Valid ID + Barangay Clearance',
              partner_type: 'farmer',
            },
            {
              role: 'seller',     icon: '🏪',
              title: 'Market Seller',
              subtitle: 'Palengke · Sari-sari · Cooperative',
              desc: 'Buy wholesale from producers and sell to customers',
              color: colors.vendorColor,
              bg: colors.vendorBg,
              docs: 'Valid ID + DTI/Business Permit',
              partner_type: 'market_vendor',
            },
            {
              role: 'transport',  icon: '🚐',
              title: 'Swift Partner',
              subtitle: 'Motorcycle · Van · Truck · Courier',
              desc: 'Deliver orders across Bohol',
              color: colors.riderColor,
              bg: colors.riderBg,
              docs: "Valid ID + Driver's License + OR/CR",
              partner_type: 'motorcycle_rider',
            },
            {
              role: 'haven',      icon: '🏨',
              title: 'Haven Partner',
              subtitle: 'Hotel · Resort · Pension · Homestay',
              desc: 'List your property and attract tourists',
              color: colors.havenColor,
              bg: colors.havenBg,
              docs: 'Valid ID + Business Permit',
              partner_type: 'hotel',
            },
            {
              role: 'cuisine',    icon: '🍴',
              title: 'Cuisine Partner',
              subtitle: 'Restaurant · Carinderia · Food Stall',
              desc: 'Reach more customers with food delivery',
              color: colors.cuisineColor,
              bg: colors.cuisineBg,
              docs: 'Valid ID + Business Permit + Sanitary Permit',
              partner_type: 'restaurant',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.role}
              style={[styles.verifyOption, {
                borderLeftWidth: 4,
                borderLeftColor: item.color,
              }]}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  await axios.post(
                    `${API_URL}/verify/apply` +
                    `?user_id=${userId}` +
                    `&requested_role=${item.role}` +
                    `&partner_type=${item.partner_type}` +
                    `&business_name=Pending` +
                    `&description=Application via ZAVARA`,
                    {},
                    { headers: { 'Content-Type': 'application/json' } }
                  );
                  showToast('success',
                    'Application Submitted! ✅',
                    `${item.title} application under review.`
                  );
                  setTimeout(() => setScreen('home'), 1500);
                } catch (error) {
                  if (error.response?.status === 400) {
                    showToast('warning',
                      'Already Applied ⚠️',
                      'You have a pending application.'
                    );
                  } else {
                    showToast('error', 'Error',
                      'Could not apply. Try again.');
                  }
                }
              }}>
              <View style={[styles.verifyIconWrap,
                { backgroundColor: item.bg }]}>
                <Text style={styles.verifyOptionIcon}>{item.icon}</Text>
              </View>
              <View style={styles.verifyOptionContent}>
                <Text style={[styles.verifyOptionTitle,
                  { color: item.color }]}>
                  {item.title}
                </Text>
                <Text style={styles.verifyOptionSubtitle}>
                  {item.subtitle}
                </Text>
                <Text style={styles.verifyOptionDesc}>
                  {item.desc}
                </Text>
                <View style={[styles.verifyDocsBadge,
                  { backgroundColor: item.bg }]}>
                  <Text style={[styles.verifyDocsText,
                    { color: item.color }]}>
                    📎 {item.docs}
                  </Text>
                </View>
              </View>
              <Text style={[styles.verifyArrow,
                { color: item.color }]}>→</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.verifyFooterNote}>
            <Text style={styles.verifyFooterText}>
              🔒 All applications are manually reviewed
              by ZAVARA Overseers for safety and integrity.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============================================
  // REGISTER
  // ============================================
  if (screen === 'register') {
    return (
      <KeyboardAvoidingView
        style={styles.authContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar
          backgroundColor={colors.backgroundWarm}
          barStyle="dark-content"
        />
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.authHeader}>
            <Text style={styles.authBrand}>ZAVARA</Text>
            <View style={styles.authDecoLine} />
            <Text style={styles.authTagline}>CREATE YOUR ACCOUNT</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>Create Account</Text>
            <Text style={styles.authCardSub}>
              Join the ZAVARA community
            </Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan dela Cruz"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="juan@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="09xxxxxxxxx (optional)"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <TouchableOpacity
                style={styles.authButton}
                onPress={handleRegister}
                activeOpacity={0.85}>
                <Text style={styles.authButtonText}>
                  CREATE ACCOUNT
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchAuthBtn}
              onPress={() => setScreen('login')}>
              <Text style={styles.switchAuthText}>
                Already have an account?{' '}
                <Text style={styles.switchAuthLink}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.authFooterText}>
            Built with pride in Bohol 🌴
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ============================================
  // HOME
  // ============================================
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.headerBg} barStyle="dark-content" />

        {/* Header */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.homeBrand}>ZAVARA</Text>
            <Text style={styles.homeWelcome}>
              {getGreeting()}, {loggedInUser} {getGreetingEmoji()}
            </Text>
          </View>
          <View style={styles.homeHeaderRight}>
            {cartCount > 0 && (
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => setScreen('cart')}>
                <Text style={styles.notifIcon}>🛒</Text>
                <View style={styles.headerCartBadge}>
                  <Text style={styles.headerCartBadgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => setScreen('orders')}>
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeAvatar}
              onPress={() => setScreen('profile')}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.homeAvatarImg}
                />
              ) : (
                <Text style={styles.homeAvatarText}>
                  {loggedInUser?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => showToast('info', 'Search',
              'Coming soon! 🔍')}
            activeOpacity={0.8}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Search food, products, services...
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}>

          {/* Role banner */}
          {userRole !== 'regular' && (
            <View style={[styles.roleBannerHome, {
              borderColor: roleData.color + '20',
              backgroundColor: roleData.bg,
            }]}>
              <Text style={{ fontSize: 14 }}>
                {roleData.banner.split(' ')[0]}
              </Text>
              <Text style={[styles.roleBannerHomeText,
                { color: roleData.color }]}>
                {roleData.banner}
              </Text>
            </View>
          )}

          {/* FEATURED */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>FEATURED</Text>
            <Text style={styles.sectionSub}>Exclusive deals</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            decelerationRate="fast"
            snapToInterval={274}>

            <TouchableOpacity
              style={[styles.promoCard, {
                backgroundColor: colors.coralPale,
                borderColor: colors.coral + '20',
              }]}
              onPress={() => setScreen('restaurants')}
              activeOpacity={0.9}>
              <View style={styles.promoCardInner}>
                <Text style={[styles.promoTag,
                  { color: colors.coral }]}>✦ LIMITED</Text>
                <Text style={[styles.promoTitle,
                  { color: colors.textDark }]}>FIRST ORDER</Text>
                <Text style={styles.promoDesc}>
                  50% off your first{'\n'}meal delivery
                </Text>
              </View>
              <View style={styles.promoCardRight}>
                <Text style={styles.promoEmoji}>🍔</Text>
                <View style={[styles.promoCTA,
                  { backgroundColor: colors.coral }]}>
                  <Text style={[styles.promoCTAText,
                    { color: '#FFF' }]}>Order →</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promoCard, {
                backgroundColor: colors.farmerBg,
                borderColor: colors.farmerColor + '20',
              }]}
              onPress={() => setScreen('market')}
              activeOpacity={0.9}>
              <View style={styles.promoCardInner}>
                <Text style={[styles.promoTag,
                  { color: colors.farmerColor }]}>✦ FRESH DAILY</Text>
                <Text style={[styles.promoTitle,
                  { color: colors.textDark }]}>FARM TO TABLE</Text>
                <Text style={styles.promoDesc}>
                  Direct from local{'\n'}Bohol producers
                </Text>
              </View>
              <View style={styles.promoCardRight}>
                <Text style={styles.promoEmoji}>🌾</Text>
                <View style={[styles.promoCTA,
                  { backgroundColor: colors.farmerColor }]}>
                  <Text style={[styles.promoCTAText,
                    { color: '#FFF' }]}>Shop →</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promoCard, {
                backgroundColor: colors.riderBg,
                borderColor: colors.riderColor + '20',
              }]}
              activeOpacity={0.9}>
              <View style={styles.promoCardInner}>
                <Text style={[styles.promoTag,
                  { color: colors.riderColor }]}>✦ COMING SOON</Text>
                <Text style={[styles.promoTitle,
                  { color: colors.textDark }]}>SWIFT RIDES</Text>
                <Text style={styles.promoDesc}>
                  Book a ride{'\n'}anywhere in Bohol
                </Text>
              </View>
              <View style={styles.promoCardRight}>
                <Text style={styles.promoEmoji}>🏍️</Text>
                <View style={[styles.promoCTA,
                  { backgroundColor: colors.riderColor }]}>
                  <Text style={[styles.promoCTAText,
                    { color: '#FFF' }]}>Soon →</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* SERVICES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SERVICES</Text>
            <Text style={styles.sectionSub}>What do you need today?</Text>
          </View>

          <View style={styles.servicesRow}>
            <TouchableOpacity
              style={styles.serviceTileLarge}
              onPress={() => setScreen('restaurants')}
              activeOpacity={0.85}>
              <View style={[styles.serviceIconWrap,
                { backgroundColor: colors.cuisineBg }]}>
                <Text style={styles.serviceIcon}>🍴</Text>
              </View>
              <Text style={styles.serviceTitle}>Cuisine</Text>
              <Text style={styles.serviceDesc}>Order & Delivery</Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>● LIVE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceTileLarge}
              onPress={() => setScreen('market')}
              activeOpacity={0.85}>
              <View style={[styles.serviceIconWrap,
                { backgroundColor: colors.farmerBg }]}>
                <Text style={styles.serviceIcon}>🛒</Text>
              </View>
              <Text style={styles.serviceTitle}>Market</Text>
              <Text style={styles.serviceDesc}>Fresh products</Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>● LIVE</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesRow}>
            {[
              { screen: 'ride', icon: '🚐', title: 'Transport', desc: 'Book a ride' },
              { screen: 'jobs', icon: '💼', title: 'Careers',   desc: 'Find work'   },
            ].map((s) => (
              <TouchableOpacity
                key={s.screen}
                style={styles.serviceTileSmall}
                onPress={() => setScreen(s.screen)}
                activeOpacity={0.85}>
                <Text style={styles.serviceTileSmIcon}>{s.icon}</Text>
                <View>
                  <Text style={styles.serviceTileSmTitle}>{s.title}</Text>
                  <Text style={styles.serviceTileSmDesc}>{s.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.servicesRow}>
            {[
              { screen: 'sos',        icon: '🛡️', title: 'Safety',  desc: 'SOS & Help'     },
              { screen: 'haven_dash', icon: '🏨', title: 'Haven',   desc: 'Hotels & Stays' },
            ].map((s) => (
              <TouchableOpacity
                key={s.screen}
                style={styles.serviceTileSmall}
                onPress={() => setScreen(s.screen)}
                activeOpacity={0.85}>
                <Text style={styles.serviceTileSmIcon}>{s.icon}</Text>
                <View>
                  <Text style={styles.serviceTileSmTitle}>{s.title}</Text>
                  <Text style={styles.serviceTileSmDesc}>{s.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* LIFESTYLE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>LIFESTYLE</Text>
            <Text style={styles.sectionSub}>More coming soon 🔥</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lifestyleScroll}>
            {[
              { icon: '📦', label: 'Padala'  },
              { icon: '🏥', label: 'Health'  },
              { icon: '🏖️', label: 'Tourism' },
              { icon: '💡', label: 'Bills'   },
              { icon: '⛽', label: 'Fuel'    },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.lifestyleChip}
                activeOpacity={0.8}>
                <Text style={styles.lifestyleChipIcon}>
                  {item.icon}
                </Text>
                <Text style={styles.lifestyleChipLabel}>
                  {item.label}
                </Text>
                <View style={styles.lifestyleSoonBadge}>
                  <Text style={styles.lifestyleSoonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* PRODUCER BANNER */}
          {['producer', 'admin'].includes(userRole) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel,
                  { color: colors.farmerColor }]}>
                  🌾 HARVEST DASHBOARD
                </Text>
                <Text style={styles.sectionSub}>
                  Manage your products & orders
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dashBanner, {
                  borderLeftColor: colors.farmerColor,
                  backgroundColor: colors.farmerBg,
                }]}
                onPress={() => setScreen('producer_dash')}
                activeOpacity={0.85}>
                <Text style={styles.dashBannerIcon}>🌾</Text>
                <View style={styles.dashBannerContent}>
                  <Text style={[styles.dashBannerTitle,
                    { color: colors.farmerColor }]}>
                    Open Producer Dashboard
                  </Text>
                  <Text style={styles.dashBannerSub}>
                    Products · Orders · Sales
                  </Text>
                </View>
                <Text style={[styles.dashBannerArrow,
                  { color: colors.farmerColor }]}>→</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CUISINE BANNER */}
          {['cuisine', 'admin'].includes(userRole) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel,
                  { color: colors.cuisineColor }]}>
                  🍴 CUISINE DASHBOARD
                </Text>
                <Text style={styles.sectionSub}>
                  Manage your restaurant
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dashBanner, {
                  borderLeftColor: colors.cuisineColor,
                  backgroundColor: colors.cuisineBg,
                }]}
                onPress={() => setScreen('cuisine_dash')}
                activeOpacity={0.85}>
                <Text style={styles.dashBannerIcon}>🍴</Text>
                <View style={styles.dashBannerContent}>
                  <Text style={[styles.dashBannerTitle,
                    { color: colors.cuisineColor }]}>
                    Open Cuisine Dashboard
                  </Text>
                  <Text style={styles.dashBannerSub}>
                    Menu · Orders · Revenue
                  </Text>
                </View>
                <Text style={[styles.dashBannerArrow,
                  { color: colors.cuisineColor }]}>→</Text>
              </TouchableOpacity>
            </>
          )}

          {/* SELLER DASHBOARD */}
          {['seller', 'admin'].includes(userRole) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel,
                  { color: colors.vendorColor }]}>
                  🏪 SELLER DASHBOARD
                </Text>
              </View>
              <View style={styles.dashRow}>
                {[
                  { s: 'wholesale', icon: '🛒', title: 'Wholesale', sub: 'Buy from producers' },
                  { s: 'my_store',  icon: '🏪', title: 'My Store',  sub: 'Manage products'   },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.s}
                    style={[styles.dashCard,
                      { borderTopColor: colors.vendorColor }]}
                    onPress={() => setScreen(d.s)}
                    activeOpacity={0.85}>
                    <Text style={styles.dashIcon}>{d.icon}</Text>
                    <Text style={styles.dashTitle}>{d.title}</Text>
                    <Text style={styles.dashSub}>{d.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* PARTNER BANNER */}
          {userRole === 'regular' && (
            <TouchableOpacity
              style={styles.partnerBanner}
              onPress={() => setScreen('verify')}
              activeOpacity={0.85}>
              <View style={styles.partnerBannerLeft}>
                <Text style={styles.partnerBannerIcon}>🌴</Text>
                <View>
                  <Text style={styles.partnerBannerTitle}>
                    BECOME A PARTNER
                  </Text>
                  <Text style={styles.partnerBannerSub}>
                    Harvest · Seller · Swift · Haven
                  </Text>
                </View>
              </View>
              <View style={styles.partnerBannerArrowWrap}>
                <Text style={styles.partnerBannerArrow}>→</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View style={styles.homeFooter}>
            <View style={styles.homeFooterLine} />
            <Text style={styles.homeFooterBrand}>ZAVARA</Text>
            <Text style={styles.homeFooterSub}>
              Built with pride in Bohol 🌴
            </Text>
            <Text style={styles.homeFooterVersion}>v4.0.0</Text>
          </View>

        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ============================================
  // LOGIN (DEFAULT)
  // ============================================
  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar
        backgroundColor={colors.backgroundWarm}
        barStyle="dark-content"
      />
      <ScrollView
        contentContainerStyle={styles.authScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={styles.authHeader}>
          <Text style={styles.authBrand}>ZAVARA</Text>
          <View style={styles.authDecoLine} />
          <Text style={styles.authTagline}>THE ISLAND'S PULSE</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authCardTitle}>Welcome Back</Text>
          <Text style={styles.authCardSub}>Login to your account</Text>

          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleLogin}
              activeOpacity={0.85}>
              <Text style={styles.authButtonText}>LOGIN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchAuthBtn}
            onPress={() => setScreen('register')}>
            <Text style={styles.switchAuthText}>
              New to ZAVARA?{' '}
              <Text style={styles.switchAuthLink}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.authFooterText}>
          Built with pride in Bohol 🌴
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── HEADER ──────────────────────────────────
  elegantHeader: {
    backgroundColor: colors.headerBg,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBack: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitleCenter: {
    color: colors.textDark,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── CENTER / COMING SOON ─────────────────────
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  comingSoonCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...shadowMd,
  },
  comingSoonIcon:  { fontSize: 52 },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 6,
  },
  comingSoonSub: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 4,
    marginBottom: 20,
  },
  comingSoonBadge: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginBottom: 24,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  comingSoonBack: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  comingSoonBackText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── HOME HEADER ─────────────────────────────
  homeHeader: {
    backgroundColor: colors.headerBg,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  homeBrand: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 6,
  },
  homeWelcome: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  homeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    position: 'relative',
  },
  notifIcon: { fontSize: 18 },
  headerCartBadge: {
    position: 'absolute',
    top: -4, right: -4,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBackground,
    paddingHorizontal: 3,
  },
  headerCartBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },
  homeAvatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadowGold,
  },
  homeAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  homeAvatarText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 18,
  },

  // ── SEARCH ──────────────────────────────────
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.headerBg,
  },
  searchBar: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchIcon:        { fontSize: 16 },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },

  // ── ROLE BANNER ─────────────────────────────
  roleBannerHome: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  roleBannerHomeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── SECTION HEADER ──────────────────────────
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 12,
  },
  sectionLabel: {
    color: colors.textDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionSub: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 3,
  },

  // ── PROMO CARDS ─────────────────────────────
  carouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoCard: {
    width: 260,
    height: 148,
    borderRadius: borderRadius.xxlarge,
    padding: 18,
    marginRight: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    ...shadowMd,
  },
  promoCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  promoCardRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  promoEmoji:  { fontSize: 40, marginBottom: 8 },
  promoTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  promoDesc: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
  },
  promoCTA: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    ...shadow,
  },
  promoCTAText: { fontSize: 10, fontWeight: '900' },

  // ── SERVICES ────────────────────────────────
  servicesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  serviceTileLarge: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  serviceIconWrap: {
    width: 54, height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  serviceIcon:  { fontSize: 28 },
  serviceTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  serviceDesc: {
    color: colors.textLight,
    fontSize: 11,
    marginBottom: 12,
  },
  availableBadge: {
    backgroundColor: colors.successPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.success + '25',
  },
  availableBadgeText: {
    color: colors.success,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  serviceTileSmall: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  serviceTileSmIcon:  { fontSize: 26 },
  serviceTileSmTitle: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  serviceTileSmDesc: {
    color: colors.textLight,
    fontSize: 10,
  },

  // ── LIFESTYLE ───────────────────────────────
  lifestyleScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  lifestyleChip: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  lifestyleChipIcon:  { fontSize: 24, marginBottom: 6 },
  lifestyleChipLabel: {
    color: colors.textMedium,
    fontSize: 10,
    fontWeight: '700',
  },
  lifestyleSoonBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  lifestyleSoonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '900',
  },

  // ── DASHBOARD ───────────────────────────────
  dashBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: borderRadius.xlarge,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    ...shadowMd,
  },
  dashBannerIcon:    { fontSize: 32, marginRight: 14 },
  dashBannerContent: { flex: 1 },
  dashBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  dashBannerSub: { color: colors.textLight, fontSize: 11 },
  dashBannerArrow: { fontSize: 20, fontWeight: '900' },

  dashRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 12,
  },
  dashCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    ...shadowMd,
  },
  dashIcon:  { fontSize: 30, marginBottom: 12 },
  dashTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  dashSub: { color: colors.textLight, fontSize: 11 },

  // ── PARTNER BANNER ──────────────────────────
  partnerBanner: {
    backgroundColor: colors.primaryPale,
    marginHorizontal: 20,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadow,
  },
  partnerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  partnerBannerIcon:  { fontSize: 30 },
  partnerBannerTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 3,
  },
  partnerBannerSub: { color: colors.textLight, fontSize: 10 },
  partnerBannerArrowWrap: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  partnerBannerArrow: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '900',
  },

  // ── HOME FOOTER ─────────────────────────────
  homeFooter: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  homeFooterLine: {
    width: 40, height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  homeFooterBrand: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 5,
  },
  homeFooterSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  homeFooterVersion: {
    color: colors.borderMedium,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 2,
  },

  // ── BOTTOM NAV ──────────────────────────────
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 66,
    backgroundColor: colors.navBg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.navBorder,
    ...shadowMd,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  navIconWrap: {
    position: 'relative',
    marginBottom: 3,
  },
  navIcon:       { fontSize: 20 },
  navIconActive: { fontSize: 22 },
  navLabel: {
    fontSize: 9,
    color: colors.navInactive,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    fontSize: 9,
    color: colors.navActive,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  navDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  navBadge: {
    position: 'absolute',
    top: -6, right: -8,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navBg,
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: colors.textWhite,
    fontSize: 8,
    fontWeight: '900',
  },

  // ── AUTH ────────────────────────────────────
  authContainer: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 36,
  },
  authBrand: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 10,
    marginBottom: 12,
  },
  authDecoLine: {
    width: 50, height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginBottom: 12,
  },
  authTagline: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  authCardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 4,
  },
  authCardSub: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 24,
  },
  inputLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 6,
  },
  inputWrap: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textDark,
  },
  // 🆕 Eye toggle button
  eyeBtn: {
    padding: 8,
    marginRight: -4,
  },
  eyeIcon: { fontSize: 16 },

  authButton: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 8,
    ...shadowGold,
  },
  authButtonText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  switchAuthBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchAuthText: { color: colors.textLight, fontSize: 13 },
  switchAuthLink: { color: colors.primary, fontWeight: '800' },
  authFooterText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 28,
    letterSpacing: 1,
  },

  // ── PROFILE ─────────────────────────────────
  profileDarkHeader: {
    backgroundColor: colors.dark,
    paddingTop: 52,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...shadowDark,
  },
  profileDarkHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  profileDarkBackBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  profileDarkBackText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  profileDarkTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileAvatarBig: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatarBigImg: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  profileAvatarBigLetter: {
    fontSize: 40,
    color: colors.primary,
    fontWeight: '900',
  },
  profileCameraCircle: {
    position: 'absolute',
    bottom: 0, right: -4,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.dark,
    ...shadowGold,
  },
  profileDarkName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textCream,
    marginBottom: 5,
  },
  profileDarkEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  profileRolePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  profileRolePillText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  profileBody: {
    padding: 20,
    paddingBottom: 100,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    marginTop: -14,
  },
  profileStatBox: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  profileStatEmoji: { fontSize: 20, marginBottom: 6 },
  profileStatNum: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  profileStatLbl: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileSecLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  profileMenuRow: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  profileMenuRowHighlight: {
    borderColor: colors.borderGold,
    backgroundColor: colors.primaryPale,
  },
  profileMenuIconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 14,
  },
  profileMenuTextWrap: { flex: 1 },
  profileMenuRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  profileMenuRowSub: { fontSize: 11, color: colors.textLight },
  profileMenuChev: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  profileAppFooter: {
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 8,
  },
  profileAppBrand: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 5,
  },
  profileAppVersion: {
    color: colors.borderMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileAppTagline: { color: colors.textMuted, fontSize: 11 },
  profileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.danger + '35',
    backgroundColor: colors.danger + '08',
    marginBottom: 10,
  },
  profileLogoutIcon: { fontSize: 16 },
  profileLogoutTxt: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── VERIFY ──────────────────────────────────
  verifyContainer:  { padding: 24 },
  verifyTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 6,
  },
  verifySubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  verifyNoteCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.large,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  verifyNoteIcon:    { fontSize: 26 },
  verifyNoteContent: { flex: 1 },
  verifyNoteTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  verifyNoteText: {
    color: colors.textMedium,
    fontSize: 11,
    lineHeight: 16,
  },
  verifyOption: {
    backgroundColor: colors.cardBackground,
    padding: 18,
    borderRadius: borderRadius.xlarge,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  verifyIconWrap: {
    width: 50, height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  verifyOptionIcon:    { fontSize: 24 },
  verifyOptionContent: { flex: 1 },
  verifyOptionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  verifyOptionSubtitle: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  verifyOptionDesc: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
    marginBottom: 8,
  },
  verifyDocsBadge: {
    borderRadius: borderRadius.small,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  verifyDocsText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
  },
  verifyArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  verifyFooterNote: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyFooterText: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
});