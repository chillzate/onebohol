import { useState } from 'react';
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
  ScrollView
} from 'react-native';
import axios from 'axios';

LogBox.ignoreLogs(['Warning:']);

const API_URL = 'http://192.168.55.210:8000';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');

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
      setScreen('home');
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password');
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
        { name, email, password },
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

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.welcome}>Welcome! 🌴</Text>
          <Text style={styles.welcomeName}>{loggedInUser}</Text>
          <Text style={styles.welcomeSub}>
            You are now part of OneBohol
          </Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem}>
              <Text style={styles.gridIcon}>🛒</Text>
              <Text style={styles.gridText}>Buy Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <Text style={styles.gridIcon}>🚗</Text>
              <Text style={styles.gridText}>Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <Text style={styles.gridIcon}>💼</Text>
              <Text style={styles.gridText}>Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <Text style={styles.gridIcon}>🚨</Text>
              <Text style={styles.gridText}>SOS</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              setScreen('login');
              setEmail('');
              setPassword('');
              setName('');
              setLoggedInUser('');
            }}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // REGISTER SCREEN
  if (screen === 'register') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>🌴 OneBohol</Text>
          <Text style={styles.subtitle}>Create Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {loading ? (
            <ActivityIndicator size="large" color="#2E86AB" />
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}>
              <Text style={styles.buttonText}>REGISTER</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setScreen('login')}>
            <Text style={styles.link}>
              Already have account? Login here
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // LOGIN SCREEN
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🌴 OneBohol</Text>
        <Text style={styles.subtitle}>Connecting Bohol</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loading ? (
          <ActivityIndicator size="large" color="#2E86AB" />
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}>
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setScreen('register')}>
          <Text style={styles.link}>
            Don't have account? Register here
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD'
  },
  button: {
    width: '100%',
    backgroundColor: '#2E86AB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  link: {
    color: '#2E86AB',
    fontSize: 14,
    marginTop: 10
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 5
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  welcomeSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30
  },
  gridItem: {
    width: '47%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  gridIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  gridText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});