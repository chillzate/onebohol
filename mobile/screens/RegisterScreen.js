// ============================================
// screens/RegisterScreen.js
// ZAVARA v3.0 - World Class Registration
// Inspired by: Grab, Airbnb, Duolingo, Gojek
// Improvements:
// 1. Entrance animation (fade + slide)
// 2. Real-time inline validation + shake
// 3. Password strength indicator bar
// 4. Pre-fill role from AsyncStorage
// 5. Terms & Privacy checkbox
// 6. Button scale press + transforms to loader
// 7. Success checkmark animation
// 8. Proper input refs for tab flow
// 9. Input focus border glow
// 10. Floating emoji header
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth }       from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import {
  colors,
  shadowGold,
  shadowMd,
  borderRadius,
} from '../theme';

// ============================================
// HELPERS
// ============================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) return true; // optional
  return /^09\d{9}$/.test(phone);
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: 'transparent' };
  if (password.length < 6)
    return { level: 1, label: 'Too Short', color: '#EF4444' };
  if (password.length < 8)
    return { level: 2, label: 'Weak',      color: '#F97316' };
  if (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
    return { level: 4, label: 'Strong',    color: '#22C55E' };
  return   { level: 3, label: 'Fair',      color: '#EAB308' };
}

// Role labels from onboarding
const ROLE_LABELS = {
  customer: { icon: '🛒', label: 'Customer'        },
  producer: { icon: '🌾', label: 'Farmer / Fisher' },
  seller:   { icon: '🏪', label: 'Market Seller'   },
  business: { icon: '🍴', label: 'Restaurant'      },
};

// ============================================
// SUB COMPONENT: Animated Input Field
// ============================================
function AnimatedInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  secureTextEntry,
  rightElement,
  error,
  valid,
  inputRef,
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(borderAnim, {
      toValue:         1,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const onBlur = () => {
    Animated.timing(borderAnim, {
      toValue:         0,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };

  // Shake when error appears
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      error ? '#EF4444' : colors.border,
      colors.primary,
    ],
  });

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[
        inputStyles.inputWrap,
        {
          borderColor,
          transform: [{ translateX: shakeAnim }],
        },
      ]}>
        <Text style={inputStyles.inputIcon}>{icon}</Text>
        <TextInput
          ref={inputRef}
          style={inputStyles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType   || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={autoCorrect ?? true}
          returnKeyType={returnKeyType || 'next'}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secureTextEntry || false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {valid && !secureTextEntry && (
          <Text style={inputStyles.checkmark}>✓</Text>
        )}
        {rightElement}
      </Animated.View>
      {error ? (
        <Text style={inputStyles.errorText}>⚠️ {error}</Text>
      ) : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  label: {
    color:         colors.textLight,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 2,
    marginBottom:  6,
    marginTop:     6,
  },
  inputWrap: {
    backgroundColor:  colors.inputBackground,
    borderWidth:      1.5,
    borderRadius:     borderRadius.medium,
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize:    16,
    marginRight: 10,
  },
  input: {
    flex:           1,
    paddingVertical: 14,
    fontSize:       14,
    color:          colors.textDark,
  },
  checkmark: {
    color:      '#22C55E',
    fontSize:   16,
    fontWeight: '900',
    marginLeft: 6,
  },
  errorText: {
    color:        '#EF4444',
    fontSize:     11,
    fontWeight:   '600',
    marginTop:    4,
    marginBottom: 6,
    marginLeft:   4,
  },
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function RegisterScreen() {
  const { setScreen }               = useAppContext();
  const { handleRegister, loading } = useAuth();

  // ── FORM STATE ────────────────────────────
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [savedRole, setSavedRole]     = useState(null);
  const [success, setSuccess]         = useState(false);

  // ── ERROR STATE ───────────────────────────
  const [errors, setErrors] = useState({
    name:     '',
    email:    '',
    phone:    '',
    password: '',
    terms:    '',
  });

  // ── REFS FOR TAB FLOW ─────────────────────
  const emailRef    = useRef(null);
  const phoneRef    = useRef(null);
  const passwordRef = useRef(null);

  // ── ANIMATION REFS ────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.85)).current;
  const emojiFloat  = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // ── PASSWORD STRENGTH ─────────────────────
  const strength = getPasswordStrength(password);

  // ── LOAD SAVED ROLE FROM ONBOARDING ───────
  useEffect(() => {
    AsyncStorage.getItem('zavara_selected_role')
      .then(role => {
        if (role && ROLE_LABELS[role]) {
          setSavedRole(role);
        }
      })
      .catch(() => {});
  }, []);

  // ── ENTRANCE ANIMATION ────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue:         1,
        duration:        400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration:        500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue:         0,
          friction:        8,
          tension:         50,
          useNativeDriver: true,
        }),
        Animated.spring(headerScale, {
          toValue:         1,
          friction:        6,
          tension:         40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiFloat, {
          toValue:         -10,
          duration:        2200,
          useNativeDriver: true,
        }),
        Animated.timing(emojiFloat, {
          toValue:         0,
          duration:        2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── SUCCESS ANIMATION ─────────────────────
  const playSuccess = useCallback(() => {
    setSuccess(true);
    Animated.spring(successAnim, {
      toValue:         1,
      friction:        5,
      tension:         40,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── BUTTON PRESS ──────────────────────────
  const onPressIn  = () => {
    Animated.spring(btnScale, {
      toValue:         0.96,
      friction:        8,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, {
      toValue:         1,
      friction:        5,
      useNativeDriver: true,
    }).start();
  };

  // ── VALIDATION ────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {
      name:     '',
      email:    '',
      phone:    '',
      password: '',
      terms:    '',
    };
    let valid = true;

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please enter your full name';
      valid = false;
    }
    if (!email || !isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }
    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'Format: 09xxxxxxxxx (11 digits)';
      valid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!agreedToTerms) {
      newErrors.terms = 'Please agree to Terms & Privacy Policy';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [name, email, phone, password, agreedToTerms]);

  // ── REGISTER HANDLER ──────────────────────
  const onRegister = useCallback(async () => {
    if (!validate()) return;
    const result = await handleRegister({
      name, email, password, phone,
    });
    if (result) {
      playSuccess();
      setName('');
      setPhone('');
      setPassword('');
    }
  }, [
    name, email, password, phone,
    handleRegister, validate, playSuccess,
  ]);

  // ── CLEAR ERROR ON CHANGE ─────────────────
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
          <Animated.Text style={[
            styles.headerEmoji,
            { transform: [{ translateY: emojiFloat }] },
          ]}>
            🌴
          </Animated.Text>
          <Text style={styles.brand}>ZAVARA</Text>
          <View style={styles.decoRow}>
            <View style={styles.decoLine} />
            <Text style={styles.decoStar}>✦</Text>
            <View style={styles.decoLine} />
          </View>
          <Text style={styles.tagline}>
            CREATE YOUR ACCOUNT
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

          {/* Success State */}
          {success ? (
            <Animated.View style={[
              styles.successWrap,
              {
                opacity:   successAnim,
                transform: [{
                  scale: successAnim.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }],
              },
            ]}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>
                Welcome to ZAVARA!
              </Text>
              <Text style={styles.successSub}>
                Your account has been created.{'\n'}
                Redirecting you now...
              </Text>
            </Animated.View>
          ) : (
            <>
              <Text style={styles.cardTitle}>
                Join ZAVARA 🌴
              </Text>
              <Text style={styles.cardSub}>
                Create your free account today
              </Text>

              {/* Pre-filled role from onboarding */}
              {savedRole && ROLE_LABELS[savedRole] && (
                <View style={styles.roleHint}>
                  <Text style={styles.roleHintIcon}>
                    {ROLE_LABELS[savedRole].icon}
                  </Text>
                  <Text style={styles.roleHintText}>
                    Joining as{' '}
                    <Text style={styles.roleHintBold}>
                      {ROLE_LABELS[savedRole].label}
                    </Text>
                    {' '}· Change later in profile
                  </Text>
                </View>
              )}

              {/* ── FULL NAME ─────────────────── */}
              <AnimatedInput
                label="FULL NAME"
                icon="👤"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  clearError('name');
                }}
                placeholder="Juan dela Cruz"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() =>
                  emailRef.current?.focus()
                }
                valid={name.trim().length >= 2}
                error={errors.name}
              />

              {/* ── EMAIL ─────────────────────── */}
              <AnimatedInput
                label="EMAIL ADDRESS"
                icon="✉️"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError('email');
                }}
                placeholder="juan@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() =>
                  phoneRef.current?.focus()
                }
                inputRef={emailRef}
                valid={isValidEmail(email)}
                error={errors.email}
              />

              {/* ── PHONE ─────────────────────── */}
              <AnimatedInput
                label="PHONE NUMBER (OPTIONAL)"
                icon="📱"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  clearError('phone');
                }}
                placeholder="09xxxxxxxxx"
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() =>
                  passwordRef.current?.focus()
                }
                inputRef={phoneRef}
                valid={phone.length > 0 && isValidPhone(phone)}
                error={errors.phone}
              />

              {/* ── PASSWORD ──────────────────── */}
              <AnimatedInput
                label="PASSWORD"
                icon="🔒"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  clearError('password');
                }}
                placeholder="At least 6 characters"
                returnKeyType="done"
                onSubmitEditing={onRegister}
                secureTextEntry={!showPassword}
                inputRef={passwordRef}
                error={errors.password}
                rightElement={
                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(s => !s)
                    }
                    style={styles.eyeBtn}>
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                }
              />

              {/* ── PASSWORD STRENGTH BAR ─────── */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              strength.level >= level
                                ? strength.color
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[
                    styles.strengthLabel,
                    { color: strength.color },
                  ]}>
                    {strength.label}
                  </Text>
                </View>
              )}

              {/* ── TERMS CHECKBOX ────────────── */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => {
                  setAgreedToTerms(v => !v);
                  clearError('terms');
                }}
                activeOpacity={0.8}>
                <View style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxActive,
                ]}>
                  {agreedToTerms && (
                    <Text style={styles.checkboxTick}>
                      ✓
                    </Text>
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
              {errors.terms ? (
                <Text style={styles.termsError}>
                  ⚠️ {errors.terms}
                </Text>
              ) : null}

              {/* ── REGISTER BUTTON ───────────── */}
              <Animated.View style={{
                transform: [{ scale: btnScale }],
                marginTop: 16,
              }}>
                <TouchableOpacity
                  style={[
                    styles.registerBtn,
                    loading && styles.registerBtnLoading,
                  ]}
                  onPress={onRegister}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={loading}
                  activeOpacity={0.85}>
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <Text style={styles.loadingDot}>
                        ●
                      </Text>
                      <Text style={styles.registerBtnText}>
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.registerBtnText}>
                      🌴  CREATE FREE ACCOUNT
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* ── DIVIDER ───────────────────── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  Have an account?
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── LOGIN LINK ────────────────── */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => setScreen('login')}
                activeOpacity={0.85}>
                <Text style={styles.loginBtnText}>
                  Login Instead →
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    flex:            1,
    backgroundColor: colors.backgroundWarm,
  },
  scroll: {
    flexGrow:       1,
    justifyContent: 'center',
    padding:        28,
  },

  // ── HEADER ──────────────────────────────────
  header: {
    alignItems:   'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize:     48,
    marginBottom: 10,
  },
  brand: {
    fontSize:      42,
    fontWeight:    '900',
    color:         colors.primary,
    letterSpacing: 10,
    marginBottom:  14,
  },
  decoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  12,
  },
  decoLine: {
    width:           40,
    height:          1.5,
    backgroundColor: colors.primary,
    borderRadius:    1,
    opacity:         0.4,
  },
  decoStar: {
    color:    colors.primary,
    fontSize: 12,
  },
  tagline: {
    color:         colors.textMuted,
    fontSize:      10,
    letterSpacing: 4,
    fontWeight:    '600',
  },

  // ── CARD ────────────────────────────────────
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xxlarge,
    padding:         28,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadowMd,
  },
  cardTitle: {
    fontSize:     24,
    fontWeight:   '900',
    color:        colors.textDark,
    marginBottom: 4,
  },
  cardSub: {
    fontSize:     13,
    color:        colors.textLight,
    marginBottom: 20,
    lineHeight:   20,
  },

  // ── ROLE HINT ───────────────────────────────
  roleHint: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              10,
    backgroundColor:  colors.primaryPale,
    borderRadius:     borderRadius.large,
    paddingHorizontal: 14,
    paddingVertical:  12,
    marginBottom:     20,
    borderWidth:      1,
    borderColor:      colors.primary + '30',
  },
  roleHintIcon: { fontSize: 20 },
  roleHintText: {
    fontSize:  12,
    color:     colors.textLight,
    flex:      1,
    lineHeight: 18,
  },
  roleHintBold: {
    fontWeight: '800',
    color:      colors.primary,
  },

  // ── PASSWORD STRENGTH ───────────────────────
  strengthWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  12,
    marginTop:     6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap:           4,
    flex:          1,
  },
  strengthBar: {
    flex:         1,
    height:       4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize:   11,
    fontWeight: '700',
    minWidth:   60,
    textAlign:  'right',
  },

  // ── TERMS ───────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginTop:     8,
  },
  checkbox: {
    width:          22,
    height:         22,
    borderRadius:   6,
    borderWidth:    2,
    borderColor:    colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  checkboxTick: {
    color:      colors.textWhite,
    fontSize:   12,
    fontWeight: '900',
  },
  termsText: {
    fontSize:   12,
    color:      colors.textLight,
    flex:       1,
    lineHeight: 18,
  },
  termsLink: {
    color:      colors.primary,
    fontWeight: '700',
  },
  termsError: {
    color:      '#EF4444',
    fontSize:   11,
    fontWeight: '600',
    marginTop:  6,
    marginLeft: 34,
  },

  // ── BUTTON ──────────────────────────────────
  registerBtn: {
    backgroundColor: colors.primary,
    padding:         17,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadowGold,
  },
  registerBtnLoading: {
    opacity: 0.8,
  },
  registerBtnText: {
    color:         colors.textWhite,
    fontSize:      13,
    fontWeight:    '900',
    letterSpacing: 1.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  loadingDot: {
    color:    colors.textWhite,
    fontSize: 10,
    opacity:  0.7,
  },

  // ── DIVIDER ─────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginVertical: 20,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color:      colors.textMuted,
    fontSize:   12,
    fontWeight: '600',
  },

  // ── LOGIN BUTTON ────────────────────────────
  loginBtn: {
    borderWidth:   1.5,
    borderColor:   colors.primary,
    borderRadius:  borderRadius.large,
    padding:       16,
    alignItems:    'center',
  },
  loginBtnText: {
    color:         colors.primary,
    fontSize:      13,
    fontWeight:    '900',
    letterSpacing: 1,
  },

  // ── SUCCESS ─────────────────────────────────
  successWrap: {
    alignItems:   'center',
    paddingVertical: 32,
    gap:          12,
  },
  successEmoji: {
    fontSize:     64,
    marginBottom: 8,
  },
  successTitle: {
    fontSize:   24,
    fontWeight: '900',
    color:      colors.textDark,
    textAlign:  'center',
  },
  successSub: {
    fontSize:  14,
    color:     colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── EYE BUTTON ──────────────────────────────
  eyeBtn:  { padding: 8, marginRight: -4 },
  eyeIcon: { fontSize: 16 },

  // ── FOOTER ──────────────────────────────────
  footerWrap: {
    alignItems:   'center',
    marginTop:    28,
    gap:          4,
  },
  footer: {
    color:         colors.textMuted,
    fontSize:      11,
    letterSpacing: 1,
  },
  footerVersion: {
    color:         colors.textMuted,
    fontSize:      9,
    letterSpacing: 2,
    opacity:       0.5,
  },
});