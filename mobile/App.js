import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import axios from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FoodScreen from './screens/FoodScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OnboardingScreen from './screens/OnboardingScreen';
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
  shadowLg,
  shadowDark,
  shadowStrong,
  shadowGold,
  borderRadius,
  fonts,
} from './theme';

LogBox.ignoreLogs(['Warning:']);
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const API_URL = 'https://onebohol-production.up.railway.app';

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
function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: 80,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={LS.container}>
      <StatusBar
        backgroundColor={colors.backgroundWarm}
        barStyle="dark-content"
      />
      <Animated.View style={[LS.topDeco,
        { opacity: taglineOpacity }]}>
        <View style={LS.decoLine} />
        <Text style={LS.decoText}>EST. 2024</Text>
        <View style={LS.decoLine} />
      </Animated.View>
      <Animated.View style={[LS.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <Animated.Text style={[LS.brand, {
          opacity: shimmer.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.7, 1],
          }),
        }]}>
          ZAVARA
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[LS.line,
        { width: lineWidth }]} />
      <Animated.Text style={[LS.tagline,
        { opacity: taglineOpacity }]}>
        THE ISLAND'S PULSE
      </Animated.Text>
      <Animated.View style={[LS.loadingWrap,
        { opacity: bottomOpacity }]}>
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      </Animated.View>
      <Animated.View style={[LS.bottomWrap,
        { opacity: bottomOpacity }]}>
        <Text style={LS.bottomText}>
          Bohol's Super App 🌴
        </Text>
      </Animated.View>
    </View>
  );
}

const LS = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topDeco: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  decoLine: {
    width: 35,
    height: 1,
    backgroundColor: colors.borderMedium,
    marginHorizontal: 12,
  },
  decoText: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 4,
    fontWeight: '700',
  },
  logoWrap: { marginBottom: 20 },
  brand: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 14,
  },
  line: {
    height: 2,
    backgroundColor: colors.primary,
    marginBottom: 16,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 5,
    marginBottom: 50,
    fontWeight: '600',
  },
  loadingWrap: { marginBottom: 60 },
  bottomWrap: {
    position: 'absolute',
    bottom: 50,
  },
  bottomText: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
});

// ============================================
// MAIN APP CONTENT
// ============================================
function AppContent() {

  // ── STATES ────────────────────────────────
  const [screen, setScreen] = useState('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('regular');
  const [appReady, setAppReady] = useState(false);
  const [location, setLocation] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { prepareApp(); }, []);

  // ── APP STARTUP ───────────────────────────
  const prepareApp = async () => {
    try {
      await new Promise(r => setTimeout(r, 2500));
      await SplashScreen.hideAsync();
      const hasSeenOnboarding = await AsyncStorage.getItem(
        'hasSeenOnboarding'
      );
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
        setAppReady(true);
        return;
      }
      await loadApp();
    } catch {
      setScreen('login');
    } finally {
      setAppReady(true);
    }
  };

  const loadApp = async () => {
    try {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc =
            await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch {}

      const savedEmail =
        await SecureStore.getItemAsync('userEmail');
      const savedPassword =
        await SecureStore.getItemAsync('userPassword');

      if (savedEmail && savedPassword) {
        try {
          const res = await axios.post(
            `${API_URL}/users/login`,
            { email: savedEmail, password: savedPassword },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );
          setLoggedInUser(res.data.user_name);
          setUserId(res.data.user_id);
          setUserRole(res.data.role);
          setEmail(savedEmail);
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
    }
  };

  // ── AUTH HELPERS ──────────────────────────
  const saveLogin = async (e, p, n, i, r) => {
    await SecureStore.setItemAsync('userEmail', e);
    await SecureStore.setItemAsync('userPassword', p);
    await SecureStore.setItemAsync('userName', n);
    await SecureStore.setItemAsync('userId', i.toString());
    await SecureStore.setItemAsync('userRole', r);
  };

  const clearLogin = async () => {
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userPassword');
    await SecureStore.deleteItemAsync('userName');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userRole');
  };

  // ── LOGIN ─────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/users/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      setLoggedInUser(res.data.user_name);
      setUserId(res.data.user_id);
      setUserRole(res.data.role);
      await saveLogin(
        email, password,
        res.data.user_name,
        res.data.user_id,
        res.data.role
      );
      showToast('success', 'Welcome Back! 👋',
        `Good to see you, ${res.data.user_name}!`);
      setTimeout(() => setScreen('home'), 1000);
    } catch {
      showToast('error', 'Login Failed',
        'Invalid email or password');
    }
    setLoading(false);
  };
  // After successful login add this:
useEffect(() => {
  if (userId) {
    // Register for push notifications
    registerForPushNotifications(userId);

    // Setup listeners
    const listeners = setupNotificationListeners(
      (notification) => {
        console.log('Got notification!', notification);
      },
      (response) => {
        // Navigate based on notification data
        const data = response.notification
          .request.content.data;
        if (data.order_id) {
          setScreen('orders');
        }
      }
    );

    return () => {
      removeNotificationListeners(listeners);
    };
  }
}, [userId]);

  // ── REGISTER ──────────────────────────────
  const handleRegister = async () => {
    if (!name || !email || !password) {
      showToast('warning', 'Missing Fields',
        'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/users/register`,
        { name, email, password, phone },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      showToast('success', 'Account Created! 🎉',
        'Welcome to ZAVARA! Please login.');
      setTimeout(() => setScreen('login'), 1500);
    } catch {
      showToast('error', 'Registration Failed',
        'Email may already be registered.');
    }
    setLoading(false);
  };

  // ── LOGOUT ────────────────────────────────
  const handleLogout = async () => {
    await clearLogin();
    showToast('info', 'Logged Out',
      'See you next time! 👋');
    setTimeout(() => {
      setScreen('login');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setLoggedInUser('');
      setUserId(null);
      setUserRole('regular');
      setProfileImage(null);
    }, 1000);
  };

  // ── PROFILE PHOTO UPLOAD ──────────────────
  const handleProfilePhotoUpload = async (source) => {
    let imageAsset = null;
    if (source === 'gallery') {
      imageAsset = await pickImageFromGallery();
    } else {
      imageAsset = await takePhoto();
    }
    if (!imageAsset) return;

    setUploadingPhoto(true);
    const result = await uploadProfilePhoto(
      userId,
      imageAsset
    );
    if (result.success) {
      setProfileImage(result.url);
      showToast('success', 'Photo Updated! ✅',
        'Your profile photo has been updated!');
    } else {
      showToast('error', 'Upload Failed',
        'Could not upload photo. Try again.');
    }
    setUploadingPhoto(false);
  };

  // ── ROLE HELPERS ──────────────────────────
  const getRoleBadge = () => {
    const badges = {
      regular:   '👤 Member',
      producer:  '🌾 Harvest Partner',
      seller:    '🏪 Market Seller',
      transport: '🚐 Swift Partner',
      haven:     '🏨 Haven Partner',
      cuisine:   '🍴 Cuisine Partner',
      admin:     '⚙️ Overseer',
    };
    return badges[userRole] || userRole.toUpperCase();
  };

  const getRoleBanner = () => {
    const banners = {
      producer:  '🌾 Verified Harvest Partner',
      seller:    '🏪 Verified Market Seller',
      transport: '🚐 Verified Swift Partner',
      haven:     '🏨 Verified Haven Partner',
      cuisine:   '🍴 Verified Cuisine Partner',
      admin:     '⚙️ Overseer Account',
    };
    return banners[userRole] || '';
  };

  const getRoleColor = () => {
    const c = {
      producer:  colors.farmerColor,
      seller:    colors.vendorColor,
      transport: colors.riderColor,
      haven:     colors.havenColor,
      cuisine:   colors.cuisineColor,
      admin:     colors.adminColor,
    };
    return c[userRole] || colors.primary;
  };

  const getRoleBg = () => {
    const b = {
      producer:  colors.farmerBg,
      seller:    colors.vendorBg,
      transport: colors.riderBg,
      haven:     colors.havenBg,
      cuisine:   colors.cuisineBg,
      admin:     colors.adminBg,
    };
    return b[userRole] || colors.primaryPale;
  };

  // ── BOTTOM NAV ────────────────────────────
  const BottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        { s: 'home',        icon: '🏠', label: 'Home'   },
        { s: 'restaurants', icon: '🍴', label: 'Food'   },
        { s: 'orders',      icon: '📦', label: 'Orders' },
        { s: 'profile',     icon: '👤', label: 'Me'     },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.s}
          style={styles.navItem}
          onPress={() => setScreen(tab.s)}>
          <Text style={[
            styles.navIcon,
            screen === tab.s && styles.navIconActive,
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.navLabel,
            screen === tab.s && styles.navLabelActive,
          ]}>
            {tab.label}
          </Text>
          {screen === tab.s && (
            <View style={styles.navDot} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ============================================
  // ONBOARDING
  // ============================================
  if (showOnboarding) {
    return (
      <OnboardingScreen
        onFinish={async () => {
          await AsyncStorage.setItem(
            'hasSeenOnboarding', 'true'
          );
          setShowOnboarding(false);
          await loadApp();
        }}
      />
    );
  }

  // ============================================
  // LOADING
  // ============================================
  if (!appReady || screen === 'loading') {
    return <LoadingScreen />;
  }

  // ============================================
  // ORDERS
  // ============================================
  if (screen === 'orders') {
    return (
      <View style={styles.container}>
        <OrderHistoryScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
        <BottomNav />
      </View>
    );
  }

  // ============================================
  // FOOD
  // ============================================
  if (screen === 'restaurants') {
    return (
      <FoodScreen
        userId={userId}
        onBack={() => setScreen('home')}
      />
    );
  }

  // ============================================
  // COMING SOON
  // ============================================
  if ([
    'ride', 'jobs', 'sos',
    'my_products', 'add_product',
    'wholesale', 'my_store',
  ].includes(screen)) {
    const cfg = {
      ride: {
        icon: '🏎️', title: 'Transport',
        color: colors.riderColor,
      },
      jobs: {
        icon: '💼', title: 'Careers',
        color: colors.primary,
      },
      sos: {
        icon: '🛡️', title: 'Safety & SOS',
        color: colors.danger,
      },
      my_products: {
        icon: '🌾', title: 'My Products',
        color: colors.farmerColor,
      },
      add_product: {
        icon: '➕', title: 'Add Product',
        color: colors.farmerColor,
      },
      wholesale: {
        icon: '🛒', title: 'Wholesale Market',
        color: colors.primary,
      },
      my_store: {
        icon: '🏪', title: 'My Store',
        color: colors.vendorColor,
      },
    }[screen];

    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.elegantHeader}>
          <TouchableOpacity
            onPress={() => setScreen('home')}>
            <Text style={styles.headerBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>
            {cfg.title}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.centerContent}>
          <View style={[styles.comingSoonCircle,
            { backgroundColor: cfg.color + '12' }]}>
            <Text style={styles.comingSoonIcon}>
              {cfg.icon}
            </Text>
          </View>
          <Text style={styles.comingSoonTitle}>
            {cfg.title}
          </Text>
          <Text style={styles.comingSoonSub}>
            COMING SOON
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>
              We're working on it 🔥
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ============================================
  // PROFILE
  // ============================================
  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.elegantHeader}>
          <TouchableOpacity
            onPress={() => setScreen('home')}>
            <Text style={styles.headerBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>
            My Profile
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={[
          styles.profileContainer,
          { paddingBottom: 90 },
        ]}>

          {/* AVATAR WITH UPLOAD */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Update Profile Photo',
                'Choose a source',
                [
                  {
                    text: '📷 Camera',
                    onPress: () =>
                      handleProfilePhotoUpload('camera'),
                  },
                  {
                    text: '🖼️ Gallery',
                    onPress: () =>
                      handleProfilePhotoUpload('gallery'),
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ]
              );
            }}>
            <View style={styles.profileAvatarWrap}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileAvatar}
                />
              ) : (
                <View style={styles.profileAvatar}>
                  {uploadingPhoto ? (
                    <ActivityIndicator
                      color={colors.textWhite}
                      size="large"
                    />
                  ) : (
                    <Text style={styles.profileAvatarText}>
                      {loggedInUser.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.profileCameraBtn}>
                <Text style={styles.profileCameraBtnText}>
                  📷
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {loggedInUser}
          </Text>
          <Text style={styles.profileEmail}>{email}</Text>

          <View style={[styles.roleBadge, {
            borderColor: getRoleColor() + '30',
            backgroundColor: getRoleBg(),
          }]}>
            <Text style={[styles.roleBadgeText,
              { color: getRoleColor() }]}>
              {getRoleBadge()}
            </Text>
          </View>

          {/* MEMBER SINCE */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>
              MEMBER SINCE
            </Text>
            <Text style={styles.infoValue}>
              🗓️ May 2025
            </Text>
            <Text style={styles.infoSub}>
              ZAVARA Early Member 🌴
            </Text>
          </View>

          {/* PLATFORM */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PLATFORM</Text>
            <Text style={styles.infoValue}>
              🌴 ZAVARA — The Island's Pulse
            </Text>
            <Text style={styles.infoSub}>
              Version 1.0.0 · Bohol, Philippines
            </Text>
          </View>

          {/* BUTTONS */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen('orders')}>
            <Text style={styles.primaryButtonText}>
              📦 MY ORDER HISTORY
            </Text>
          </TouchableOpacity>

          {userRole === 'regular' && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setScreen('verify')}>
              <Text style={styles.outlineButtonText}>
                ✦ BECOME A VERIFIED PARTNER
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLogout}>
            <Text style={styles.dangerButtonText}>
              LOGOUT
            </Text>
          </TouchableOpacity>

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
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.elegantHeader}>
          <TouchableOpacity
            onPress={() => setScreen('profile')}>
            <Text style={styles.headerBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>
            Become a Partner
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.verifyContainer}>
          <Text style={styles.verifyTitle}>
            Choose Your Path
          </Text>
          <Text style={styles.verifySubtitle}>
            Join the ZAVARA ecosystem and unlock exclusive
            features for your business in Bohol 🌴
          </Text>

          <View style={styles.verifyNoteCard}>
            <Text style={styles.verifyNoteIcon}>📋</Text>
            <View style={styles.verifyNoteContent}>
              <Text style={styles.verifyNoteTitle}>
                REQUIREMENTS
              </Text>
              <Text style={styles.verifyNoteText}>
                Valid ID + Business Documents required.
                Review takes 1-4 hours.
              </Text>
            </View>
          </View>

          {[
            {
              role: 'producer', icon: '🌾',
              title: 'Harvest Partner',
              subtitle: 'Farmer · Fisherman · Livestock',
              desc: 'Sell your harvest directly to buyers across Bohol',
              color: colors.farmerColor,
              bg: colors.farmerBg,
              docs: 'Valid ID + Barangay Clearance + Farm Photo',
              partner_type: 'farmer',
            },
            {
              role: 'seller', icon: '🏪',
              title: 'Market Seller',
              subtitle: 'Palengke · Sari-sari · Cooperative',
              desc: 'Buy wholesale from producers and sell to customers',
              color: colors.vendorColor,
              bg: colors.vendorBg,
              docs: 'Valid ID + DTI/Business Permit + Stall Photo',
              partner_type: 'market_vendor',
            },
            {
              role: 'transport', icon: '🚐',
              title: 'Swift Partner',
              subtitle: 'Motorcycle · Van · Truck · Courier',
              desc: 'Deliver orders and transport goods across Bohol',
              color: colors.riderColor,
              bg: colors.riderBg,
              docs: "Valid ID + Driver's License + OR/CR",
              partner_type: 'motorcycle_rider',
            },
            {
              role: 'haven', icon: '🏨',
              title: 'Haven Partner',
              subtitle: 'Hotel · Resort · Pension · Homestay',
              desc: 'List your property and attract tourists',
              color: colors.havenColor,
              bg: colors.havenBg,
              docs: 'Valid ID + Business Permit + DOT Accreditation',
              partner_type: 'hotel',
            },
            {
              role: 'cuisine', icon: '🍴',
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
                    {
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    }
                  );
                  showToast('success',
                    'Application Submitted! ✅',
                    `Your ${item.title} application is under review.`
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
                <Text style={styles.verifyOptionIcon}>
                  {item.icon}
                </Text>
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
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }>
        <StatusBar
          backgroundColor={colors.backgroundWarm}
          barStyle="dark-content"
        />
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled">

          <View style={styles.authHeader}>
            <Text style={styles.authBrand}>ZAVARA</Text>
            <View style={styles.authDecoLine} />
            <Text style={styles.authTagline}>
              CREATE YOUR ACCOUNT
            </Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>
              Create Account
            </Text>
            <Text style={styles.authCardSub}>
              Join the ZAVARA community
            </Text>

            <Text style={styles.inputLabel}>
              FULL NAME
            </Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan dela Cruz"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>
              EMAIL ADDRESS
            </Text>
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
              />
            </View>

            <Text style={styles.inputLabel}>
              PHONE NUMBER
            </Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="09xxxxxxxxx"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.inputLabel}>
              PASSWORD
            </Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
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
                onPress={handleRegister}>
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
                <Text style={styles.switchAuthLink}>
                  Login here
                </Text>
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
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />

        {/* HOME HEADER */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.homeBrand}>ZAVARA</Text>
            <Text style={styles.homeWelcome}>
              {getGreeting()}, {loggedInUser}{' '}
              {getGreetingEmoji()}
            </Text>
          </View>
          <View style={styles.homeHeaderRight}>
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
                  {loggedInUser.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Search food, services, stores...
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}>

          {/* ROLE BANNER */}
          {userRole !== 'regular' && (
            <View style={[styles.roleBannerHome, {
              borderColor: getRoleColor() + '20',
              backgroundColor: getRoleBg(),
            }]}>
              <Text style={[styles.roleBannerHomeText,
                { color: getRoleColor() }]}>
                {getRoleBanner()}
              </Text>
            </View>
          )}

          {/* FEATURED */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              FEATURED
            </Text>
            <Text style={styles.sectionSub}>
              Exclusive deals
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.carouselContent
            }>

            <TouchableOpacity
              style={[styles.promoCard, {
                backgroundColor: colors.coralPale,
                borderColor: colors.coral + '20',
              }]}
              onPress={() => setScreen('restaurants')}>
              <View style={styles.promoCardInner}>
                <Text style={[styles.promoTag,
                  { color: colors.coral }]}>
                  ✦ LIMITED
                </Text>
                <Text style={[styles.promoTitle,
                  { color: colors.textDark }]}>
                  FIRST ORDER
                </Text>
                <Text style={styles.promoDesc}>
                  50% off your first{'\n'}meal delivery
                </Text>
              </View>
              <View style={styles.promoCardRight}>
                <Text style={styles.promoEmoji}>🍔</Text>
                <View style={[styles.promoCTA,
                  { backgroundColor: colors.coral }]}>
                  <Text style={[styles.promoCTAText,
                    { color: '#FFF' }]}>
                    Order →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {(userRole === 'producer' ||
              userRole === 'seller' ||
              userRole === 'admin') && (
              <TouchableOpacity
                style={[styles.promoCard, {
                  backgroundColor: colors.farmerBg,
                  borderColor: colors.farmerColor + '20',
                }]}>
                <View style={styles.promoCardInner}>
                  <Text style={[styles.promoTag,
                    { color: colors.farmerColor }]}>
                    ✦ WHOLESALE
                  </Text>
                  <Text style={[styles.promoTitle,
                    { color: colors.textDark }]}>
                    FARM TO TABLE
                  </Text>
                  <Text style={styles.promoDesc}>
                    Direct from local{'\n'}Bohol producers
                  </Text>
                </View>
                <View style={styles.promoCardRight}>
                  <Text style={styles.promoEmoji}>🌾</Text>
                  <View style={[styles.promoCTA, {
                    backgroundColor: colors.farmerColor,
                  }]}>
                    <Text style={[styles.promoCTAText,
                      { color: '#FFF' }]}>
                      Browse →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.promoCard, {
                backgroundColor: colors.riderBg,
                borderColor: colors.riderColor + '20',
              }]}>
              <View style={styles.promoCardInner}>
                <Text style={[styles.promoTag,
                  { color: colors.riderColor }]}>
                  ✦ COMING SOON
                </Text>
                <Text style={[styles.promoTitle,
                  { color: colors.textDark }]}>
                  SWIFT RIDES
                </Text>
                <Text style={styles.promoDesc}>
                  Book a ride{'\n'}anywhere in Bohol
                </Text>
              </View>
              <View style={styles.promoCardRight}>
                <Text style={styles.promoEmoji}>🏍️</Text>
                <View style={[styles.promoCTA, {
                  backgroundColor: colors.riderColor,
                }]}>
                  <Text style={[styles.promoCTAText,
                    { color: '#FFF' }]}>
                    Soon →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

          </ScrollView>

          {/* SERVICES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              SERVICES
            </Text>
            <Text style={styles.sectionSub}>
              What do you need today?
            </Text>
          </View>

          <View style={styles.servicesRow}>
            <TouchableOpacity
              style={styles.serviceTileLarge}
              onPress={() => setScreen('restaurants')}>
              <View style={[styles.serviceIconWrap,
                { backgroundColor: colors.cuisineBg }]}>
                <Text style={styles.serviceIcon}>🍴</Text>
              </View>
              <Text style={styles.serviceTitle}>
                Cuisine
              </Text>
              <Text style={styles.serviceDesc}>
                Order & Delivery
              </Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>
                  AVAILABLE
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceTileLarge}
              onPress={() => setScreen('ride')}>
              <View style={[styles.serviceIconWrap,
                { backgroundColor: colors.riderBg }]}>
                <Text style={styles.serviceIcon}>🚐</Text>
              </View>
              <Text style={styles.serviceTitle}>
                Transport
              </Text>
              <Text style={styles.serviceDesc}>
                Book a ride
              </Text>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>
                  SOON
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesRow}>
            <TouchableOpacity
              style={styles.serviceTileSmall}
              onPress={() => setScreen('jobs')}>
              <Text style={styles.serviceTileSmIcon}>
                💼
              </Text>
              <View>
                <Text style={styles.serviceTileSmTitle}>
                  Careers
                </Text>
                <Text style={styles.serviceTileSmDesc}>
                  Find work
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceTileSmall}
              onPress={() => setScreen('sos')}>
              <Text style={styles.serviceTileSmIcon}>
                🛡️
              </Text>
              <View>
                <Text style={styles.serviceTileSmTitle}>
                  Safety
                </Text>
                <Text style={styles.serviceTileSmDesc}>
                  SOS & Help
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* LIFESTYLE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              LIFESTYLE
            </Text>
            <Text style={styles.sectionSub}>
              More coming soon 🔥
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.lifestyleScroll
            }>
            {[
              { icon: '📦', label: 'Padala'  },
              { icon: '🏥', label: 'Health'  },
              { icon: '🏖️', label: 'Tourism' },
              { icon: '💡', label: 'Bills'   },
              { icon: '⛽', label: 'Fuel'    },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipIcon}>
                  {item.icon}
                </Text>
                <Text style={styles.lifestyleChipLabel}>
                  {item.label}
                </Text>
                <View style={styles.lifestyleSoonBadge}>
                  <Text style={styles.lifestyleSoonText}>
                    Soon
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* PRODUCER DASHBOARD */}
          {(userRole === 'producer' ||
            userRole === 'admin') && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel,
                  { color: colors.farmerColor }]}>
                  🌾 HARVEST DASHBOARD
                </Text>
                <Text style={styles.sectionSub}>
                  Manage your products
                </Text>
              </View>
              <View style={styles.dashRow}>
                <TouchableOpacity
                  style={[styles.dashCard, {
                    borderTopColor: colors.farmerColor,
                  }]}
                  onPress={() =>
                    setScreen('my_products')}>
                  <Text style={styles.dashIcon}>🌾</Text>
                  <Text style={styles.dashTitle}>
                    My Products
                  </Text>
                  <Text style={styles.dashSub}>
                    Manage listings
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dashCard, {
                    borderTopColor: colors.farmerColor,
                  }]}
                  onPress={() =>
                    setScreen('add_product')}>
                  <Text style={styles.dashIcon}>➕</Text>
                  <Text style={styles.dashTitle}>
                    Add Product
                  </Text>
                  <Text style={styles.dashSub}>
                    List new harvest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SELLER DASHBOARD */}
          {(userRole === 'seller' ||
            userRole === 'admin') && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel,
                  { color: colors.vendorColor }]}>
                  🏪 SELLER DASHBOARD
                </Text>
                <Text style={styles.sectionSub}>
                  Buy wholesale & manage store
                </Text>
              </View>
              <View style={styles.dashRow}>
                <TouchableOpacity
                  style={[styles.dashCard, {
                    borderTopColor: colors.vendorColor,
                  }]}
                  onPress={() =>
                    setScreen('wholesale')}>
                  <Text style={styles.dashIcon}>🛒</Text>
                  <Text style={styles.dashTitle}>
                    Wholesale
                  </Text>
                  <Text style={styles.dashSub}>
                    Buy from producers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dashCard, {
                    borderTopColor: colors.vendorColor,
                  }]}
                  onPress={() =>
                    setScreen('my_store')}>
                  <Text style={styles.dashIcon}>🏪</Text>
                  <Text style={styles.dashTitle}>
                    My Store
                  </Text>
                  <Text style={styles.dashSub}>
                    Manage products
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PARTNER BANNER */}
          {userRole === 'regular' && (
            <TouchableOpacity
              style={styles.partnerBanner}
              onPress={() => setScreen('verify')}>
              <View style={styles.partnerBannerLeft}>
                <Text style={styles.partnerBannerIcon}>
                  🌴
                </Text>
                <View>
                  <Text style={styles.partnerBannerTitle}>
                    BECOME A PARTNER
                  </Text>
                  <Text style={styles.partnerBannerSub}>
                    Harvest · Seller · Swift · Haven
                  </Text>
                </View>
              </View>
              <View style={
                styles.partnerBannerArrowWrap}>
                <Text style={styles.partnerBannerArrow}>
                  →
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* FOOTER */}
          <View style={styles.homeFooter}>
            <View style={styles.homeFooterLine} />
            <Text style={styles.homeFooterBrand}>
              ZAVARA
            </Text>
            <Text style={styles.homeFooterSub}>
              Built with pride in Bohol 🌴
            </Text>
            <Text style={styles.homeFooterVersion}>
              v2.0.0
            </Text>
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
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }>
      <StatusBar
        backgroundColor={colors.backgroundWarm}
        barStyle="dark-content"
      />
      <ScrollView
        contentContainerStyle={styles.authScroll}
        keyboardShouldPersistTaps="handled">

        <View style={styles.authHeader}>
          <Text style={styles.authBrand}>ZAVARA</Text>
          <View style={styles.authDecoLine} />
          <Text style={styles.authTagline}>
            THE ISLAND'S PULSE
          </Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authCardTitle}>
            Welcome Back
          </Text>
          <Text style={styles.authCardSub}>
            Login to your account
          </Text>

          <Text style={styles.inputLabel}>
            EMAIL ADDRESS
          </Text>
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
              secureTextEntry
            />
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
              onPress={handleLogin}>
              <Text style={styles.authButtonText}>
                LOGIN
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchAuthBtn}
            onPress={() => setScreen('register')}>
            <Text style={styles.switchAuthText}>
              New to ZAVARA?{' '}
              <Text style={styles.switchAuthLink}>
                Create account
              </Text>
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

  // ── ELEGANT HEADER ────────────────────────
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
  headerBack: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '600',
    width: 30,
  },
  headerTitleCenter: {
    color: colors.textDark,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── CENTER CONTENT ────────────────────────
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  comingSoonCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...shadow,
  },
  comingSoonIcon: { fontSize: 48 },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 4,
    marginBottom: 24,
  },
  comingSoonBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  comingSoonBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── HOME HEADER ───────────────────────────
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
  },
  notifIcon: { fontSize: 18 },
  homeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadowGold,
  },
  homeAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  homeAvatarText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 18,
  },

  // ── SEARCH ────────────────────────────────
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
  searchIcon: { fontSize: 16 },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },

  // ── ROLE BANNER ───────────────────────────
  roleBannerHome: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleBannerHomeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── SECTION HEADER ────────────────────────
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

  // ── PROMO CARDS ───────────────────────────
  carouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoCard: {
    width: 260,
    height: 145,
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
  promoEmoji: { fontSize: 40, marginBottom: 8 },
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
  promoCTAText: {
    fontSize: 10,
    fontWeight: '900',
  },

  // ── SERVICES ──────────────────────────────
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
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  serviceIcon: { fontSize: 28 },
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
  soonBadge: {
    backgroundColor: colors.warningPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.warning + '25',
  },
  soonBadgeText: {
    color: colors.warning,
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
  serviceTileSmIcon: { fontSize: 28 },
  serviceTileSmTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  serviceTileSmDesc: {
    color: colors.textLight,
    fontSize: 10,
  },

  // ── LIFESTYLE ─────────────────────────────
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
  lifestyleChipIcon: { fontSize: 24, marginBottom: 6 },
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

  // ── DASHBOARD ─────────────────────────────
  dashRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
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
  dashIcon: { fontSize: 30, marginBottom: 12 },
  dashTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  dashSub: { color: colors.textLight, fontSize: 11 },

  // ── PARTNER BANNER ────────────────────────
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
  partnerBannerIcon: { fontSize: 30 },
  partnerBannerTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 3,
  },
  partnerBannerSub: {
    color: colors.textLight,
    fontSize: 10,
  },
  partnerBannerArrowWrap: {
    width: 34,
    height: 34,
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

  // ── HOME FOOTER ───────────────────────────
  homeFooter: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  homeFooterLine: {
    width: 40,
    height: 1,
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

  // ── BOTTOM NAV ────────────────────────────
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
  navIcon: { fontSize: 20, marginBottom: 3 },
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },

  // ── AUTH ──────────────────────────────────
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
    width: 50,
    height: 2,
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
  switchAuthText: {
    color: colors.textLight,
    fontSize: 13,
  },
  switchAuthLink: {
    color: colors.primary,
    fontWeight: '800',
  },
  authFooterText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 28,
    letterSpacing: 1,
  },

  // ── PROFILE ───────────────────────────────
  profileContainer: {
    padding: 26,
    alignItems: 'center',
  },
  profileAvatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  profileAvatarText: {
    fontSize: 40,
    color: colors.textWhite,
    fontWeight: '900',
  },
  profileCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
    ...shadowGold,
  },
  profileCameraBtnText: { fontSize: 14 },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginBottom: 28,
  },
  roleBadgeText: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    width: '100%',
    padding: 16,
    borderRadius: borderRadius.large,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  infoSub: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    ...shadowGold,
  },
  primaryButtonText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 2,
  },
  outlineButton: {
    backgroundColor: colors.primaryPale,
    padding: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  dangerButton: {
    backgroundColor: colors.dangerPale,
    padding: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },

  // ── VERIFY ────────────────────────────────
  verifyContainer: { padding: 24 },
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
  verifyNoteIcon: { fontSize: 26 },
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
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  verifyOptionIcon: { fontSize: 24 },
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