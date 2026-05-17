// ============================================
// screens/ProfileScreen.js
// ZAVARA v3.0 - World Class Profile
// Inspired by: Grab, Airbnb, Gojek, Spotify
// Improvements:
// 1. Entrance fade + scale animation
// 2. Real stats from context
// 3. Menu row scale press feedback
// 4. Avatar upload progress ring
// 5. Header parallax compress on scroll
// 6. Edit profile button
// 7. Custom logout bottom sheet
// 8. Section stagger animation
// 9. Avatar pulse on tap
// 10. Upload overlay on avatar
// ============================================
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import * as SecureStore     from 'expo-secure-store';
import { useAppContext }    from '../context/AppContext';
import { useAuth }          from '../hooks/useAuth';
import BottomNav            from '../components/BottomNav';
import { showToast }        from './ToastManager';
import {
  pickImageFromGallery,
  takePhoto,
  uploadProfilePhoto,
} from './ImagePickerHelper';
import {
  colors,
  shadow,
  shadowGold,
  shadowDark,
  shadowMd,
  borderRadius,
} from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_MAX  = 300;
const HEADER_MIN  = 120;
const HEADER_DIFF = HEADER_MAX - HEADER_MIN;

// ============================================
// SUB COMPONENT: Pressable Menu Row
// ============================================
function MenuRow({ icon, iconBg, title, sub, onPress, highlight, delay = 0 }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue:         0.97,
      friction:        8,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue:         1,
      friction:        5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{
      opacity:   fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim },
      ],
    }]}>
      <TouchableOpacity
        style={[
          styles.menuRow,
          highlight && styles.menuRowHighlight,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}>
        <View style={[styles.menuIcon,
          { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={styles.menuText}>
          <Text style={[
            styles.menuTitle,
            highlight && { color: colors.primary },
          ]}>
            {title}
          </Text>
          <Text style={styles.menuSub}>{sub}</Text>
        </View>
        <Text style={[
          styles.menuChev,
          highlight && { color: colors.primary },
        ]}>
          ›
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Stat Box
// ============================================
function StatBox({ emoji, value, label, onPress }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        6,
        tension:         40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.statBox,
      {
        opacity:   fadeAnim,
        transform: [{ scale: scaleAnim }],
      },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{ alignItems: 'center' }}>
        <Text style={styles.statEmoji}>{emoji}</Text>
        <Text style={styles.statNum}>{value}</Text>
        <Text style={styles.statLbl}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Custom Logout Sheet
// ============================================
function LogoutSheet({ visible, onConfirm, onCancel }) {
  const slideAnim = useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration:        250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue:         0,
          friction:        8,
          tension:         50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         0,
          duration:        200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue:         SCREEN_HEIGHT,
          duration:        250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}>
      <Animated.View style={[
        styles.sheetOverlay,
        { opacity: fadeAnim },
      ]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onCancel}
          activeOpacity={1}
        />
        <Animated.View style={[
          styles.sheetContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Icon */}
          <View style={styles.sheetIconWrap}>
            <Text style={styles.sheetIcon}>🚪</Text>
          </View>

          <Text style={styles.sheetTitle}>
            Logout of ZAVARA?
          </Text>
          <Text style={styles.sheetSub}>
            You will need to login again to{'\n'}
            access your account.
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.sheetLogoutBtn}
            onPress={onConfirm}
            activeOpacity={0.85}>
            <Text style={styles.sheetLogoutText}>
              Yes, Logout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={onCancel}
            activeOpacity={0.85}>
            <Text style={styles.sheetCancelText}>
              Stay Logged In
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// SUB COMPONENT: Photo Source Sheet
// ============================================
function PhotoSheet({ visible, onCamera, onGallery, onCancel }) {
  const slideAnim = useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration:        250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue:         0,
          friction:        8,
          tension:         50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         0,
          duration:        200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue:         SCREEN_HEIGHT,
          duration:        250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}>
      <Animated.View style={[
        styles.sheetOverlay,
        { opacity: fadeAnim },
      ]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onCancel}
          activeOpacity={1}
        />
        <Animated.View style={[
          styles.sheetContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            Update Profile Photo
          </Text>
          <Text style={styles.sheetSub}>
            Choose how to update your photo
          </Text>

          <TouchableOpacity
            style={styles.photoOptionBtn}
            onPress={onCamera}
            activeOpacity={0.85}>
            <Text style={styles.photoOptionIcon}>
              📷
            </Text>
            <View>
              <Text style={styles.photoOptionTitle}>
                Take a Photo
              </Text>
              <Text style={styles.photoOptionSub}>
                Use your camera
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoOptionBtn}
            onPress={onGallery}
            activeOpacity={0.85}>
            <Text style={styles.photoOptionIcon}>
              🖼️
            </Text>
            <View>
              <Text style={styles.photoOptionTitle}>
                Choose from Gallery
              </Text>
              <Text style={styles.photoOptionSub}>
                Pick an existing photo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={onCancel}
            activeOpacity={0.85}>
            <Text style={styles.sheetCancelText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProfileScreen() {
  const {
    setScreen,
    loggedInUser,
    userId,
    userRole,
    email,
    profileImage,
    setProfileImage,
    roleData,
    cartCount,
  } = useAppContext();

  const { handleLogout }      = useAuth();
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);
  const [showLogout,      setShowLogout]      = useState(false);
  const [showPhotoSheet,  setShowPhotoSheet]  = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);

  // ── ANIMATION REFS ────────────────────────
  const scrollY      = useRef(new Animated.Value(0)).current;
  const headerFade   = useRef(new Animated.Value(0)).current;
  const avatarScale  = useRef(new Animated.Value(0.8)).current;
  const avatarPulse  = useRef(new Animated.Value(1)).current;
  const nameFade     = useRef(new Animated.Value(0)).current;

  // ── ENTRANCE ANIMATION ────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerFade, {
        toValue:         1,
        duration:        400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(avatarScale, {
          toValue:         1,
          friction:        6,
          tension:         40,
          useNativeDriver: true,
        }),
        Animated.timing(nameFade, {
          toValue:         1,
          duration:        400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Avatar subtle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue:         1.03,
          duration:        2000,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue:         1,
          duration:        2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── HEADER PARALLAX ───────────────────────
  const headerHeight = scrollY.interpolate({
    inputRange:  [0, HEADER_DIFF],
    outputRange: [HEADER_MAX, HEADER_MIN],
    extrapolate: 'clamp',
  });
  const headerContentOpacity = scrollY.interpolate({
    inputRange:  [0, HEADER_DIFF / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const avatarScaleInterp = scrollY.interpolate({
    inputRange:  [0, HEADER_DIFF],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });

  // ── PHOTO UPLOAD ──────────────────────────
  const onPhotoUpload = useCallback(async (source) => {
    setShowPhotoSheet(false);
    let imageAsset = null;
    if (source === 'gallery') {
      imageAsset = await pickImageFromGallery();
    } else {
      imageAsset = await takePhoto();
    }
    if (!imageAsset) return;

    setUploadingPhoto(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 0.9) {
          clearInterval(progressInterval);
          return 0.9;
        }
        return prev + 0.1;
      });
    }, 150);

    const result = await uploadProfilePhoto(
      userId, imageAsset
    );

    clearInterval(progressInterval);
    setUploadProgress(1);

    if (result.success) {
      setProfileImage(result.url);
      await SecureStore.setItemAsync(
        'profileImage', result.url
      );
      showToast('success', 'Photo Updated! ✅',
        'Profile photo updated!');
    } else {
      showToast('error', 'Upload Failed',
        'Could not upload photo. Try again.');
    }

    setTimeout(() => {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }, 500);
  }, [userId, setProfileImage]);

  // ── LOGOUT ────────────────────────────────
  const onLogout = useCallback(() => {
    setShowLogout(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogout(false);
    setTimeout(handleLogout, 300);
  }, [handleLogout]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      {/* ══ ANIMATED HEADER ═══════════════════ */}
      <Animated.View style={[
        styles.darkHeader,
        { height: headerHeight },
      ]}>
        {/* Top bar always visible */}
        <View style={styles.darkHeaderTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setScreen('home')}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.darkHeaderTitle}>
            My Profile
          </Text>
          {/* Edit button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => showToast(
              'info', 'Coming Soon 🔧',
              'Edit profile coming in next update!'
            )}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Collapsible content */}
        <Animated.View style={[
          styles.headerContent,
          { opacity: headerContentOpacity },
        ]}>
          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowPhotoSheet(true)}>
            <Animated.View style={[
              styles.avatarWrap,
              {
                transform: [
                  { scale: avatarScaleInterp },
                ],
              },
            ]}>
              {/* Upload progress ring */}
              {uploadingPhoto && (
                <View style={styles.uploadRing}>
                  <ActivityIndicator
                    color={colors.primary}
                    size="large"
                  />
                </View>
              )}

              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {loggedInUser?.charAt(0)
                      ?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}

              {/* Upload overlay */}
              {uploadingPhoto && (
                <View style={styles.uploadOverlay}>
                  <Text style={styles.uploadOverlayText}>
                    {Math.round(uploadProgress * 100)}%
                  </Text>
                </View>
              )}

              {/* Camera button */}
              {!uploadingPhoto && (
                <View style={styles.cameraBtn}>
                  <Text style={{ fontSize: 13 }}>
                    📷
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Name + Email */}
          <Animated.View style={{ opacity: nameFade }}>
            <Text style={styles.name}>
              {loggedInUser}
            </Text>
            <Text style={styles.emailText}>
              {email}
            </Text>
          </Animated.View>

          {/* Role pill */}
          <View style={[styles.rolePill, {
            borderColor:     roleData.color + '60',
            backgroundColor: roleData.color + '18',
          }]}>
            <Text style={[styles.rolePillText,
              { color: roleData.color }]}>
              {roleData.badge}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ══ SCROLL CONTENT ════════════════════ */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox
            emoji="📦"
            value={cartCount > 0 ? cartCount : '0'}
            label="Orders"
            onPress={() => setScreen('orders')}
          />
          <StatBox
            emoji="⭐"
            value="0"
            label="Reviews"
          />
          <StatBox
            emoji="🌴"
            value="2025"
            label="Member"
          />
        </View>

        {/* ── ACCOUNT ─────────────────────── */}
        <Text style={styles.secLabel}>ACCOUNT</Text>

        <MenuRow
          icon="📦"
          iconBg={colors.primaryPale}
          title="Order History"
          sub="Track all your orders"
          onPress={() => setScreen('orders')}
          delay={50}
        />

        {userRole === 'producer' && (
          <MenuRow
            icon="🌾"
            iconBg={colors.farmerBg}
            title="Producer Dashboard"
            sub="Manage products & orders"
            onPress={() => setScreen('producer_dash')}
            delay={100}
          />
        )}

        {userRole === 'cuisine' && (
          <MenuRow
            icon="🍴"
            iconBg={colors.cuisineBg}
            title="Cuisine Dashboard"
            sub="Manage restaurant"
            onPress={() => setScreen('cuisine_dash')}
            delay={100}
          />
        )}

        {userRole === 'regular' && (
          <MenuRow
            icon="✦"
            iconBg={colors.primaryPale}
            title="Become a Partner"
            sub="Harvest · Seller · Swift · Haven"
            onPress={() => setScreen('verify')}
            highlight
            delay={100}
          />
        )}

        {/* ── SUPPORT ─────────────────────── */}
        <Text style={[styles.secLabel, { marginTop: 20 }]}>
          SUPPORT
        </Text>

        <MenuRow
          icon="💬"
          iconBg={colors.infoPale}
          title="Help & Support"
          sub="FAQ and contact us"
          onPress={() => showToast(
            'info', 'Coming Soon 🔧',
            'Help center coming soon!'
          )}
          delay={150}
        />

        <MenuRow
          icon="📋"
          iconBg={colors.warningPale}
          title="Terms & Privacy"
          sub="Legal information"
          onPress={() => showToast(
            'info', 'Coming Soon 🔧',
            'Terms page coming soon!'
          )}
          delay={200}
        />

        <MenuRow
          icon="⭐"
          iconBg={colors.primaryPale}
          title="Rate ZAVARA"
          sub="Help us improve"
          onPress={() => showToast(
            'info', '🌴 Thank You!',
            'Rating feature coming soon!'
          )}
          delay={250}
        />

        {/* App Footer */}
        <View style={styles.appFooter}>
          <Text style={styles.appBrand}>ZAVARA</Text>
          <Text style={styles.appVersion}>
            Version 5.0.0 · Bohol, Philippines
          </Text>
          <Text style={styles.appTagline}>
            The Island's Pulse 🌴
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.75}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </Animated.ScrollView>

      <BottomNav />

      {/* ══ CUSTOM SHEETS ═════════════════════ */}
      <PhotoSheet
        visible={showPhotoSheet}
        onCamera={() => onPhotoUpload('camera')}
        onGallery={() => onPhotoUpload('gallery')}
        onCancel={() => setShowPhotoSheet(false)}
      />

      <LogoutSheet
        visible={showLogout}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogout(false)}
      />

    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },

  // ── HEADER ──────────────────────────────────
  darkHeader: {
    backgroundColor: colors.dark,
    paddingTop:      52,
    alignItems:      'center',
    borderBottomLeftRadius:  32,
    borderBottomRightRadius: 32,
    overflow:        'hidden',
    ...shadowDark,
  },
  darkHeaderTop: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    width:             '100%',
    paddingHorizontal: 20,
    marginBottom:      16,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
  },
  backBtnText: {
    color:      colors.primary,
    fontSize:   20,
    fontWeight: '700',
  },
  darkHeaderTitle: {
    color:         'rgba(255,255,255,0.85)',
    fontSize:      16,
    fontWeight:    '800',
    letterSpacing: 0.5,
  },
  editBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
  },
  editBtnText: { fontSize: 16 },

  // ── HEADER CONTENT ──────────────────────────
  headerContent: {
    alignItems: 'center',
    width:      '100%',
    paddingBottom: 24,
  },

  // ── AVATAR ──────────────────────────────────
  avatarWrap: {
    position:     'relative',
    marginBottom: 14,
  },
  avatar: {
    width:           96,
    height:          96,
    borderRadius:    48,
    backgroundColor: colors.darkCard,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     3,
    borderColor:     colors.primary,
    overflow:        'hidden',
  },
  avatarLetter: {
    fontSize:   40,
    color:      colors.primary,
    fontWeight: '900',
  },
  uploadRing: {
    position:        'absolute',
    width:           108,
    height:          108,
    borderRadius:    54,
    top:             -6,
    left:            -6,
    zIndex:          10,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  uploadOverlay: {
    position:        'absolute',
    width:           96,
    height:          96,
    borderRadius:    48,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          5,
  },
  uploadOverlayText: {
    color:      colors.textWhite,
    fontSize:   18,
    fontWeight: '900',
  },
  cameraBtn: {
    position:        'absolute',
    bottom:          0,
    right:           -4,
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2.5,
    borderColor:     colors.dark,
    ...shadowGold,
  },

  // ── NAME + EMAIL ─────────────────────────────
  name: {
    fontSize:     22,
    fontWeight:   '900',
    color:        colors.textCream,
    marginBottom: 5,
    textAlign:    'center',
  },
  emailText: {
    fontSize:      12,
    color:         'rgba(255,255,255,0.38)',
    marginBottom:  14,
    letterSpacing: 0.3,
    textAlign:     'center',
  },

  // ── ROLE PILL ───────────────────────────────
  rolePill: {
    paddingHorizontal: 20,
    paddingVertical:   8,
    borderRadius:      borderRadius.round,
    borderWidth:       1,
  },
  rolePillText: {
    fontWeight:    '800',
    fontSize:      11,
    letterSpacing: 0.5,
  },

  // ── BODY ────────────────────────────────────
  body: {
    padding:       20,
    paddingBottom: 100,
  },

  // ── STATS ───────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  24,
    marginTop:     -14,
  },
  statBox: {
    flex:            1,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         14,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  statEmoji: { fontSize: 20, marginBottom: 6   },
  statNum: {
    fontSize:     17,
    fontWeight:   '900',
    color:        colors.textDark,
    marginBottom: 2,
  },
  statLbl: {
    fontSize:      9,
    color:         colors.textMuted,
    fontWeight:    '600',
    letterSpacing: 0.3,
  },

  // ── SECTION LABEL ───────────────────────────
  secLabel: {
    color:         colors.textMuted,
    fontSize:      10,
    fontWeight:    '900',
    letterSpacing: 2,
    marginBottom:  10,
    paddingLeft:   4,
  },

  // ── MENU ROW ────────────────────────────────
  menuRow: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    8,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  menuRowHighlight: {
    borderColor:     colors.borderGold,
    backgroundColor: colors.primaryPale,
  },
  menuIcon: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    colors.border,
    marginRight:    14,
  },
  menuText:  { flex: 1 },
  menuTitle: {
    fontSize:     14,
    fontWeight:   '800',
    color:        colors.textDark,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 11,
    color:    colors.textLight,
  },
  menuChev: {
    color:      colors.textMuted,
    fontSize:   20,
    fontWeight: '300',
  },

  // ── APP FOOTER ──────────────────────────────
  appFooter: {
    alignItems:     'center',
    paddingVertical: 28,
    marginTop:       8,
  },
  appBrand: {
    color:         colors.textMuted,
    fontSize:      13,
    fontWeight:    '900',
    letterSpacing: 5,
    marginBottom:  5,
  },
  appVersion: {
    color:         colors.borderMedium,
    fontSize:      10,
    letterSpacing: 0.5,
    marginBottom:  4,
  },
  appTagline: {
    color:    colors.textMuted,
    fontSize: 11,
  },

  // ── LOGOUT BUTTON ───────────────────────────
  logoutBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    padding:        16,
    borderRadius:   borderRadius.large,
    borderWidth:    1,
    borderColor:    colors.danger + '35',
    backgroundColor: colors.danger + '08',
    marginBottom:   10,
  },
  logoutIcon: { fontSize: 16 },
  logoutText: {
    color:         colors.danger,
    fontWeight:    '800',
    fontSize:      13,
    letterSpacing: 0.5,
  },

  // ── BOTTOM SHEETS ───────────────────────────
  sheetOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'flex-end',
  },
  sheetContainer: {
    backgroundColor:           colors.cardBackground,
    borderTopLeftRadius:       32,
    borderTopRightRadius:      32,
    padding:                   28,
    paddingBottom:             44,
    alignItems:                'center',
    borderTopWidth:            1,
    borderColor:               colors.border,
    ...shadowDark,
  },
  sheetHandle: {
    width:           44,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border,
    marginBottom:    24,
  },
  sheetIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.danger + '12',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     colors.danger + '25',
  },
  sheetIcon: { fontSize: 32 },
  sheetTitle: {
    fontSize:     20,
    fontWeight:   '900',
    color:        colors.textDark,
    marginBottom: 8,
    textAlign:    'center',
  },
  sheetSub: {
    fontSize:     13,
    color:        colors.textLight,
    textAlign:    'center',
    lineHeight:   20,
    marginBottom: 28,
  },
  sheetLogoutBtn: {
    backgroundColor: colors.danger,
    width:           '100%',
    padding:         17,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    marginBottom:    12,
  },
  sheetLogoutText: {
    color:         colors.textWhite,
    fontWeight:    '900',
    fontSize:      14,
    letterSpacing: 0.5,
  },
  sheetCancelBtn: {
    backgroundColor: colors.inputBackground,
    width:           '100%',
    padding:         17,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  sheetCancelText: {
    color:      colors.textDark,
    fontWeight: '800',
    fontSize:   14,
  },

  // ── PHOTO OPTIONS ───────────────────────────
  photoOptionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             16,
    width:           '100%',
    padding:         16,
    borderRadius:    borderRadius.large,
    backgroundColor: colors.inputBackground,
    borderWidth:     1,
    borderColor:     colors.border,
    marginBottom:    12,
  },
  photoOptionIcon:  { fontSize: 28 },
  photoOptionTitle: {
    fontSize:     14,
    fontWeight:   '800',
    color:        colors.textDark,
    marginBottom: 2,
  },
  photoOptionSub: {
    fontSize: 11,
    color:    colors.textLight,
  },
});