// ============================================
// ZAVARA NOTIFICATION HELPER - FIXED v2.1
// ============================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config'; // 🔧 FIX

// ============================================
// SETUP NOTIFICATION HANDLER
// ============================================
// 🔧 FIX: Wrapped in try/catch in case
// expo-notifications not available in Expo Go
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (err) {
  console.log('Notifications not available:', err);
}

// ============================================
// REGISTER FOR PUSH NOTIFICATIONS
// ============================================
export async function registerForPushNotifications(
  userId
) {
  // 🔧 FIX: Guard for web/simulator
  if (!Device.isDevice) {
    console.log(
      '📱 Push notifications require a physical device'
    );
    return null;
  }

  try {
    // Check current permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Request if not granted
    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return null;
    }

    // 🔧 FIX: SDK 50+ requires projectId
    let token;
    try {
      const tokenData =
        await Notifications.getExpoPushTokenAsync({
          // Works with or without projectId
          // projectId is auto-detected from app.json
        });
      token = tokenData.data;
    } catch (tokenErr) {
      // Fallback for older SDK
      console.log(
        'Token error (may need projectId):',
        tokenErr?.message
      );
      try {
        const fallback =
          await Notifications.getExpoPushTokenAsync();
        token = fallback.data;
      } catch {
        console.log('Could not get push token');
        return null;
      }
    }

    if (!token) {
      console.log('❌ No push token received');
      return null;
    }

    console.log('✅ Push token:', token);

    // 🔧 FIX: Setup Android channel ONCE
    if (Platform.OS === 'android') {
      await setupAndroidChannel();
    }

    // Save token to backend
    await saveTokenToBackend(userId, token);

    return token;

  } catch (err) {
    console.log(
      '❌ Push notification setup failed:',
      err?.message
    );
    return null;
  }
}

// ============================================
// SETUP ANDROID CHANNEL (separated)
// ============================================
async function setupAndroidChannel() {
  try {
    // 🔧 FIX: Check if channel exists first
    const existing =
      await Notifications.getNotificationChannelAsync(
        'zavara-default'
      );

    if (!existing) {
      await Notifications.setNotificationChannelAsync(
        'zavara-default',
        {
          name: 'ZAVARA Notifications',
          description: 'Order updates and alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C4951E',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        }
      );
      console.log('✅ Android notification channel created');
    }
  } catch (err) {
    console.log('Android channel error:', err?.message);
  }
}

// ============================================
// SAVE TOKEN TO BACKEND
// ============================================
async function saveTokenToBackend(userId, token) {
  if (!userId || !token) return;

  try {
    await axios.post(
      `${API_URL}/notifications/save-token`,
      null,
      {
        params: { user_id: userId, token },
        timeout: 8000,
      }
    );
    console.log('✅ Push token saved to backend!');
  } catch (err) {
    // Non-critical - don't crash the app
    console.log(
      '⚠️ Could not save token:',
      err?.response?.status || err?.message
    );
  }
}

// ============================================
// SETUP NOTIFICATION LISTENERS
// ============================================
export function setupNotificationListeners(
  onNotification,
  onResponse
) {
  try {
    // When notification received (app in foreground)
    const notificationListener =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('📬 Notification received!');
          // Extract useful data
          const {
            title,
            body,
            data,
          } = notification.request.content;

          console.log('  Title:', title);
          console.log('  Body:', body);
          console.log('  Data:', data);

          if (onNotification) {
            onNotification(notification);
          }
        }
      );

    // When user taps notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Notification tapped!');
          const data =
            response.notification.request.content.data;
          console.log('  Data:', data);

          if (onResponse) {
            onResponse(response);
          }
        }
      );

    return {
      notificationListener,
      responseListener,
    };
  } catch (err) {
    console.log(
      'Could not setup notification listeners:',
      err?.message
    );
    // Return dummy listeners to prevent crashes
    return {
      notificationListener: { remove: () => {} },
      responseListener:     { remove: () => {} },
    };
  }
}

// ============================================
// REMOVE LISTENERS
// ============================================
export function removeNotificationListeners(listeners) {
  if (!listeners) return;

  try {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(
        listeners.notificationListener
      );
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(
        listeners.responseListener
      );
    }
    console.log('✅ Notification listeners removed');
  } catch (err) {
    console.log(
      'Error removing listeners:',
      err?.message
    );
  }
}

// ============================================
// 🆕 SCHEDULE LOCAL NOTIFICATION
// (for testing without backend)
// ============================================
export async function scheduleLocalNotification(
  title,
  body,
  data = {}
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediate
    });
    console.log('✅ Local notification scheduled');
  } catch (err) {
    console.log(
      'Local notification error:',
      err?.message
    );
  }
}

// ============================================
// 🆕 GET NOTIFICATION BADGE COUNT
// ============================================
export async function getBadgeCount() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

// ============================================
// 🆕 CLEAR NOTIFICATION BADGE
// ============================================
export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (err) {
    console.log('Clear badge error:', err?.message);
  }
}

// ============================================
// 🆕 DISMISS ALL NOTIFICATIONS
// ============================================
export async function dismissAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (err) {
    console.log('Dismiss error:', err?.message);
  }
}