// ============================================
// ZAVARA NOTIFICATIONHELPER v4.0
// ✅ Deep link to OrderTracking
// ✅ Smart routing
// ✅ Badge sync
// ✅ Foreground echo
// ✅ Production-safe
// ============================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { API_URL } from '../config';

const isDev = __DEV__;
const log = (...args) => { if (isDev) console.log(...args); };

// ============================================
// HANDLER
// ============================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ============================================
// ANDROID CHANNELS (SEPARATED BY TYPE)
// ============================================
async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  const channels = [
    {
      id: 'zavara-orders',
      name: 'Order Updates',
      description: 'Live order tracking updates',
    },
    {
      id: 'zavara-payments',
      name: 'Payment Alerts',
      description: 'GCash & payment notifications',
    },
    {
      id: 'zavara-general',
      name: 'General Notifications',
      description: 'Other alerts',
    },
  ];

  for (const channel of channels) {
    const existing =
      await Notifications.getNotificationChannelAsync(channel.id);

    if (!existing) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C4951E',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      log(`✅ Created channel: ${channel.id}`);
    }
  }
}

// ============================================
// SAVE TOKEN
// ============================================
async function saveTokenToBackend(userId, token) {
  if (!userId || !token) return;

  try {
    await axios.post(
      `${API_URL}/notifications/save-token`,
      null,
      { params: { user_id: userId, token }, timeout: 8000 }
    );
    log('✅ Push token saved');
  } catch (err) {
    log('⚠️ Save token failed:', err?.message);
  }
}

// ============================================
// REGISTER DEVICE
// ============================================
export async function registerForPushNotifications(userId) {
  if (!Device.isDevice) return null;

  const { status: existing } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    log('❌ Permission denied');
    return null;
  }

  const tokenData =
    await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  await saveTokenToBackend(userId, token);

  return token;
}

// ============================================
// SMART LISTENERS (DEEP LINKING)
// ============================================
export function setupNotificationListeners(navigationHandler) {

  const notificationListener =
    Notifications.addNotificationReceivedListener(
      async (notification) => {
        log('📬 Foreground notification');

        // Foreground echo haptic
        await Haptics.impactAsync(
          Haptics.ImpactFeedbackStyle.Light
        ).catch(() => {});
      }
    );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        log('👆 Notification tapped');

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});

        const data =
          response.notification.request.content.data;

        // =====================================
        // SMART ROUTING
        // =====================================
        if (data?.type === 'order_status_update') {
          navigationHandler?.({
            screen: 'tracking',
            orderId: data.order_id,
          });
        }

        if (data?.type === 'payment_approved') {
          navigationHandler?.({
            screen: 'tracking',
            orderId: data.order_id,
          });
        }

        if (data?.type === 'payment_rejected') {
          navigationHandler?.({
            screen: 'tracking',
            orderId: data.order_id,
          });
        }

        if (data?.type === 'order_cancelled') {
          navigationHandler?.({
            screen: 'orders',
          });
        }
      }
    );

  return { notificationListener, responseListener };
}

// ============================================
// CLEANUP
// ============================================
export function removeNotificationListeners(listeners) {
  if (!listeners) return;

  Notifications.removeNotificationSubscription(
    listeners.notificationListener
  );

  Notifications.removeNotificationSubscription(
    listeners.responseListener
  );
}

// ============================================
// BADGE CONTROL
// ============================================
export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}