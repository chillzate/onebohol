import { useEffect, useState } from 'react';
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

const API_URL = 'https://onebohol-production.up.railway.app';

export default function OrderHistoryScreen({
  userId,
  onBack,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // ── REVIEW STATES ─────────────────────────
  const [showReview, setShowReview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filters = [
    'All', 'Pending', 'Confirmed',
    'Preparing', 'Delivering',
    'Delivered', 'Cancelled',
  ];

  const statusConfig = {
    pending: {
      color: colors.warning,
      bg: colors.warningPale,
      border: colors.warning + '25',
      icon: '⏳',
      label: 'PENDING',
    },
    confirmed: {
      color: colors.riderColor,
      bg: colors.riderBg,
      border: colors.riderBorder,
      icon: '✅',
      label: 'CONFIRMED',
    },
    preparing: {
      color: colors.cuisineColor,
      bg: colors.cuisineBg,
      border: colors.cuisineBorder,
      icon: '👨‍🍳',
      label: 'PREPARING',
    },
    delivering: {
      color: colors.primary,
      bg: colors.primaryPale,
      border: colors.borderGold,
      icon: '🛵',
      label: 'ON THE WAY',
    },
    delivered: {
      color: colors.success,
      bg: colors.successPale,
      border: colors.success + '25',
      icon: '🎉',
      label: 'DELIVERED',
    },
    cancelled: {
      color: colors.danger,
      bg: colors.dangerPale,
      border: colors.danger + '25',
      icon: '❌',
      label: 'CANCELLED',
    },
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/orders/user/${userId}`
      );
      const sorted = response.data.sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // ── SUBMIT REVIEW ─────────────────────────
  const handleSubmitReview = async () => {
    if (rating === 0) {
      showToast('warning', 'Select Rating',
        'Please select a star rating!');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/reviews`,
        null,
        {
          params: {
            user_id: userId,
            rating: rating,
            comment: comment,
            order_id: selectedOrder?.id,
            restaurant_id: selectedOrder?.restaurant_id,
          }
        }
      );
      showToast('success', 'Review Submitted! ⭐',
        'Thank you for your feedback!');
      setShowReview(false);
      setRating(0);
      setComment('');
      setSelectedOrder(null);
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('warning', 'Already Reviewed!',
          'You already reviewed this order.');
      } else {
        showToast('error', 'Error',
          'Could not submit review.');
      }
    }
    setSubmitting(false);
  };

  const getRatingLabel = () => {
    const labels = {
      1: 'Poor 😞',
      2: 'Fair 😐',
      3: 'Good 🙂',
      4: 'Great 😊',
      5: 'Excellent! 🤩',
    };
    return labels[rating] || 'Tap to rate';
  };

  const filteredOrders = selectedFilter === 'All'
    ? orders
    : orders.filter(
        o => o.status?.toLowerCase() ===
        selectedFilter.toLowerCase()
      );

  const getStatus = (status) =>
    statusConfig[status?.toLowerCase()] || {
      color: colors.textLight,
      bg: colors.inputBackground,
      border: colors.border,
      icon: '❓',
      label: status?.toUpperCase() || 'UNKNOWN',
    };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalOrders = orders.length;
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);
  const deliveredCount = orders.filter(
    o => o.status === 'delivered'
  ).length;

  const TRACKER_STEPS = [
    { key: 'pending',    icon: '📝', label: 'Ordered'  },
    { key: 'confirmed',  icon: '✅', label: 'Confirmed' },
    { key: 'preparing',  icon: '👨‍🍳', label: 'Cooking'  },
    { key: 'delivering', icon: '🛵', label: 'Delivery'  },
    { key: 'delivered',  icon: '🎉', label: 'Done'      },
  ];

  const STATUS_ORDER = [
    'pending', 'confirmed',
    'preparing', 'delivering', 'delivered',
  ];

  // ============================================
  // REVIEW MODAL
  // ============================================
  const ReviewModal = () => (
    <Modal
      visible={showReview}
      transparent
      animationType="slide"
      onRequestClose={() => setShowReview(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          {/* HANDLE */}
          <View style={styles.modalHandle} />

          {/* TITLE */}
          <Text style={styles.modalTitle}>
            Rate Your Order
          </Text>
          <Text style={styles.modalSub}>
            Order #{selectedOrder?.id
              .toString().padStart(4, '0')}
          </Text>

          {/* STARS */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}>
                <Text style={[
                  styles.starIcon,
                  star <= rating && styles.starActive,
                ]}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* RATING LABEL */}
          <Text style={styles.ratingLabel}>
            {getRatingLabel()}
          </Text>

          {/* QUICK TAGS */}
          <View style={styles.tagsRow}>
            {[
              '😋 Delicious',
              '🚀 Fast',
              '📦 Good Packaging',
              '💰 Worth it',
            ].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  comment.includes(tag) &&
                  styles.tagActive,
                ]}
                onPress={() => {
                  if (comment.includes(tag)) {
                    setComment(
                      comment.replace(tag, '').trim()
                    );
                  } else {
                    setComment(
                      comment
                        ? `${comment} ${tag}`
                        : tag
                    );
                  }
                }}>
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

          {/* COMMENT */}
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          {/* BUTTONS */}
          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                setShowReview(false);
                setRating(0);
                setComment('');
              }}>
              <Text style={styles.skipBtnText}>
                Skip
              </Text>
            </TouchableOpacity>

            {submitting ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ flex: 2 }}
              />
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  rating === 0 &&
                  styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={rating === 0}>
                <Text style={styles.submitBtnText}>
                  ⭐ Submit Review
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
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
          <Text style={styles.headerTitle}>
            My Orders
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyEmoji}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>
            No Orders Yet
          </Text>
          <Text style={styles.emptySub}>
            Your order history will{'\n'}appear here
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={onBack}>
            <Text style={styles.emptyBtnText}>
              Order Now →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // MAIN SCREEN
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* REVIEW MODAL */}
      <ReviewModal />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={onBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchOrders}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* STATS BANNER */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalOrders}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {deliveredCount}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ₱{totalSpent.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item &&
                styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item)}>
              <Text style={[
                styles.filterChipText,
                selectedFilter === item &&
                styles.filterChipTextActive,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
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
          keyExtractor={(item) => item.id.toString()}
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
              <Text style={styles.emptyFilterIcon}>
                🔍
              </Text>
              <Text style={styles.emptyFilterText}>
                No {selectedFilter} orders
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = getStatus(item.status);
            const currentIndex = STATUS_ORDER.indexOf(
              item.status?.toLowerCase()
            );
            const isCancelled =
              item.status === 'cancelled';
            const isDelivered =
              item.status === 'delivered';

            return (
              <View style={styles.orderCard}>

                {/* TOP ROW */}
                <View style={styles.orderCardTop}>
                  <View>
                    <Text style={styles.orderIdLabel}>
                      ORDER
                    </Text>
                    <Text style={styles.orderId}>
                      #{item.id.toString().padStart(4,'0')}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: status.bg,
                      borderColor: status.border,
                    },
                  ]}>
                    <Text style={styles.statusIcon}>
                      {status.icon}
                    </Text>
                    <Text style={[
                      styles.statusText,
                      { color: status.color },
                    ]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* DIVIDER */}
                <View style={styles.cardDivider} />

                {/* ORDER DETAILS */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Text style={styles.detailIcon}>
                        🍽️
                      </Text>
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>
                        ORDER TYPE
                      </Text>
                      <Text style={styles.detailValue}>
                        {item.order_type === 'food'
                          ? '🍴 Food Delivery'
                          : '🌾 Market Order'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Text style={styles.detailIcon}>
                        📦
                      </Text>
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>
                        QUANTITY
                      </Text>
                      <Text style={styles.detailValue}>
                        {item.quantity}{' '}
                        {item.quantity === 1
                          ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>

                  {item.delivery_address && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconWrap}>
                        <Text style={styles.detailIcon}>
                          📍
                        </Text>
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

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Text style={styles.detailIcon}>
                        🕐
                      </Text>
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>
                        ORDER DATE
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* TOTAL ROW */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    TOTAL AMOUNT
                  </Text>
                  <Text style={styles.totalValue}>
                    ₱{(item.total_price || 0).toFixed(2)}
                  </Text>
                </View>

                {/* STATUS TRACKER */}
                {!isCancelled && (
                  <View style={styles.tracker}>
                    {TRACKER_STEPS.map((step, index) => {
                      const isDone = index <= currentIndex;
                      const isActive =
                        index === currentIndex;
                      return (
                        <View
                          key={step.key}
                          style={styles.trackerStep}>
                          <View style={[
                            styles.trackerDot,
                            isDone && styles.trackerDotDone,
                            isActive &&
                            styles.trackerDotActive,
                          ]}>
                            <Text style={
                              styles.trackerDotIcon
                            }>
                              {step.icon}
                            </Text>
                          </View>
                          <Text style={[
                            styles.trackerLabel,
                            isDone &&
                            styles.trackerLabelDone,
                          ]}>
                            {step.label}
                          </Text>
                          {index < 4 && (
                            <View style={[
                              styles.trackerLine,
                              isDone &&
                              index < currentIndex &&
                              styles.trackerLineDone,
                            ]} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* CANCELLED BANNER */}
                {isCancelled && (
                  <View style={styles.cancelledBanner}>
                    <Text style={styles.cancelledIcon}>
                      ❌
                    </Text>
                    <Text style={styles.cancelledText}>
                      This order was cancelled
                    </Text>
                  </View>
                )}

                {/* ⭐ RATE THIS ORDER BUTTON */}
                {isDelivered && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => {
                      setSelectedOrder(item);
                      setRating(0);
                      setComment('');
                      setShowReview(true);
                    }}>
                    <Text style={styles.reviewBtnText}>
                      ⭐ Rate This Order
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          }}
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

  // ── HEADER ────────────────────────────────
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
  headerTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
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

  // ── STATS ─────────────────────────────────
  statsBanner: {
    backgroundColor: colors.cardBackground,
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
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: colors.border,
  },

  // ── FILTER ────────────────────────────────
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
    paddingHorizontal: 16,
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

  // ── LOADING ───────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── ORDER LIST ────────────────────────────
  orderList: {
    padding: 16,
    paddingBottom: 100,
  },

  // ── ORDER CARD ────────────────────────────
  orderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderIdLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  orderId: {
    color: colors.textDark,
    fontSize: 22,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    gap: 5,
    borderWidth: 1,
  },
  statusIcon: { fontSize: 13 },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
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
  detailIcon: { fontSize: 18 },
  detailInfo: { flex: 1, paddingTop: 2 },
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

  // ── TOTAL ROW ─────────────────────────────
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
    fontSize: 24,
    fontWeight: '900',
  },

  // ── TRACKER ───────────────────────────────
  tracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  trackerStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  trackerDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    zIndex: 1,
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
  },
  trackerLabelDone: {
    color: colors.primary,
    fontWeight: '800',
  },
  trackerLine: {
    position: 'absolute',
    top: 17,
    left: '55%',
    right: '-55%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  trackerLineDone: {
    backgroundColor: colors.primary,
  },

  // ── CANCELLED ─────────────────────────────
  cancelledBanner: {
    backgroundColor: colors.dangerPale,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.danger + '20',
  },
  cancelledIcon: { fontSize: 18 },
  cancelledText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── REVIEW BUTTON ─────────────────────────
  reviewBtn: {
    backgroundColor: colors.primaryPale,
    padding: 14,
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

  // ── EMPTY ─────────────────────────────────
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
  emptyEmoji: { fontSize: 55 },
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
    paddingVertical: 50,
    gap: 12,
  },
  emptyFilterIcon: { fontSize: 40 },
  emptyFilterText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── REVIEW MODAL ──────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.borderGold,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
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
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starBtn: { padding: 4 },
  starIcon: {
    fontSize: 38,
    color: colors.border,
  },
  starActive: {
    color: colors.primary,
  },
  ratingLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
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
    paddingVertical: 7,
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
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
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
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
  },
});