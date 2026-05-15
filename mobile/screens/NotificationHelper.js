import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';

const API_URL = 'https://onebohol-production.up.railway.app';

// ============================================
// SETUP NOTIFICATIONS
// ============================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// GET PUSH TOKEN
// ============================================
export async function registerForPushNotifications(
  userId
) {
  if (!Device.isDevice) {
    console.log('Must use physical device!');
    return null;
  }

  // Check permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('No notification permission!');
    return null;
  }

  // Get token
  const token = (
    await Notifications.getExpoPushTokenAsync()
  ).data;

  console.log('Push token:', token);

  // Save to backend
  try {
    await axios.post(
      `${API_URL}/notifications/save-token`,
      null,
      {
        params: {
          user_id: userId,
          token: token,
        },
      }
    );
    console.log('✅ Push token saved!');
  } catch (error) {
    console.log('❌ Could not save token:', error);
  }

  // Android channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(
      'default',
      {
        name: 'ZAVARA',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C4951E',
      }
    );
  }

  return token;
}

// ============================================
// LISTEN FOR NOTIFICATIONS
// ============================================
export function setupNotificationListeners(
  onNotification,
  onResponse
) {
  // When app is open
  const notificationListener =
    Notifications.addNotificationReceivedListener(
      notification => {
        console.log('📱 Notification received!');
        if (onNotification) onNotification(notification);
      }
    );

  // When user taps notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('👆 Notification tapped!');
        if (onResponse) onResponse(response);
      }
    );

  return {
    notificationListener,
    responseListener,
  };
}

// ============================================
// REMOVE LISTENERS
// ============================================
export function removeNotificationListeners(
  listeners
) {
  Notifications.removeNotificationSubscription(
    listeners.notificationListener
  );
  Notifications.removeNotificationSubscription(
    listeners.responseListener
  );
}