// ============================================
// ZAVARA ORDER TRACKING SCREEN
// Feature E - Real-time Order Updates
// 
// BETTER THAN UBER EATS BECAUSE:
// ✅ Adaptive polling (8s-30s based on status)
// ✅ Live ETA countdown
// ✅ Full timeline history
// ✅ Rider info
// ✅ Haptics on status change
// ✅ Auto-stops polling when done
// ============================================
import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
  fonts,
  spacing,
} from '../theme';
import { showToast } from './ToastManager';
import { API_URL } from '../config';

// ============================================
// CONSTANTS
// ============================================
const STATUS_CONFIG = {
  pending: {
    color:  colors.warning,
    bg:     colors.warningPale,
    border: colors.warning + '40',
    icon:   '⏳',
    label:  'Pending',
    desc:   'Waiting for seller to confirm',
  },
  confirmed: {
    color:  colors.riderColor,
    bg:     colors.riderBg,
    border: colors.riderBorder,
    icon:   '✅',
    label:  'Confirmed',
    desc:   'Seller confirmed your order!',
  },
  preparing: {
    color:  colors.cuisineColor,
    bg:     colors.cuisineBg,
    border: colors.cuisineBorder,
    icon:   '👨‍🍳',
    label:  'Preparing',
    desc:   'Your order is being prepared',
  },
  ready: {
    color:  colors.farmerColor,
    bg:     colors.farmerBg,
    border: colors.farmerBorder,
    icon:   '📦',
    label:  'Ready',
    desc:   'Ready for pickup by rider',
  },
  delivering: {
    color:  colors.primary,
    bg:     colors.primaryPale,
    border: colors.borderGold,
    icon:   '🛵',
    label:  'On The Way',
    desc:   'Rider is heading to you!',
  },
  delivered: {
    color:  colors.success,
    bg:     colors.successPale,
    border: colors.success + '40',
    icon:   '🎉',
    label:  'Delivered',
    desc:   'Enjoy your order!',
  },
  cancelled: {
    color:  colors.danger,
    bg:     colors.dangerPale,
    border: colors.danger + '40',
    icon:   '❌',
    label:  'Cancelled',
    desc:   'This order was cancelled',
  },
};

const TIMELINE_STEPS = [
  {
    key:   'pending',
    icon:  '📝',
    label: 'Ordered',
  },
  {
    key:   'confirmed',
    icon:  '✅',
    label: 'Confirmed',
  },
  {
    key:   'preparing',
    icon:  '👨‍🍳',
    label: 'Preparing',
  },
  {
    key:   'ready',
    icon:  '📦',
    label: 'Ready',
  },
  {
    key:   'delivering',
    icon:  '🛵',
    label: 'On Way',
  },
  {
    key:   'delivered',
    icon:  '🎉',
    label: 'Done',
  },
];

const STATUS_ORDER = [
  'pending', 'confirmed', 'preparing',
  'ready', 'delivering', 'delivered',
];

// ============================================
// LIVE ETA COMPONENT
// Counts down in real time!
// Better than Uber Eats static ETA
// ============================================
function LiveETA({ etaMinutes, deliveringAt }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!etaMinutes || !deliveringAt) return;

    const update = () => {
      const start   = new Date(deliveringAt);
      const now     = new Date();
      const elapsed = (now - start) / 1000 / 60;
      const left    = Math.max(0, etaMinutes - elapsed);
      setRemaining(Math.ceil(left));
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [etaMinutes, deliveringAt]);

  if (remaining === null) return null;

  return (
    <View style={etaStyles.wrap}>
      <View style={etaStyles.iconWrap}>
        <Text style={etaStyles.icon}>🛵</Text>
      </View>
      <View style={etaStyles.info}>
        <Text style={etaStyles.label}>
          ESTIMATED ARRIVAL
        </Text>
        <Text style={etaStyles.value}>
          {remaining === 0
            ? 'Arriving now! 🎉'
            : `~${remaining} min${remaining === 1 ? '' : 's'}`
          }
        </Text>
      </View>
      <View style={etaStyles.pulse}>
        <Text style={etaStyles.pulseText}>LIVE</Text>
      </View>
    </View>
  );
}

const etaStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.large,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: 16,
    ...shadowGold,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon:  { fontSize: 20 },
  info:  { flex: 1 },
  label: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 1.5,
    marginBottom:  4,
  },
  value: {
    color:      colors.primary,
    fontSize:   22,
    fontWeight: '900',
  },
  pulse: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  pulseText: {
    color:         colors.textWhite,
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 1,
  },
});

// ============================================
// PROGRESS BAR COMPONENT
// ============================================
function ProgressBar({ percent }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         percent,
      duration:        800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const width = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={progressStyles.wrap}>
      <View style={progressStyles.track}>
        <Animated.View
          style={[progressStyles.fill, { width }]}
        />
      </View>
      <Text style={progressStyles.pct}>
        {percent}%
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  16,
  },
  track: {
    flex:            1,
    height:          8,
    backgroundColor: colors.border,
    borderRadius:    borderRadius.round,
    overflow:        'hidden',
  },
  fill: {
    height:          '100%',
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.round,
  },
  pct: {
    color:      colors.primary,
    fontSize:   13,
    fontWeight: '900',
    width:      36,
    textAlign:  'right',
  },
});

// ============================================
// STATUS TIMELINE COMPONENT
// Full history of what happened when
// Uber Eats doesn't have this!
// ============================================
function StatusTimeline({ history, currentStatus }) {
  if (!history || history.length === 0) return null;

  return (
    <View style={tlStyles.wrap}>
      <Text style={tlStyles.title}>ORDER TIMELINE</Text>
      {history.map((item, index) => {
        const isLast   = index === history.length - 1;
        const cfg      = STATUS_CONFIG[item.status] || {};
        const dateStr  = item.timestamp
          ? new Date(item.timestamp).toLocaleTimeString(
              'en-PH',
              { hour: '2-digit', minute: '2-digit' }
            )
          : '';
        return (
          <View key={index} style={tlStyles.item}>
            {/* Line */}
            {!isLast && (
              <View style={tlStyles.line} />
            )}
            {/* Dot */}
            <View style={[
              tlStyles.dot,
              isLast && {
                backgroundColor: cfg.bg || colors.primaryPale,
                borderColor:     cfg.border || colors.borderGold,
              },
            ]}>
              <Text style={tlStyles.dotIcon}>
                {cfg.icon || '📋'}
              </Text>
            </View>
            {/* Content */}
            <View style={tlStyles.content}>
              <View style={tlStyles.contentTop}>
                <Text style={[
                  tlStyles.statusLabel,
                  isLast && { color: cfg.color || colors.primary },
                ]}>
                  {cfg.label || item.status}
                </Text>
                <Text style={tlStyles.time}>
                  {dateStr}
                </Text>
              </View>
              {item.note && (
                <Text style={tlStyles.note}>
                  {item.note}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  title: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 2,
    marginBottom:  16,
  },
  item: {
    flexDirection: 'row',
    gap:           12,
    marginBottom:  12,
    position:      'relative',
  },
  line: {
    position:        'absolute',
    left:            18,
    top:             36,
    bottom:          -12,
    width:           2,
    backgroundColor: colors.border,
    zIndex:          0,
  },
  dot: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.inputBackground,
    borderWidth:     2,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1,
  },
  dotIcon:  { fontSize: 14 },
  content:  { flex: 1, paddingTop: 4 },
  contentTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   2,
  },
  statusLabel: {
    color:      colors.textDark,
    fontSize:   13,
    fontWeight: '700',
  },
  time: {
    color:    colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  note: {
    color:      colors.textLight,
    fontSize:   11,
    fontWeight: '500',
    lineHeight: 16,
  },
});

// ============================================
// MAIN SCREEN
// ============================================
export default function OrderHistoryScreen({
  userId,
  onBack,
  onOpenTracking,   // ✅ ADD THIS
}) {
  const [orderData, setOrderData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [prevStatus, setPrevStatus]   = useState(null);
  const [cancelling, setCancelling]   = useState(false);

  const pollingRef  = useRef(null);
  const mountedRef  = useRef(true);

  // ============================================
  // FETCH ORDER DATA
  // ============================================
  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/orders/${orderId}/track`,
        {
          params:  { user_id: userId },
          timeout: 10000,
        }
      );
      if (!mountedRef.current) return;

      const data = res.data;

      // ✅ Haptic when status changes!
      // Better than Uber Eats - they don't do this
      if (prevStatus && prevStatus !== data.status) {
        if (data.status === 'delivered') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
        } else if (data.status === 'cancelled') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          ).catch(() => {});
        } else {
          Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium
          ).catch(() => {});
        }
        showToast(
          data.status === 'cancelled'
            ? 'error'
            : 'success',
          `Order ${STATUS_CONFIG[data.status]?.icon || ''} ${STATUS_CONFIG[data.status]?.label || data.status}`,
          STATUS_CONFIG[data.status]?.desc || ''
        );
      }

      setPrevStatus(data.status);
      setOrderData(data);

      // ✅ Schedule next poll based on server suggestion
      // Server tells us exactly how fast to poll!
      scheduleNextPoll(
        data.poll_interval_seconds || 20,
        data.should_stop_polling || false
      );

    } catch (err) {
      if (!mountedRef.current) return;
      if (!silent) {
        showToast(
          'error',
          'Could not load order',
          'Pull down to retry'
        );
      }
      // Retry after 30s on error
      scheduleNextPoll(30, false);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [orderId, userId, prevStatus]);

  // ============================================
  // SMART POLLING
  // Server tells us how fast to poll!
  // 8s when delivering, 30s when pending
  // Uber Eats uses fixed 30s - we are smarter!
  // ============================================
  const scheduleNextPoll = useCallback((
    intervalSeconds,
    shouldStop
  ) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    if (shouldStop || !mountedRef.current) return;

    pollingRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchOrder(true);
      }
    }, intervalSeconds * 1000);
  }, [fetchOrder]);

  // ============================================
  // LIFECYCLE
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    fetchOrder(false);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    fetchOrder(false);
  }, [fetchOrder]);

  // ============================================
  // CANCEL ORDER
  // ============================================
  const handleCancel = useCallback(async () => {
    setCancelling(true);
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});

    try {
      await axios.patch(
        `${API_URL}/orders/${orderId}/cancel`,
        null,
        {
          params:  {
            buyer_id: userId,
            reason:   'Cancelled by buyer',
          },
          timeout: 10000,
        }
      );
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      showToast(
        'info',
        'Order Cancelled',
        'Your order has been cancelled'
      );
      fetchOrder(false);
    } catch {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      showToast(
        'error',
        'Could not cancel',
        'Please try again'
      );
    } finally {
      setCancelling(false);
    }
  }, [orderId, userId, fetchOrder]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && !orderData) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Track Order
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading your order...
          </Text>
        </View>
      </View>
    );
  }

  if (!orderData) return null;

  const status    = STATUS_CONFIG[orderData.status] || {};
  const currIdx   = STATUS_ORDER.indexOf(orderData.status);
  const isDone    = orderData.should_stop_polling;
  const canCancel = orderData.can_cancel;
  const canReview = orderData.can_review;

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Track Order
          </Text>
          <Text style={styles.headerSub}>
            {orderData.order_code}
          </Text>
        </View>
        {!isDone && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveDot}>●</Text>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {isDone && (
          <View style={{ width: 52 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>

        {/* ── STATUS HERO ── */}
        <View style={[styles.statusHero, {
          backgroundColor: status.bg,
          borderColor:     status.border,
        }]}>
          <View style={styles.statusIconWrap}>
            <Text style={styles.statusIconBig}>
              {status.icon}
            </Text>
          </View>
          <Text style={[
            styles.statusHeroLabel,
            { color: status.color },
          ]}>
            {status.label}
          </Text>
          <Text style={styles.statusHeroDesc}>
            {status.desc}
          </Text>
          {orderData.cancel_reason && (
            <View style={styles.cancelReasonWrap}>
              <Text style={styles.cancelReasonText}>
                Reason: {orderData.cancel_reason}
              </Text>
            </View>
          )}
        </View>

        {/* ── PROGRESS BAR ── */}
        {orderData.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PROGRESS
            </Text>
            <ProgressBar
              percent={orderData.progress_percent || 0}
            />
          </View>
        )}

        {/* ── LIVE ETA ── */}
        {orderData.status === 'delivering' &&
         orderData.eta_minutes && (
          <LiveETA
            etaMinutes={orderData.eta_minutes}
            deliveringAt={orderData.delivering_at}
          />
        )}

        {/* ── STEP TRACKER ── */}
        {orderData.status !== 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              ORDER STEPS
            </Text>
            <View style={styles.steps}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isDoneStep = idx <= currIdx;
                const isActive   = idx === currIdx;
                const isLastStep =
                  idx === TIMELINE_STEPS.length - 1;
                return (
                  <View
                    key={step.key}
                    style={styles.stepItem}>
                    {!isLastStep && (
                      <View style={[
                        styles.stepLine,
                        isDoneStep &&
                        idx < currIdx &&
                        styles.stepLineDone,
                      ]} />
                    )}
                    <View style={[
                      styles.stepDot,
                      isDoneStep && styles.stepDotDone,
                      isActive  && styles.stepDotActive,
                    ]}>
                      <Text style={styles.stepDotIcon}>
                        {step.icon}
                      </Text>
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      isDoneStep && styles.stepLabelDone,
                      isActive   && styles.stepLabelActive,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── ORDER INFO ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            ORDER DETAILS
          </Text>

          <InfoRow
            icon="🏷️"
            label="ITEM"
            value={orderData.item_name || 'Unknown'}
          />
          <InfoRow
            icon="📦"
            label="QUANTITY"
            value={`${orderData.quantity} item${orderData.quantity > 1 ? 's' : ''}`}
          />
          {orderData.delivery_address && (
            <InfoRow
              icon="📍"
              label="DELIVER TO"
              value={orderData.delivery_address}
            />
          )}
          <InfoRow
            icon="💳"
            label="PAYMENT"
            value={
              orderData.payment_method === 'cod'
                ? '💵 Cash on Delivery'
                : '📱 GCash'
            }
          />
          <InfoRow
            icon="💰"
            label="TOTAL"
            value={`₱${(orderData.grand_total || orderData.total_price || 0).toFixed(2)}`}
            valueStyle={styles.totalValueStyle}
          />
        </View>

        {/* ── RIDER INFO ── */}
        {(orderData.rider_name ||
          orderData.seller_name) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {orderData.rider_name
                ? 'RIDER INFO'
                : 'SELLER INFO'}
            </Text>
            {orderData.rider_name && (
              <InfoRow
                icon="🛵"
                label="RIDER"
                value={orderData.rider_name}
              />
            )}
            {orderData.rider_phone && (
              <InfoRow
                icon="📞"
                label="CONTACT"
                value={orderData.rider_phone}
              />
            )}
            {!orderData.rider_name &&
             orderData.seller_name && (
              <InfoRow
                icon="🏪"
                label="SELLER"
                value={orderData.seller_name}
              />
            )}
            {orderData.seller_phone && (
              <InfoRow
                icon="📞"
                label="CONTACT"
                value={orderData.seller_phone}
              />
            )}
          </View>
        )}

        {/* ── TIMELINE HISTORY ── */}
        <StatusTimeline
          history={orderData.status_history}
          currentStatus={orderData.status}
        />

        {/* ── ACTION BUTTONS ── */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}>
            {cancelling ? (
              <ActivityIndicator
                size="small"
                color={colors.danger}
              />
            ) : (
              <Text style={styles.cancelBtnText}>
                ❌ Cancel Order
              </Text>
            )}
          </TouchableOpacity>
        )}

        {canReview && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => {
              Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Medium
              ).catch(() => {});
              onReview?.(orderData);
            }}
            activeOpacity={0.8}>
            <Text style={styles.reviewBtnText}>
              ⭐ Rate This Order
            </Text>
          </TouchableOpacity>
        )}

        {/* Polling info (dev only) */}
        {__DEV__ && !isDone && (
          <Text style={styles.devPoll}>
            🔄 Polling every{' '}
            {orderData.poll_interval_seconds}s
          </Text>
        )}

      </ScrollView>
    </View>
  );
}

// ============================================
// INFO ROW COMPONENT
// ============================================
function InfoRow({
  icon, label, value, valueStyle,
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>
          {value}
        </Text>
      </View>
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
  header: {
    backgroundColor:    colors.headerBg,
    paddingTop:         52,
    paddingBottom:      16,
    paddingHorizontal:  20,
    flexDirection:      'row',
    alignItems:         'center',
    justifyContent:     'space-between',
    borderBottomWidth:  1,
    borderBottomColor:  colors.headerBorder,
    ...shadow,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: colors.inputBackground,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  backText: {
    color:      colors.primary,
    fontSize:   18,
    fontWeight: '700',
  },
  headerCenter: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
  },
  headerTitle: {
    color:      colors.textDark,
    fontSize:   18,
    fontWeight: '900',
  },
  headerSub: {
    color:      colors.textMuted,
    fontSize:   11,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: colors.successPale,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius:    borderRadius.round,
    borderWidth:     1,
    borderColor:     colors.success + '40',
  },
  liveDot: {
    color:    colors.success,
    fontSize: 8,
  },
  liveText: {
    color:         colors.success,
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 1,
  },

  // ── SCROLL ──────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    padding:       16,
    paddingBottom: 100,
    gap:           16,
  },

  // ── STATUS HERO ─────────────────────────────
  statusHero: {
    borderRadius: borderRadius.xxlarge,
    padding:      24,
    alignItems:   'center',
    gap:          8,
    borderWidth:  1,
    ...shadowMd,
  },
  statusIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.glass20,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    8,
  },
  statusIconBig:   { fontSize: 36 },
  statusHeroLabel: {
    fontSize:   24,
    fontWeight: '900',
  },
  statusHeroDesc: {
    color:      colors.textMedium,
    fontSize:   13,
    fontWeight: '500',
    textAlign:  'center',
  },
  cancelReasonWrap: {
    backgroundColor: colors.dangerPale,
    borderRadius:    borderRadius.medium,
    padding:         10,
    marginTop:       8,
    borderWidth:     1,
    borderColor:     colors.danger + '30',
  },
  cancelReasonText: {
    color:      colors.danger,
    fontSize:   12,
    fontWeight: '600',
    textAlign:  'center',
  },

  // ── SECTION ─────────────────────────────────
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  sectionTitle: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 2,
    marginBottom:  14,
  },

  // ── CARD ────────────────────────────────────
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             12,
    ...shadow,
  },

  // ── STEPS ───────────────────────────────────
  steps: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  stepItem: {
    flex:       1,
    alignItems: 'center',
    position:   'relative',
  },
  stepLine: {
    position:        'absolute',
    top:             18,
    left:            '50%',
    width:           '100%',
    height:          2,
    backgroundColor: colors.border,
    zIndex:          1,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
    opacity:         0.5,
  },
  stepDot: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.inputBackground,
    borderWidth:     2,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    6,
    zIndex:          2,
  },
  stepDotDone: {
    backgroundColor: colors.primaryPale,
    borderColor:     colors.primary,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
    ...shadowGold,
  },
  stepDotIcon:   { fontSize: 14 },
  stepLabel: {
    fontSize:   8,
    color:      colors.textMuted,
    fontWeight: '600',
    textAlign:  'center',
  },
  stepLabelDone: {
    color:      colors.primary,
    fontWeight: '800',
  },
  stepLabelActive: {
    color:      colors.primary,
    fontWeight: '900',
    fontSize:   9,
  },

  // ── INFO ROW ────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
  },
  infoIconWrap: {
    width:           36,
    height:          36,
    borderRadius:    12,
    backgroundColor: colors.inputBackground,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  infoIcon:    { fontSize: 16 },
  infoContent: { flex: 1, paddingTop: 2 },
  infoLabel: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.5,
    marginBottom:  3,
  },
  infoValue: {
    color:      colors.textDark,
    fontSize:   13,
    fontWeight: '600',
    lineHeight: 18,
  },
  totalValueStyle: {
    color:      colors.primary,
    fontSize:   18,
    fontWeight: '900',
  },

  // ── BUTTONS ─────────────────────────────────
  cancelBtn: {
    backgroundColor: colors.dangerPale,
    borderRadius:    borderRadius.large,
    padding:         15,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.danger + '30',
  },
  cancelBtnText: {
    color:      colors.danger,
    fontSize:   14,
    fontWeight: '800',
  },
  reviewBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.large,
    padding:         15,
    alignItems:      'center',
    ...shadowGold,
  },
  reviewBtnText: {
    color:      colors.textWhite,
    fontSize:   14,
    fontWeight: '900',
  },

  // ── LOADING ─────────────────────────────────
  loadingWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            14,
  },
  loadingText: {
    color:      colors.textLight,
    fontSize:   13,
    fontWeight: '600',
  },

  // ── DEV ─────────────────────────────────────
  devPoll: {
    color:      colors.textMuted,
    fontSize:   10,
    textAlign:  'center',
    fontWeight: '500',
  },
});