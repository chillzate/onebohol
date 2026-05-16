// ============================================
// ZAVARA ORDER HISTORY SCREEN - v3.0
// ============================================
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { showToast } from './ToastManager';
import { API_URL } from '../config';

// ============================================
// CONSTANTS (outside component = no re-creation)
// ============================================
const FILTERS = [
  'All', 'Pending', 'Confirmed',
  'Preparing', 'Delivering',
  'Delivered', 'Cancelled',
];

const STATUS_CONFIG = {
  pending: {
    color:  colors.warning,
    bg:     colors.warningPale,
    border: colors.warning + '25',
    icon:   '⏳',
    label:  'PENDING',
  },
  confirmed: {
    color:  colors.riderColor,
    bg:     colors.riderBg,
    border: colors.riderBorder,
    icon:   '✅',
    label:  'CONFIRMED',
  },
  preparing: {
    color:  colors.cuisineColor,
    bg:     colors.cuisineBg,
    border: colors.cuisineBorder,
    icon:   '👨‍🍳',
    label:  'PREPARING',
  },
  delivering: {
    color:  colors.primary,
    bg:     colors.primaryPale,
    border: colors.borderGold,
    icon:   '🛵',
    label:  'ON THE WAY',
  },
  delivered: {
    color:  colors.success,
    bg:     colors.successPale,
    border: colors.success + '25',
    icon:   '🎉',
    label:  'DELIVERED',
  },
  cancelled: {
    color:  colors.danger,
    bg:     colors.dangerPale,
    border: colors.danger + '25',
    icon:   '❌',
    label:  'CANCELLED',
  },
  ready: {
    color:  colors.farmerColor,
    bg:     colors.farmerBg,
    border: colors.farmerBorder,
    icon:   '📦',
    label:  'READY',
  },
};

const TRACKER_STEPS = [
  { key: 'pending',    icon: '📝', label: 'Ordered'   },
  { key: 'confirmed',  icon: '✅', label: 'Confirmed'  },
  { key: 'preparing',  icon: '👨‍🍳', label: 'Cooking'   },
  { key: 'delivering', icon: '🛵', label: 'On Way'     },
  { key: 'delivered',  icon: '🎉', label: 'Done'       },
];

const STATUS_ORDER = [
  'pending', 'confirmed',
  'preparing', 'delivering', 'delivered',
];

const RATING_LABELS = {
  1: 'Poor 😞',
  2: 'Fair 😐',
  3: 'Good 🙂',
  4: 'Great 😊',
  5: 'Excellent! 🤩',
};

const QUICK_TAGS = [
  '😋 Delicious',
  '🚀 Fast Delivery',
  '📦 Good Packaging',
  '💰 Worth the Price',
  '🌟 Will Order Again',
  '🤝 Great Service',
];

// ============================================
// REVIEW MODAL - separate component
// ← Prevents keyboard dismiss bug
// ============================================
function ReviewModal({
  visible,
  order,
  onClose,
  onSubmit,
  submitting,
}) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
    }
  }, [visible]);

  const toggleTag = useCallback((tag) => {
    setComment(prev =>
      prev.includes(tag)
        ? prev.replace(tag, '').trim()
        : prev ? `${prev} ${tag}` : tag
    );
  }, []);

  const handleSubmit = () => {
    if (rating === 0) {
      showToast('warning', 'Select Rating',
        'Please select a star rating!');
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {/* Title */}
            <Text style={styles.modalTitle}>
              Rate Your Order
            </Text>
            <Text style={styles.modalSub}>
              Order #{String(order?.id || 0).padStart(4, '0')}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* STARS */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starBtn}
                    activeOpacity={0.7}>
                    <Animated.Text style={[
                      styles.starIcon,
                      star <= rating && styles.starActive,
                    ]}>
                      {star <= rating ? '⭐' : '☆'}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating label */}
              <Text style={styles.ratingLabel}>
                {rating > 0
                  ? RATING_LABELS[rating]
                  : 'Tap a star to rate'}
              </Text>

              {/* Quick tags */}
              <Text style={styles.tagsTitle}>
                QUICK FEEDBACK
              </Text>
              <View style={styles.tagsRow}>
                {QUICK_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      comment.includes(tag) && styles.tagActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.8}>
                    <Text style={[
                      styles.tagText,
                      comment.includes(tag) &&
                      styles.tagTextActive,
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment input */}
              <Text style={styles.tagsTitle}>
                ADDITIONAL COMMENTS
              </Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share more about your experience..."
                placeholderTextColor={colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Buttons */}
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={onClose}
                  activeOpacity={0.8}>
                  <Text style={styles.skipBtnText}>
                    Maybe Later
                  </Text>
                </TouchableOpacity>

                {submitting ? (
                  <View style={[styles.submitBtn,
                    { justifyContent: 'center' }]}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      rating === 0 && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={rating === 0}
                    activeOpacity={0.85}>
                    <Text style={styles.submitBtnText}>
                      ⭐ Submit Review
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================
// ORDER CARD - separate component
// ← Prevents full list re-render on expand
// ============================================
function OrderCard({
  item,
  isExpanded,
  onToggle,
  onCancel,
  onReview,
}) {
  const animHeight = useRef(new Animated.Value(0)).current;

  const status       = STATUS_CONFIG[item.status?.toLowerCase()] || {
    color:  colors.textLight,
    bg:     colors.inputBackground,
    border: colors.border,
    icon:   '❓',
    label:  (item.status || 'UNKNOWN').toUpperCase(),
  };

  const currentIndex = STATUS_ORDER.indexOf(
    item.status?.toLowerCase()
  );
  const isCancelled  = item.status?.toLowerCase() === 'cancelled';
  const isDelivered  = item.status?.toLowerCase() === 'delivered';
  const isPending    = item.status?.toLowerCase() === 'pending';
  const orderTotal   = item.grand_total || item.total_price || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        month:  'short',
        day:    'numeric',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
      });
    } catch { return 'N/A'; }
  };

  return (
    <View style={styles.orderCard}>

      {/* ── ALWAYS VISIBLE TOP ── */}
      <TouchableOpacity
        style={styles.orderCardTop}
        onPress={onToggle}
        activeOpacity={0.85}>

        <View style={styles.orderCardTopLeft}>
          {/* Order type pill */}
          <View style={[styles.orderTypePill, {
            backgroundColor: item.order_type === 'food'
              ? colors.cuisineBg : colors.farmerBg,
          }]}>
            <Text style={[styles.orderTypePillText, {
              color: item.order_type === 'food'
                ? colors.cuisineColor : colors.farmerColor,
            }]}>
              {item.order_type === 'food'
                ? '🍴 Food' : '🌾 Market'}
            </Text>
          </View>

          <Text style={styles.orderId}>
            #{String(item.id).padStart(4, '0')}
          </Text>
          <Text style={styles.orderDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View style={styles.orderCardTopRight}>
          {/* Status badge */}
          <View style={[styles.statusBadge, {
            backgroundColor: status.bg,
            borderColor:     status.border,
          }]}>
            <Text style={styles.statusIcon}>
              {status.icon}
            </Text>
            <Text style={[styles.statusText,
              { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          {/* Total + expand */}
          <View style={styles.totalExpandRow}>
            <Text style={styles.cardTotal}>
              ₱{orderTotal.toFixed(2)}
            </Text>
            <Text style={styles.expandIcon}>
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── EXPANDED SECTION ── */}
      {isExpanded && (
        <View>
          <View style={styles.cardDivider} />

          {/* Details */}
          <View style={styles.orderDetails}>

            {/* Quantity */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Text style={styles.detailIcon}>📦</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>QUANTITY</Text>
                <Text style={styles.detailValue}>
                  {item.quantity}{' '}
                  {item.quantity === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>

            {/* Product name if available */}
            {item.product_name && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Text style={styles.detailIcon}>🏷️</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>PRODUCT</Text>
                  <Text style={styles.detailValue}>
                    {item.product_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Delivery address */}
            {item.delivery_address && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Text style={styles.detailIcon}>📍</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    DELIVERY ADDRESS
                  </Text>
                  <Text style={styles.detailValue}>
                    {item.delivery_address}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment */}
            {item.payment_method && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Text style={styles.detailIcon}>💳</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>PAYMENT</Text>
                  <Text style={styles.detailValue}>
                    {item.payment_method === 'cod'
                      ? '💵 Cash on Delivery'
                      : '📱 GCash'}
                    {' · '}
                    <Text style={{
                      color: item.payment_status === 'paid'
                        ? colors.success : colors.warning,
                      fontWeight: '800',
                    }}>
                      {(item.payment_status || 'UNPAID')
                        .toUpperCase()}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Seller / Restaurant */}
            {(item.seller_name || item.restaurant_name) && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Text style={styles.detailIcon}>🏪</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>FROM</Text>
                  <Text style={styles.detailValue}>
                    {item.seller_name || item.restaurant_name}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>
              ₱{orderTotal.toFixed(2)}
            </Text>
          </View>

          {/* Tracker */}
          {!isCancelled && (
            <View style={styles.trackerWrap}>
              <Text style={styles.trackerTitle}>
                ORDER PROGRESS
              </Text>
              <View style={styles.tracker}>
                {TRACKER_STEPS.map((step, index) => {
                  const isDone   = index <= currentIndex;
                  const isActive = index === currentIndex;
                  const isLast   = index === TRACKER_STEPS.length - 1;
                  return (
                    <View key={step.key} style={styles.trackerStep}>
                      {/* Connector line */}
                      {!isLast && (
                        <View style={[
                          styles.trackerLine,
                          isDone && index < currentIndex &&
                          styles.trackerLineDone,
                        ]} />
                      )}
                      {/* Dot */}
                      <View style={[
                        styles.trackerDot,
                        isDone   && styles.trackerDotDone,
                        isActive && styles.trackerDotActive,
                      ]}>
                        <Text style={styles.trackerDotIcon}>
                          {step.icon}
                        </Text>
                      </View>
                      <Text style={[
                        styles.trackerLabel,
                        isDone && styles.trackerLabelDone,
                      ]}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledIcon}>❌</Text>
              <View>
                <Text style={styles.cancelledTitle}>
                  Order Cancelled
                </Text>
                <Text style={styles.cancelledSub}>
                  This order was cancelled
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          {(isPending || isDelivered) && (
            <View style={styles.actionBtns}>
              {isPending && (
                <TouchableOpacity
                  style={styles.cancelOrderBtn}
                  onPress={onCancel}
                  activeOpacity={0.8}>
                  <Text style={styles.cancelOrderBtnText}>
                    ❌ Cancel Order
                  </Text>
                </TouchableOpacity>
              )}
              {isDelivered && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={onReview}
                  activeOpacity={0.8}>
                  <Text style={styles.reviewBtnText}>
                    ⭐ Rate This Order
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================
export default function OrderHistoryScreen({
  userId,
  onBack,
}) {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [expandedId, setExpandedId]       = useState(null);

  // Review states
  const [showReview, setShowReview]       = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  // ── FETCH ORDERS ─────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/orders/user/${userId}`,
        { timeout: 10000 }
      );
      const sorted = (response.data || []).sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch (err) {
      console.log('Orders error:', err?.message);
      setOrders([]);
      showToast('error', 'Could not load orders',
        'Pull down to retry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  // ── CANCEL ORDER ─────────────────────────────
  const handleCancelOrder = useCallback((order) => {
    Alert.alert(
      'Cancel Order',
      `Cancel Order #${String(order.id).padStart(4, '0')}?\n\nThis cannot be undone.`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.patch(
                `${API_URL}/orders/${order.id}/status` +
                `?new_status=cancelled`
              );
              showToast('info', 'Order Cancelled',
                'Your order has been cancelled.');
              fetchOrders();
            } catch {
              showToast('error', 'Error',
                'Could not cancel. Try again.');
            }
          },
        },
      ]
    );
  }, [fetchOrders]);

  // ── SUBMIT REVIEW ────────────────────────────
  const handleSubmitReview = useCallback(async ({ rating, comment }) => {
    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        user_id:  userId,
        rating:   rating,
        order_id: selectedOrder?.id,
      });
      if (comment) params.append('comment', comment);

      await axios.post(
        `${API_URL}/reviews?${params.toString()}`
      );

      showToast('success', 'Review Submitted! ⭐',
        'Thank you for your feedback!');
      setShowReview(false);
      setSelectedOrder(null);
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('warning', 'Already Reviewed! ⚠️',
          'You already reviewed this order.');
        setShowReview(false);
      } else {
        showToast('error', 'Error',
          'Could not submit review. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [userId, selectedOrder]);

  // ── STATS (memoized) ─────────────────────────
  const stats = useMemo(() => {
    const totalOrders    = orders.length;
    const deliveredCount = orders.filter(
      o => o.status?.toLowerCase() === 'delivered'
    ).length;
    const pendingCount   = orders.filter(
      o => o.status?.toLowerCase() === 'pending'
    ).length;
    const totalSpent     = orders
      .filter(o => o.status?.toLowerCase() !== 'cancelled')
      .reduce((sum, o) =>
        sum + (o.grand_total || o.total_price || 0), 0
      );
    return { totalOrders, deliveredCount, pendingCount, totalSpent };
  }, [orders]);

  // ── FILTERED ORDERS (memoized) ───────────────
  const filteredOrders = useMemo(() =>
    selectedFilter === 'All'
      ? orders
      : orders.filter(
          o => o.status?.toLowerCase() ===
          selectedFilter.toLowerCase()
        ),
    [orders, selectedFilter]
  );

  // ── FILTER COUNTS (memoized) ─────────────────
  const filterCounts = useMemo(() => {
    const counts = { All: orders.length };
    FILTERS.slice(1).forEach(f => {
      counts[f] = orders.filter(
        o => o.status?.toLowerCase() === f.toLowerCase()
      ).length;
    });
    return counts;
  }, [orders]);

  // ── RENDER ITEM ──────────────────────────────
  const renderOrder = useCallback(({ item }) => (
    <OrderCard
      item={item}
      isExpanded={expandedId === item.id}
      onToggle={() => setExpandedId(
        expandedId === item.id ? null : item.id
      )}
      onCancel={() => handleCancelOrder(item)}
      onReview={() => {
        setSelectedOrder(item);
        setShowReview(true);
      }}
    />
  ), [expandedId, handleCancelOrder]);

  const keyExtractor = useCallback(
    (item) => item.id.toString(), []
  );

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!loading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyEmoji}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>
            Your order history will{'\n'}appear here
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={onBack}
            activeOpacity={0.85}>
            <Text style={styles.emptyBtnText}>
              Start Ordering →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* REVIEW MODAL */}
      <ReviewModal
        visible={showReview}
        order={selectedOrder}
        onClose={() => {
          setShowReview(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleSubmitReview}
        submitting={submitting}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={onBack}
          activeOpacity={0.8}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Orders</Text>
          {stats.pendingCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {stats.pendingCount} pending
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setLoading(true);
            fetchOrders();
          }}
          activeOpacity={0.8}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* STATS BANNER */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={styles.statValue}>
            {stats.totalOrders}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🎉</Text>
          <Text style={styles.statValue}>
            {stats.deliveredCount}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>
            ₱{stats.totalSpent >= 1000
              ? `${(stats.totalSpent / 1000).toFixed(1)}k`
              : stats.totalSpent.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = selectedFilter === item;
            const count    = filterCounts[item] || 0;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(item)}
                activeOpacity={0.8}>
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                  {item}
                </Text>
                {/* Count badge on each filter */}
                {count > 0 && item !== 'All' && (
                  <View style={[
                    styles.filterBadge,
                    isActive && styles.filterBadgeActive,
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      isActive && styles.filterBadgeTextActive,
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ORDER LIST */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading your orders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={keyExtractor}
          renderItem={renderOrder}
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyFilterWrap}>
              <Text style={styles.emptyFilterEmoji}>🔍</Text>
              <Text style={styles.emptyFilterTitle}>
                No {selectedFilter} Orders
              </Text>
              <Text style={styles.emptyFilterSub}>
                You have no{' '}
                {selectedFilter.toLowerCase()} orders yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBackText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  headerBadge: {
    backgroundColor: colors.warningPale,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  headerBadgeText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  refreshBtnText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },

  // ── STATS BANNER ────────────────────────────
  statsBanner: {
    backgroundColor: colors.dark,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: borderRadius.xlarge,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowMd,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // ── FILTER ──────────────────────────────────
  filterWrap: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: colors.textMedium,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },
  filterBadge: {
    backgroundColor: colors.border,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '900',
  },
  filterBadgeTextActive: {
    color: colors.textWhite,
  },

  // ── LOADING ─────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── ORDER LIST ──────────────────────────────
  orderList: {
    padding: 16,
    paddingBottom: 100,
  },

  // ── ORDER CARD ──────────────────────────────
  orderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  orderCardTopLeft: { flex: 1, gap: 4 },
  orderCardTopRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  orderTypePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderId: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  orderDate: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    gap: 4,
    borderWidth: 1,
  },
  statusIcon: { fontSize: 12 },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  totalExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTotal: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },

  // ── CARD DIVIDER ────────────────────────────
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  // ── ORDER DETAILS ───────────────────────────
  orderDetails: {
    padding: 16,
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailIcon:  { fontSize: 16 },
  detailInfo:  { flex: 1, paddingTop: 2 },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  detailValue: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ── TOTAL ROW ───────────────────────────────
  totalRow: {
    backgroundColor: colors.primaryPale,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderGold,
  },
  totalLabel: {
    color: colors.textMedium,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  totalValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },

  // ── TRACKER ─────────────────────────────────
  trackerWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackerTitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    paddingLeft: 4,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  trackerStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  trackerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 8,
    zIndex: 2,
  },
  trackerDotDone: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  trackerDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadowGold,
  },
  trackerDotIcon: { fontSize: 14 },
  trackerLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  trackerLabelDone: {
    color: colors.primary,
    fontWeight: '800',
  },
  trackerLine: {
    position: 'absolute',
    top: 18,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  trackerLineDone: {
    backgroundColor: colors.primary,
    opacity: 0.6,
  },

  // ── CANCELLED BANNER ────────────────────────
  cancelledBanner: {
    backgroundColor: colors.dangerPale,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.danger + '20',
  },
  cancelledIcon:  { fontSize: 20 },
  cancelledTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  cancelledSub: {
    color: colors.danger,
    fontSize: 11,
    opacity: 0.7,
  },

  // ── ACTION BUTTONS ──────────────────────────
  actionBtns: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelOrderBtn: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: colors.dangerPale,
  },
  cancelOrderBtnText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
  reviewBtn: {
    backgroundColor: colors.primaryPale,
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderGold,
  },
  reviewBtnText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── EMPTY STATES ────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.borderGold,
    ...shadowGold,
  },
  emptyEmoji:  { fontSize: 55 },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: borderRadius.large,
    ...shadowGold,
  },
  emptyBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 14,
  },
  emptyFilterWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyFilterEmoji: { fontSize: 48 },
  emptyFilterTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyFilterSub: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── REVIEW MODAL ────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 10,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: colors.borderGold,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  starBtn: { padding: 6 },
  starIcon: {
    fontSize: 40,
    color: colors.border,
  },
  starActive: { color: colors.primary },
  ratingLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 22,
  },
  tagsTitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.textMedium,
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  commentInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    padding: 14,
    fontSize: 13,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  skipBtn: {
    flex: 1,
    padding: 15,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipBtnText: {
    color: colors.textMedium,
    fontWeight: '700',
    fontSize: 13,
  },
  submitBtn: {
    flex: 2,
    padding: 15,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    backgroundColor: colors.primary,
    ...shadowGold,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
  },
});