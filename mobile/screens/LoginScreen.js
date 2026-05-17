// ============================================
// screens/LoginScreen.js
// ZAVARA v3.0 - World Class Login
// Inspired by: Grab, Airbnb, Gojek, Duolingo
// Improvements:
// 1. Entrance fade + slide animation
// 2. Animated input focus border glow
// 3. Button scale press + transforms to loader
// 4. Floating emoji header with pulse
// 5. Inline validation with shake animation
// 6. Input checkmark when valid
// 7. Forgot password link
// 8. Decorative divider
// 9. Better footer with version
// ============================================
import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Animated,
} from 'react-native';
import { useAuth }       from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import {
  colors,
  shadowGold,
  shadowMd,
  borderRadius,
} from '../theme';

// ============================================
// HELPER: Validate email format
// ============================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function LoginScreen() {
  const { setScreen }            = useAppContext();
  const { handleLogin, loading } = useAuth();

  // ── STATE ──────────────────────────────────
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError]     = useState('');
  const [passError, setPassError]       = useState('');

  // ── ANIMATION REFS ─────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.8)).current;
  const emojiFloat  = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const shakeEmail  = useRef(new Animated.Value(0)).current;
  const shakePass   = useRef(new Animated.Value(0)).current;
  const emailBorder = useRef(new Animated.Value(0)).current;
  const passBorder  = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // ── ENTRANCE ANIMATION ─────────────────────
  useEffect(() => {
    Animated.sequence([
      // Logo fades in first
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Then card slides up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(headerScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating emoji loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiFloat, {
          toValue: -12,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(emojiFloat, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── INPUT FOCUS ANIMATIONS ─────────────────
  const animateBorder = (anim, toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // ── SHAKE ANIMATION ────────────────────────
  const shake = (anim) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── BUTTON PRESS ANIMATIONS ────────────────
  const onPressIn  = () => {
    Animated.spring(btnScale, {
      toValue: 0.96,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  // ── VALIDATION ─────────────────────────────
  const validate = useCallback(() => {
    let valid = true;

    if (!email || !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      shake(shakeEmail);
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password || password.length < 6) {
      setPassError('Password must be at least 6 characters');
      shake(shakePass);
      valid = false;
    } else {
      setPassError('');
    }

    return valid;
  }, [email, password]);

  // ── LOGIN HANDLER ──────────────────────────
  const onLogin = useCallback(async () => {
    if (!validate()) return;
    await handleLogin(email, password);
  }, [email, password, handleLogin, validate]);

  // ── INTERPOLATIONS ─────────────────────────
  const emailBorderColor = emailBorder.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border, colors.primary],
  });
  const passBorderColor = passBorder.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  // ── COMPUTED ───────────────────────────────
  const emailValid = email.length > 0 && isValidEmail(email);
  const passValid  = password.length >= 6;

  // ============================================
  // RENDER
  // ============================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      <StatusBar
        backgroundColor={colors.backgroundWarm}
        barStyle="dark-content"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ══ BRAND HEADER ══════════════════════ */}
        <Animated.View style={[
          styles.header,
          {
            opacity:   logoOpacity,
            transform: [{ scale: headerScale }],
          },
        ]}>
          {/* Floating palm emoji */}
          <Animated.Text style={[
            styles.headerEmoji,
            { transform: [{ translateY: emojiFloat }] },
          ]}>
            🌴
          </Animated.Text>

          <Text style={styles.brand}>ZAVARA</Text>

          {/* Decorative divider */}
          <View style={styles.decoRow}>
            <View style={styles.decoLine} />
            <Text style={styles.decoStar}>✦</Text>
            <View style={styles.decoLine} />
          </View>

          <Text style={styles.tagline}>
            THE ISLAND'S PULSE
          </Text>
        </Animated.View>

        {/* ══ CARD ══════════════════════════════ */}
        <Animated.View style={[
          styles.card,
          {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>

          <Text style={styles.cardTitle}>
            Welcome Back 👋
          </Text>
          <Text style={styles.cardSub}>
            Sign in to continue your journey
          </Text>

          {/* ── EMAIL ───────────────────────── */}
          <Text style={styles.label}>
            EMAIL ADDRESS
          </Text>
          <Animated.View style={[
            styles.inputWrap,
            {
              borderColor: emailBorderColor,
              transform: [{ translateX: shakeEmail }],
            },
          ]}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => animateBorder(emailBorder, 1)}
              onBlur={()  => animateBorder(emailBorder, 0)}
            />
            {emailValid && (
              <Text style={styles.inputCheck}>✓</Text>
            )}
          </Animated.View>
          {emailError ? (
            <Text style={styles.errorText}>
              ⚠️ {emailError}
            </Text>
          ) : null}

          {/* ── PASSWORD ────────────────────── */}
          <Text style={styles.label}>PASSWORD</Text>
          <Animated.View style={[
            styles.inputWrap,
            {
              borderColor: passBorderColor,
              transform: [{ translateX: shakePass }],
            },
          ]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passError) setPassError('');
              }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={onLogin}
              onFocus={() => animateBorder(passBorder, 1)}
              onBlur={()  => animateBorder(passBorder, 0)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(s => !s)}
              style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
            {passValid && (
              <Text style={styles.inputCheck}>✓</Text>
            )}
          </Animated.View>
          {passError ? (
            <Text style={styles.errorText}>
              ⚠️ {passError}
            </Text>
          ) : null}

          {/* ── FORGOT PASSWORD ─────────────── */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => setScreen('verify')}>
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* ── LOGIN BUTTON ────────────────── */}
          <Animated.View style={{
            transform: [{ scale: btnScale }],
          }}>
            <TouchableOpacity
              style={[
                styles.loginBtn,
                loading && styles.loginBtnLoading,
              ]}
              onPress={onLogin}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <Animated.Text style={styles.loadingDot}>
                    ●
                  </Animated.Text>
                  <Text style={styles.loginBtnText}>
                    Signing In...
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginBtnText}>
                  🚀  LOGIN TO ZAVARA
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── DIVIDER ─────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              New here?
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── REGISTER BUTTON ─────────────── */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => setScreen('register')}
            activeOpacity={0.85}>
            <Text style={styles.registerBtnText}>
              ✨  Create Free Account
            </Text>
          </TouchableOpacity>

        </Animated.View>

        {/* ══ FOOTER ════════════════════════════ */}
        <Animated.View style={[
          styles.footerWrap,
          { opacity: fadeAnim },
        ]}>
          <Text style={styles.footer}>
            🌴  Built with pride in Bohol
          </Text>
          <Text style={styles.footerVersion}>
            ZAVARA v2.0.0
          </Text>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },

  // ── HEADER ──────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 10,
    marginBottom: 14,
  },
  decoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  decoLine: {
    width: 40,
    height: 1.5,
    backgroundColor: colors.primary,
    borderRadius: 1,
    opacity: 0.4,
  },
  decoStar: {
    color: colors.primary,
    fontSize: 12,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },

  // ── CARD ────────────────────────────────────
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 24,
    lineHeight: 20,
  },

  // ── LABEL ───────────────────────────────────
  label: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 6,
  },

  // ── INPUT ───────────────────────────────────
  inputWrap: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textDark,
  },
  inputCheck: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 6,
  },
  eyeBtn:  { padding: 8, marginRight: -4 },
  eyeIcon: { fontSize: 16 },

  // ── ERROR ───────────────────────────────────
  errorText: {
    color: colors.danger || '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── FORGOT ──────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── LOGIN BUTTON ────────────────────────────
  loginBtn: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  loginBtnLoading: {
    opacity: 0.8,
  },
  loginBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingDot: {
    color: colors.textWhite,
    fontSize: 10,
    opacity: 0.7,
  },

  // ── DIVIDER ─────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── REGISTER BUTTON ─────────────────────────
  registerBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.large,
    padding: 16,
    alignItems: 'center',
  },
  registerBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── FOOTER ──────────────────────────────────
  footerWrap: {
    alignItems: 'center',
    marginTop: 28,
    gap: 4,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
  },
  footerVersion: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 2,
    opacity: 0.5,
  },
});