import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LogBox,
  ScrollView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import FoodScreen from './screens/FoodScreen';
import { colors, fonts, shadow, borderRadius } from './theme';

LogBox.ignoreLogs(['Warning:']);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const API_URL = 'http://192.168.55.210:8000';

export default function App() {
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

  // ✅ CHECK SAVED LOGIN ON APP START
  useEffect(() => {
    prepareApp();
  }, []);

const prepareApp = async () => {
    try {
      // Wait 1.5 seconds for splash effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Hide the native splash screen
      await SplashScreen.hideAsync();

      // Request GPS permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }

      // Check if user is already logged in
      const savedEmail = await SecureStore.getItemAsync('userEmail');
      const savedPassword = await SecureStore.getItemAsync('userPassword');

      if (savedEmail && savedPassword) {
        try {
          const response = await axios.post(
            `${API_URL}/users/login`,
            { email: savedEmail, password: savedPassword },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }
          );
          setLoggedInUser(response.data.user_name);
          setUserId(response.data.user_id);
          setUserRole(response.data.role);
          setEmail(savedEmail);
          setScreen('home');
        } catch (error) {
          await SecureStore.deleteItemAsync('userEmail');
          await SecureStore.deleteItemAsync('userPassword');
          setScreen('login');
        }
      } else {
        setScreen('login');
      }

    } catch (error) {
      setScreen('login');
    } finally {
      setAppReady(true);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady || screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <Text style={styles.loadingLogo}>🌴</Text>
        <Text style={styles.loadingAppName}>OneBohol</Text>
        <Text style={styles.loadingTagline}>Connecting Bohol</Text>
        <ActivityIndicator
          size="large"
          color={colors.primaryLight}
          style={{ marginTop: 30 }}
        />
      </View>
    );
  }

  // ✅ SAVE LOGIN INFO
  const saveLogin = async (emailVal, passwordVal, nameVal, idVal, roleVal) => {
    await SecureStore.setItemAsync('userEmail', emailVal);
    await SecureStore.setItemAsync('userPassword', passwordVal);
    await SecureStore.setItemAsync('userName', nameVal);
    await SecureStore.setItemAsync('userId', idVal.toString());
    await SecureStore.setItemAsync('userRole', roleVal);
  };

  // ✅ CLEAR LOGIN INFO
  const clearLogin = async () => {
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userPassword');
    await SecureStore.deleteItemAsync('userName');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userRole');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      setLoggedInUser(response.data.user_name);
      setUserId(response.data.user_id);
      setUserRole(response.data.role);

      // Save login for next time
      await saveLogin(
        email,
        password,
        response.data.user_name,
        response.data.user_id,
        response.data.role
      );

      setScreen('home');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/users/register`,
        { name, email, password, phone },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      Alert.alert('Success! 🎉', 'Account created! Please login.');
      setScreen('login');
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await clearLogin();
    setScreen('login');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setLoggedInUser('');
    setUserId(null);
    setUserRole('regular');
  };

  // FOOD SCREEN
  if (screen === 'restaurants') {
    return (
      <FoodScreen
        userId={userId}
        onBack={() => setScreen('home')}
      />
    );
  }

  // RIDE SCREEN
  if (screen === 'ride') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🚗 Ride</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonIcon}>🚗</Text>
          <Text style={styles.comingSoonTitle}>Ride Booking</Text>
          <Text style={styles.comingSoonSub}>Coming Soon!</Text>
        </View>
      </View>
    );
  }

  // JOBS SCREEN
  if (screen === 'jobs') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💼 Jobs</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonIcon}>💼</Text>
          <Text style={styles.comingSoonTitle}>Jobs Board</Text>
          <Text style={styles.comingSoonSub}>Coming Soon!</Text>
        </View>
      </View>
    );
  }

  // SOS SCREEN
  if (screen === 'sos') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.danger} barStyle="light-content" />
        <View style={[styles.header, { backgroundColor: colors.danger }]}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🚨 SOS Emergency</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonIcon}>🚨</Text>
          <Text style={styles.comingSoonTitle}>SOS Emergency</Text>
          <Text style={styles.comingSoonSub}>Coming Soon!</Text>
        </View>
      </View>
    );
  }

  // PROFILE SCREEN
  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 Profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.profileContainer}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {loggedInUser.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{loggedInUser}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={[
            styles.roleBadge,
            userRole === 'farmer' && { backgroundColor: colors.farmerColor },
            userRole === 'vendor' && { backgroundColor: colors.vendorColor },
            userRole === 'admin' && { backgroundColor: colors.adminColor },
          ]}>
            <Text style={styles.roleBadgeText}>
              {userRole === 'regular' ? '👤 Regular User' :
               userRole === 'farmer' ? '👨‍🌾 Verified Farmer' :
               userRole === 'vendor' ? '🏪 Verified Vendor' :
               userRole === 'admin' ? '⚙️ Admin' : userRole}
            </Text>
          </View>
          {location && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>
                📍 Location: {location.coords.latitude.toFixed(4)},
                {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}
          {userRole === 'regular' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => setScreen('verify')}>
              <Text style={styles.verifyButtonText}>
                ✅ Apply for Verification
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // VERIFY SCREEN
  if (screen === 'verify') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('profile')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✅ Get Verified</Text>
        </View>
        <ScrollView contentContainerStyle={styles.verifyContainer}>
          <Text style={styles.verifyTitle}>Choose your role</Text>
          <Text style={styles.verifySubtitle}>
            Apply for a verified account to access more features
          </Text>

          <TouchableOpacity
            style={styles.verifyOption}
            onPress={async () => {
              try {
                await axios.post(
                  `${API_URL}/verify/apply?user_id=${userId}`,
                  { requested_role: 'farmer', document_url: 'pending' },
                  { headers: { 'Content-Type': 'application/json' } }
                );
                Alert.alert('Applied! 🎉', 'Farmer verification is being reviewed.');
                setScreen('home');
              } catch (error) {
                Alert.alert('Error', 'Could not apply. Try again.');
              }
            }}>
            <View style={styles.verifyOptionHeader}>
              <Text style={styles.verifyOptionIcon}>👨‍🌾</Text>
              <View>
                <Text style={styles.verifyOptionTitle}>Farmer</Text>
                <Text style={styles.verifyOptionDesc}>
                  I grow crops or raise livestock
                </Text>
              </View>
            </View>
            <Text style={styles.verifyArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyOption}
            onPress={async () => {
              try {
                await axios.post(
                  `${API_URL}/verify/apply?user_id=${userId}`,
                  { requested_role: 'vendor', document_url: 'pending' },
                  { headers: { 'Content-Type': 'application/json' } }
                );
                Alert.alert('Applied! 🎉', 'Vendor verification is being reviewed.');
                setScreen('home');
              } catch (error) {
                Alert.alert('Error', 'Could not apply. Try again.');
              }
            }}>
            <View style={styles.verifyOptionHeader}>
              <Text style={styles.verifyOptionIcon}>🏪</Text>
              <View>
                <Text style={styles.verifyOptionTitle}>Market Vendor</Text>
                <Text style={styles.verifyOptionDesc}>
                  I have a stall in the palengke
                </Text>
              </View>
            </View>
            <Text style={styles.verifyArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyOption}
            onPress={async () => {
              try {
                await axios.post(
                  `${API_URL}/verify/apply?user_id=${userId}`,
                  { requested_role: 'rider', document_url: 'pending' },
                  { headers: { 'Content-Type': 'application/json' } }
                );
                Alert.alert('Applied! 🎉', 'Rider verification is being reviewed.');
                setScreen('home');
              } catch (error) {
                Alert.alert('Error', 'Could not apply. Try again.');
              }
            }}>
            <View style={styles.verifyOptionHeader}>
              <Text style={styles.verifyOptionIcon}>🏍️</Text>
              <View>
                <Text style={styles.verifyOptionTitle}>Rider</Text>
                <Text style={styles.verifyOptionDesc}>
                  I want to deliver orders
                </Text>
              </View>
            </View>
            <Text style={styles.verifyArrow}>→</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  }

  // FARMER SCREENS
  if (screen === 'my_products' || screen === 'add_product') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.farmerColor} barStyle="light-content" />
        <View style={[styles.header, { backgroundColor: colors.farmerColor }]}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screen === 'my_products' ? '🌾 My Products' : '➕ Add Product'}
          </Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonIcon}>🌾</Text>
          <Text style={styles.comingSoonTitle}>Farmer Dashboard</Text>
          <Text style={styles.comingSoonSub}>Coming Soon!</Text>
        </View>
      </View>
    );
  }

  // VENDOR SCREENS
  if (screen === 'wholesale' || screen === 'my_store') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screen === 'wholesale' ? '🛒 Buy from Farmers' : '🏪 My Store'}
          </Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonIcon}>🏪</Text>
          <Text style={styles.comingSoonTitle}>Vendor Dashboard</Text>
          <Text style={styles.comingSoonSub}>Coming Soon!</Text>
        </View>
      </View>
    );
  }

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />

        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.homeGreeting}>Maayong Adlaw! 🌴</Text>
            <Text style={styles.homeUserName}>{loggedInUser}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setScreen('profile')}>
            <Text style={styles.profileButtonText}>
              {loggedInUser.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchText}>
              Search services, food, jobs...
            </Text>
          </View>

          {userRole !== 'regular' && (
            <View style={[
              styles.homeBadge,
              userRole === 'farmer' && { backgroundColor: colors.farmerColor },
              userRole === 'vendor' && { backgroundColor: colors.vendorColor },
              userRole === 'admin' && { backgroundColor: colors.adminColor },
            ]}>
              <Text style={styles.homeBadgeText}>
                {userRole === 'farmer' ? '👨‍🌾 Verified Farmer' :
                 userRole === 'vendor' ? '🏪 Verified Vendor' :
                 userRole === 'admin' ? '⚙️ Admin' : ''}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => setScreen('restaurants')}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.serviceIcon}>🍔</Text>
              </View>
              <Text style={styles.serviceText}>Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => setScreen('ride')}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.serviceIcon}>🚗</Text>
              </View>
              <Text style={styles.serviceText}>Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => setScreen('jobs')}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.serviceIcon}>💼</Text>
              </View>
              <Text style={styles.serviceText}>Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => setScreen('sos')}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#FFEBEE' }]}>
                <Text style={styles.serviceIcon}>🚨</Text>
              </View>
              <Text style={styles.serviceText}>SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceItem}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.serviceIcon}>💰</Text>
              </View>
              <Text style={styles.serviceText}>Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceItem}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#FFF9C4' }]}>
                <Text style={styles.serviceIcon}>📦</Text>
              </View>
              <Text style={styles.serviceText}>Padala</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceItem}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.serviceIcon}>🏥</Text>
              </View>
              <Text style={styles.serviceText}>Health</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceItem}>
              <View style={[styles.serviceIconBg, { backgroundColor: '#E0F7FA' }]}>
                <Text style={styles.serviceIcon}>🏖️</Text>
              </View>
              <Text style={styles.serviceText}>Tourism</Text>
            </TouchableOpacity>
          </View>

          {(userRole === 'farmer' || userRole === 'admin') && (
            <>
              <Text style={styles.sectionTitle}>👨‍🌾 Farm</Text>
              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={[styles.quickItem, { borderLeftColor: colors.farmerColor }]}
                  onPress={() => setScreen('my_products')}>
                  <Text style={styles.quickIcon}>🌾</Text>
                  <View>
                    <Text style={styles.quickTitle}>My Products</Text>
                    <Text style={styles.quickSub}>Manage listings</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickItem, { borderLeftColor: colors.farmerColor }]}
                  onPress={() => setScreen('add_product')}>
                  <Text style={styles.quickIcon}>➕</Text>
                  <View>
                    <Text style={styles.quickTitle}>Add Product</Text>
                    <Text style={styles.quickSub}>List new harvest</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(userRole === 'vendor' || userRole === 'admin') && (
            <>
              <Text style={styles.sectionTitle}>🏪 Store</Text>
              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={[styles.quickItem, { borderLeftColor: colors.vendorColor }]}
                  onPress={() => setScreen('wholesale')}>
                  <Text style={styles.quickIcon}>🛒</Text>
                  <View>
                    <Text style={styles.quickTitle}>Wholesale</Text>
                    <Text style={styles.quickSub}>Buy from farmers</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickItem, { borderLeftColor: colors.vendorColor }]}
                  onPress={() => setScreen('my_store')}>
                  <Text style={styles.quickIcon}>🏪</Text>
                  <View>
                    <Text style={styles.quickTitle}>My Store</Text>
                    <Text style={styles.quickSub}>Manage products</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>🌴 Welcome to OneBohol!</Text>
            <Text style={styles.promoText}>
              Order food, book rides, find jobs and more.
              All in one app for Bohol!
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickItem}>
              <Text style={styles.quickIcon}>📋</Text>
              <View>
                <Text style={styles.quickTitle}>My Orders</Text>
                <Text style={styles.quickSub}>Track your orders</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => setScreen('profile')}>
              <Text style={styles.quickIcon}>⚙️</Text>
              <View>
                <Text style={styles.quickTitle}>Settings</Text>
                <Text style={styles.quickSub}>Account & preferences</Text>
              </View>
            </TouchableOpacity>
          </View>

          {userRole === 'regular' && (
            <TouchableOpacity
              style={styles.verifySmall}
              onPress={() => setScreen('verify')}>
              <Text style={styles.verifySmallText}>
                ✅ Get Verified for more features
              </Text>
              <Text style={styles.verifySmallArrow}>→</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>🌴 OneBohol v2.0</Text>
            <Text style={styles.footerSubText}>Made with love for Bohol</Text>
          </View>

        </ScrollView>
      </View>
    );
  }

  // REGISTER SCREEN
  if (screen === 'register') {
    return (
      <KeyboardAvoidingView
        style={styles.authContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.authTop}>
            <Text style={styles.authLogo}>🌴</Text>
            <Text style={styles.authAppName}>OneBohol</Text>
            <Text style={styles.authTagline}>Create your account</Text>
          </View>
          <View style={styles.authForm}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan dela Cruz"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@email.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="09xxxxxxxxx"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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
                <Text style={styles.authButtonText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.switchAuth}
              onPress={() => setScreen('login')}>
              <Text style={styles.switchAuthText}>
                Already have an account?{' '}
                <Text style={styles.switchAuthLink}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // LOGIN SCREEN
  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.authScroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.authTop}>
          <Text style={styles.authLogo}>🌴</Text>
          <Text style={styles.authAppName}>OneBohol</Text>
          <Text style={styles.authTagline}>Connecting Bohol</Text>
        </View>
        <View style={styles.authForm}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="juan@email.com"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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
              <Text style={styles.authButtonText}>LOGIN</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => setScreen('register')}>
            <Text style={styles.switchAuthText}>
              Don't have an account?{' '}
              <Text style={styles.switchAuthLink}>Register here</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.authFooter}>
          🌴 Made with love for Bohol
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: fonts.xlarge,
    fontWeight: 'bold'
  },
  backBtn: {
    color: colors.primaryLight,
    fontSize: fonts.medium,
    marginBottom: 5
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  comingSoonIcon: {
    fontSize: 70,
    marginBottom: 15
  },
  comingSoonTitle: {
    fontSize: fonts.xxlarge,
    fontWeight: 'bold',
    color: colors.textDark
  },
  comingSoonSub: {
    fontSize: fonts.medium,
    color: colors.textLight,
    marginTop: 8
  },
  homeHeader: {
    backgroundColor: colors.primaryDark,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  homeGreeting: {
    color: colors.primaryLight,
    fontSize: fonts.regular,
    marginBottom: 2
  },
  homeUserName: {
    color: colors.textWhite,
    fontSize: fonts.xlarge,
    fontWeight: 'bold'
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight
  },
  profileButtonText: {
    color: colors.textWhite,
    fontSize: fonts.large,
    fontWeight: 'bold'
  },
  homeContent: {
    padding: 20,
    paddingBottom: 40
  },
  homeBadge: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: borderRadius.medium,
    marginBottom: 15,
    alignItems: 'center'
  },
  homeBadgeText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.regular
  },
  sectionTitle: {
    fontSize: fonts.medium,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
    marginTop: 5
  },
  searchBar: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10
  },
  searchText: {
    color: colors.textLight,
    fontSize: fonts.regular
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  serviceItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 15
  },
  serviceIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...shadow
  },
  serviceIcon: {
    fontSize: 24
  },
  serviceText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center'
  },
  quickGrid: {
    marginBottom: 15
  },
  quickItem: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow
  },
  quickIcon: {
    fontSize: 28,
    marginRight: 15
  },
  quickTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.textDark
  },
  quickSub: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 2
  },
  promoBanner: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.large,
    padding: 20,
    marginBottom: 20,
    ...shadow
  },
  promoTitle: {
    color: colors.primaryLight,
    fontSize: fonts.large,
    fontWeight: 'bold',
    marginBottom: 5
  },
  promoText: {
    color: colors.textWhite,
    fontSize: fonts.small,
    lineHeight: 20,
    opacity: 0.9
  },
  verifySmall: {
    backgroundColor: colors.inputBackground,
    padding: 14,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border
  },
  verifySmallText: {
    color: colors.primary,
    fontSize: fonts.regular,
    fontWeight: '600'
  },
  verifySmallArrow: {
    color: colors.primary,
    fontSize: fonts.large,
    fontWeight: 'bold'
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  footerText: {
    color: colors.textMedium,
    fontSize: fonts.regular,
    fontWeight: '600'
  },
  footerSubText: {
    color: colors.textLight,
    fontSize: fonts.small,
    marginTop: 3
  },
  logoutButton: {
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 10
  },
  logoutText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.medium
  },
  locationBadge: {
    backgroundColor: colors.inputBackground,
    padding: 10,
    borderRadius: borderRadius.medium,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border
  },
  locationText: {
    color: colors.textMedium,
    fontSize: fonts.small
  },
  authContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25
  },
  authTop: {
    alignItems: 'center',
    marginBottom: 35
  },
  authLogo: {
    fontSize: 70,
    marginBottom: 10
  },
  authAppName: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    color: colors.primaryDark,
    letterSpacing: 2
  },
  authTagline: {
    fontSize: fonts.regular,
    color: colors.textMedium,
    marginTop: 5
  },
  authForm: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 25,
    ...shadow
  },
  inputLabel: {
    fontSize: fonts.small,
    fontWeight: 'bold',
    color: colors.textMedium,
    marginBottom: 6,
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: 14,
    fontSize: fonts.medium,
    color: colors.textDark,
    marginBottom: 12
  },
  authButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 10,
    ...shadow
  },
  authButtonText: {
    color: colors.textWhite,
    fontSize: fonts.medium,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  switchAuth: {
    alignItems: 'center',
    marginTop: 20
  },
  switchAuthText: {
    color: colors.textMedium,
    fontSize: fonts.regular
  },
  switchAuthLink: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  authFooter: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: fonts.small,
    marginTop: 30
  },
  profileContainer: {
    padding: 25,
    alignItems: 'center'
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    ...shadow
  },
  profileAvatarText: {
    fontSize: 40,
    color: colors.textWhite,
    fontWeight: 'bold'
  },
  profileName: {
    fontSize: fonts.xxlarge,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 5
  },
  profileEmail: {
    fontSize: fonts.regular,
    color: colors.textMedium,
    marginBottom: 20
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    marginBottom: 25
  },
  roleBadgeText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.regular
  },
  verifyButton: {
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    ...shadow
  },
  verifyButtonText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.medium
  },
  verifyContainer: {
    padding: 20
  },
  verifyTitle: {
    fontSize: fonts.xxlarge,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 5
  },
  verifySubtitle: {
    fontSize: fonts.regular,
    color: colors.textMedium,
    marginBottom: 25
  },
  verifyOption: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: borderRadius.large,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow
  },
  verifyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  verifyOptionIcon: {
    fontSize: 40,
    marginRight: 15
  },
  verifyOptionTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.textDark
  },
  verifyOptionDesc: {
    fontSize: fonts.small,
    color: colors.textMedium,
    marginTop: 3
  },
  verifyArrow: {
    fontSize: fonts.xlarge,
    color: colors.primary,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingLogo: {
    fontSize: 80,
    marginBottom: 15
  },
  loadingAppName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textWhite,
    letterSpacing: 3
  },
  loadingTagline: {
    fontSize: fonts.medium,
    color: colors.primaryLight,
    marginTop: 8
  },
});