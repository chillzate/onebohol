// ============================================
// screens/LoginScreen.js
// Clean, focused login screen
// ============================================
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import {
  colors,
  shadow,
  shadowGold,
  shadowMd,
  borderRadius,
} from '../theme';

export default function LoginScreen() {
  const { setScreen }   = useAppContext();
  const { handleLogin, loading } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = useCallback(async () => {
    await handleLogin(email, password);
  }, [email, password, handleLogin]);

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

        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.brand}>ZAVARA</Text>
          <View style={styles.decoLine} />
          <Text style={styles.tagline}>
            THE ISLAND'S PULSE
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>
            Login to your account
          </Text>

          <Text style={styles.label}>EMAIL ADDRESS</Text>
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

          <Text style={styles.label}>PASSWORD</Text>
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
              onSubmitEditing={onLogin}
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
              style={styles.loginBtn}
              onPress={onLogin}
              activeOpacity={0.85}>
              <Text style={styles.loginBtnText}>
                LOGIN
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setScreen('register')}>
            <Text style={styles.switchText}>
              New to ZAVARA?{' '}
              <Text style={styles.switchLink}>
                Create account
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Built with pride in Bohol 🌴
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 10,
    marginBottom: 12,
  },
  decoLine: {
    width: 50, height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginBottom: 12,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },
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
  },
  label: {
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
  eyeBtn:  { padding: 8, marginRight: -4 },
  eyeIcon: { fontSize: 16 },
  loginBtn: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 8,
    ...shadowGold,
  },
  loginBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  switchBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: colors.textLight,
    fontSize: 13,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 28,
    letterSpacing: 1,
  },
});