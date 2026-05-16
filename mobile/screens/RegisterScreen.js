// ============================================
// screens/RegisterScreen.js
// Clean registration screen
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
  shadowGold,
  shadowMd,
  borderRadius,
} from '../theme';

export default function RegisterScreen() {
  const { setScreen }   = useAppContext();
  const { handleRegister, loading } = useAuth();

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onRegister = useCallback(async () => {
    const success = await handleRegister({
      name, email, password, phone,
    });
    if (success) {
      setName('');
      setPhone('');
      setPassword('');
    }
  }, [name, email, password, phone, handleRegister]);

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

        <View style={styles.header}>
          <Text style={styles.brand}>ZAVARA</Text>
          <View style={styles.decoLine} />
          <Text style={styles.tagline}>
            CREATE YOUR ACCOUNT
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Create Account
          </Text>
          <Text style={styles.cardSub}>
            Join the ZAVARA community
          </Text>

          {[
            {
              label: 'FULL NAME',
              icon: '👤',
              value: name,
              setter: setName,
              placeholder: 'Juan dela Cruz',
              autoCapitalize: 'words',
              keyboardType: 'default',
            },
            {
              label: 'EMAIL ADDRESS',
              icon: '✉️',
              value: email,
              setter: setEmail,
              placeholder: 'juan@email.com',
              autoCapitalize: 'none',
              keyboardType: 'email-address',
              autoCorrect: false,
            },
            {
              label: 'PHONE NUMBER',
              icon: '📱',
              value: phone,
              setter: setPhone,
              placeholder: '09xxxxxxxxx (optional)',
              keyboardType: 'phone-pad',
            },
          ].map((field) => (
            <View key={field.label}>
              <Text style={styles.label}>
                {field.label}
              </Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>
                  {field.icon}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboardType}
                  autoCapitalize={
                    field.autoCapitalize || 'sentences'
                  }
                  autoCorrect={field.autoCorrect ?? true}
                  returnKeyType="next"
                />
              </View>
            </View>
          ))}

          <Text style={styles.label}>PASSWORD</Text>
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
              onSubmitEditing={onRegister}
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
              style={styles.registerBtn}
              onPress={onRegister}
              activeOpacity={0.85}>
              <Text style={styles.registerBtnText}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setScreen('login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink}>
                Login here
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
  registerBtn: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 8,
    ...shadowGold,
  },
  registerBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  switchBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: { color: colors.textLight, fontSize: 13 },
  switchLink: { color: colors.primary, fontWeight: '800' },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 28,
    letterSpacing: 1,
  },
});