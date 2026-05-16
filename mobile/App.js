// ============================================
// App.js - v6.0
// ✅ Feature F - Push notification deep linking
// ✅ Notification tap → OrderTrackingScreen
// ✅ No floating code
// ✅ Clean screen routing
// ✅ OrderTrackingScreen connected
// ============================================
import { useEffect, useState } from 'react';
import {
  View,
  StatusBar,
  LogBox,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Context
import { AppProvider, useAppContext } from './context/AppContext';

// Hooks
import { useApp } from './hooks/useApp';

// Components
import LoadingScreen from './components/LoadingScreen';
import BottomNav    from './components/BottomNav';

// Screens
import LoginScreen              from './screens/LoginScreen';
import RegisterScreen           from './screens/RegisterScreen';
import HomeScreen               from './screens/HomeScreen';
import ProfileScreen            from './screens/ProfileScreen';
import VerifyScreen             from './screens/verifyscreen';
import ComingSoonScreen         from './screens/ComingSoonScreen';
import OnboardingScreen         from './screens/OnboardingScreen';
import AdminDashboardScreen     from './screens/AdminDashboardScreen';
import SearchScreen             from './screens/SearchScreen';
import FoodScreen               from './screens/FoodScreen';
import MarketScreen             from './screens/MarketScreen';
import OrderHistoryScreen       from './screens/OrderHistoryScreen';
import OrderTrackingScreen      from './screens/OrderTrackingScreen';
import ProducerDashboardScreen  from './screens/ProducerDashboardScreen';
import CartScreen               from './screens/CartScreen';
import { useOTA } from './hooks/useOTA';

import { ToastProvider } from './screens/ToastManager';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  removeNotificationListeners,
} from './screens/NotificationHelper';

import { colors } from './theme';

LogBox.ignoreLogs(['Warning:']);
SplashScreen.preventAutoHideAsync();

// ============================================
// COMING SOON SCREENS
// ============================================
const COMING_SOON = [
  'ride', 'jobs', 'sos',
  'my_products', 'add_product',
  'wholesale', 'my_store',
];

// ============================================
// SCREEN ROUTER
// ============================================
function ScreenRouter() {
  const {
    screen,
    setScreen,
    userId,
    userRole,
    setCartCount,
    pendingNavigation,
    setPendingNavigation,
  } = useAppContext();
  useOTA();

  const {
    appReady,
    showRetry,
    showOnboarding,
    prepareApp,
    finishOnboarding,
    setAppReady,
    setShowRetry,
  } = useApp();

  // ✅ Tracking screen state
  // Lives here so notification can trigger it
  const [showTracking, setShowTracking]     = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // ── STARTUP ─────────────────────────────────
  useEffect(() => { prepareApp(); }, []);

  // ── PUSH NOTIFICATIONS ───────────────────────
  useEffect(() => {
    if (!userId) return;

    // Register device
    registerForPushNotifications(userId);

    // Setup listeners with smart routing
    const listeners = setupNotificationListeners(
      (navData) => {
        // ✅ This is called when notification is TAPPED
        // navData = { screen: 'tracking', orderId: 123 }
        //         = { screen: 'orders' }
        setPendingNavigation(navData);
      }
    );

    return () => removeNotificationListeners(listeners);
  }, [userId]);

  // ✅ DEEP LINK HANDLER
  // When pendingNavigation changes, navigate!
  useEffect(() => {
    if (!pendingNavigation) return;

    if (pendingNavigation.screen === 'tracking' &&
        pendingNavigation.orderId) {
      // Go to orders screen first
      setScreen('orders');
      // Then open tracking after short delay
      setTimeout(() => {
        setTrackingOrderId(pendingNavigation.orderId);
        setShowTracking(true);
      }, 350);
    }

    if (pendingNavigation.screen === 'orders') {
      setScreen('orders');
    }

    // Clear after handling
    setPendingNavigation(null);

  }, [pendingNavigation]);

  // ── ONBOARDING ──────────────────────────────
  if (showOnboarding) {
    return (
      <OnboardingScreen onFinish={finishOnboarding} />
    );
  }

  // ── LOADING ─────────────────────────────────
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

  // ── COMING SOON ─────────────────────────────
  if (COMING_SOON.includes(screen)) {
    return <ComingSoonScreen />;
  }

  // ✅ ORDER TRACKING - Full screen overlay
  // Shows on top of everything when triggered
  if (showTracking && trackingOrderId) {
    return (
      <OrderTrackingScreen
        orderId={trackingOrderId}
        userId={userId}
        onBack={() => {
          setShowTracking(false);
          setTrackingOrderId(null);
        }}
        onReview={(orderData) => {
          setShowTracking(false);
          setTrackingOrderId(null);
          setScreen('orders');
        }}
      />
    );
  }

  // ── SCREEN MAP ──────────────────────────────
  const screens = {

    // ── AUTH ──────────────────────────────────
    login:    <LoginScreen />,
    register: <RegisterScreen />,

    // ── MAIN ──────────────────────────────────
    home:    <HomeScreen />,
    profile: <ProfileScreen />,
    verify:  <VerifyScreen />,

    // ── SEARCH ────────────────────────────────
    search: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <SearchScreen
          userId={userId}
          onBack={() => setScreen('home')}
          onSelectRestaurant={() => setScreen('restaurants')}
          onSelectProduct={() => setScreen('market')}
        />
      </View>
    ),

    // ── ORDERS ────────────────────────────────
    orders: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <OrderHistoryScreen
          userId={userId}
          onBack={() => setScreen('home')}
          // ✅ When Track Order tapped in history
          onOpenTracking={(orderId) => {
            setTrackingOrderId(orderId);
            setShowTracking(true);
          }}
        />
        <BottomNav />
      </View>
    ),

    // ── FOOD ──────────────────────────────────
    restaurants: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <FoodScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
      </View>
    ),

    // ── MARKET ────────────────────────────────
    market: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.dark}
          barStyle="light-content"
        />
        <MarketScreen
          userId={userId}
          userRole={userRole}
          onBack={() => setScreen('home')}
          onCartUpdate={setCartCount}
          onGoToDashboard={() => setScreen('producer_dash')}
        />
        <BottomNav />
      </View>
    ),

    // ── CART ──────────────────────────────────
    cart: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
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
    ),

    // ── PRODUCER DASHBOARD ────────────────────
    producer_dash: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <ProducerDashboardScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
        <BottomNav />
      </View>
    ),

    // ── ADMIN DASHBOARD ───────────────────────
    admin_dash: (
      <View style={S.screen}>
        <StatusBar
          backgroundColor={colors.dark}
          barStyle="light-content"
        />
        <AdminDashboardScreen
          userId={userId}
          onBack={() => setScreen('home')}
        />
        <BottomNav />
      </View>
    ),
  };

  return screens[screen] || <LoginScreen />;
}

// ============================================
// ROOT APP
// ============================================
export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <ScreenRouter />
      </AppProvider>
    </ToastProvider>
  );
}

// ============================================
// STYLES
// ============================================
const S = {
  screen: {
    flex:            1,
    backgroundColor: colors.background,
  },
};