// ============================================
// ZAVARA ORDER HISTORY SCREEN - v5.0
// ✅ Feature E connected (smart polling)
// ✅ Uses new /orders/user/{id}/history
// ✅ OrderTrackingScreen connected
// ✅ Cancel uses correct endpoint
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
  Alert,
} from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { showToast }          from './ToastManager';
import { API_URL }            from '../config';
import ReviewScreen           from './ReviewScreen';
import OrderTrackingScreen    from './OrderTrackingScreen';

// ============================================
// CONSTANTS (same as before)
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

// ============================================
// ORDER CARD
// ============================================
function OrderCard({
  item,
  isExpanded,
  onToggle,
  onCancel,
  onReview,
  onTrack,
}) {
  const status = STATUS_CONFIG[
    item.status?.toLowerCase()
  ] || {
    color:  colors.textLight,
    bg:     colors.inputBackground,
    border: colors.border,
    icon:   '❓',
    label:  (item.status || 'UNKNOWN').toUpperCase(),
  };

  const currentIndex = STATUS_ORDER.indexOf(
    item.status?.toLowerCase()
  );
  const isCancelled = item.status?.toLowerCase() === 'cancelled';
  const isDelivered = item.status?.toLowerCase() === 'delivered';
  const isPending   = item.status?.toLowerCase() === 'pending';
  const isActive    = [
    'confirmed', 'preparing',
    'ready', 'delivering',
  ].includes(item.status?.toLowerCase());
  const orderTotal  = item.grand_total || item.total_price || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(
        'en-PH',
        {
          month:  'short',
          day:    'numeric',
          year:   'numeric',
          hour:   '2-digit',
          minute: '2-digit',
        }
      );
    } catch { return 'N/A'; }
  };

  return (
    <View style={styles.orderCard}>

      {/* ACTIVE INDICATOR */}
      {isActive && (
        <View style={styles.activeBar}>
          <Text style={styles.activeBarText}>
            ● LIVE TRACKING AVAILABLE
          </Text>
        </View>
      )}

      {/* CARD TOP */}
      <TouchableOpacity
        style={styles.orderCardTop}
        onPress={onToggle}
        activeOpacity={0.85}>

        <View style={styles.orderCardTopLeft}>
          <View style={[styles.orderTypePill, {
            backgroundColor: item.order_type === 'food'
              ? colors.cuisineBg : colors.farmerBg,
          }]}>
            <Text style={[styles.orderTypePillText, {
              color: item.order_type === 'food'
                ? colors.cuisineColor
                : colors.farmerColor,
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

      {/* EXPANDED */}
      {isExpanded && (
        <View>
          <View style={styles.cardDivider} />

          <View style={styles.orderDetails}>
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
          </View>

          {/* TOTAL */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              TOTAL AMOUNT
            </Text>
            <Text style={styles.totalValue}>
              ₱{orderTotal.toFixed(2)}
            </Text>
          </View>

          {/* MINI TRACKER */}
          {!isCancelled && (
            <View style={styles.trackerWrap}>
              <Text style={styles.trackerTitle}>
                ORDER PROGRESS
              </Text>
              <View style={styles.tracker}>
                {TRACKER_STEPS.map((step, index) => {
                  const isDone   = index <= currentIndex;
                  const isActive = index === currentIndex;
                  const isLast   =
                    index === TRACKER_STEPS.length - 1;
                  return (
                    <View
                      key={step.key}
                      style={styles.trackerStep}>
                      {!isLast && (
                        <View style={[
                          styles.trackerLine,
                          isDone && index < currentIndex &&
                          styles.trackerLineDone,
                        ]} />
                      )}
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

          {/* CANCELLED BANNER */}
          {isCancelled && (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledIcon}>❌</Text>
              <View>
                <Text style={styles.cancelledTitle}>
                  Order Cancelled
                </Text>
                <Text style={styles.cancelledSub}>
                  {item.cancel_reason || 'This order was cancelled'}
                </Text>
              </View>
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.actionBtns}>
            {/* ✅ NEW - Track button for active orders */}
            {(isActive || isPending) && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  ).catch(() => {});
                  onTrack();
                }}
                activeOpacity={0.8}>
                <Text style={styles.trackBtnText}>
                  🗺️ Track Order
                </Text>
              </TouchableOpacity>
            )}

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

            {isDelivered && !item.is_reviewed && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium
                  ).catch(() => {});
                  onReview();
                }}
                activeOpacity={0.8}>
                <Text style={styles.reviewBtnText}>
                  ⭐ Rate This Order
                </Text>
              </TouchableOpacity>
            )}

            {isDelivered && item.is_reviewed && (
              <View style={styles.reviewedBadge}>
                <Text style={styles.reviewedText}>
                  ✅ Already Reviewed
                </Text>
              </View>
            )}
          </View>
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
  onOpenTracking,   // ✅ ADD THIS LINE
}) {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Screen states
  const [showReviewScreen, setShowReviewScreen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState(null);

  // ✅ NEW - Order Tracking Screen
  const [showTracking, setShowTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] =
    useState(null);

  // ── FETCH ORDERS (paginated) ──────────────
  const fetchOrders = useCallback(async (
    pageNum = 1,
    append = false
  ) => {
    try {
      const res = await axios.get(
        // ✅ Using new paginated endpoint
        `${API_URL}/orders/user/${userId}/history`,
        {
          params: {
            page:          pageNum,
            limit:         10,
            status_filter: selectedFilter === 'All'
              ? undefined
              : selectedFilter.toLowerCase(),
          },
          timeout: 10000,
        }
      );

      const data = res.data;
      const newOrders = data.orders || [];

      if (append) {
        setOrders(prev => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }

      setHasMore(data.has_next || false);
      setPage(pageNum);

    } catch (err) {
      console.log('Orders error:', err?.message);
      if (!append) setOrders([]);
      showToast(
        'error',
        'Could not load orders',
        'Pull down to retry'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId, selectedFilter]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchOrders(1, false);
  }, [selectedFilter]);

  useEffect(() => {
    fetchOrders(1, false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(1, false);
  }, [fetchOrders]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchOrders(page + 1, true);
  }, [loadingMore, hasMore, page, fetchOrders]);

  // ── CANCEL ORDER ──────────────────────────
  const handleCancelOrder = useCallback((order) => {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});

    Alert.alert(
      'Cancel Order',
      `Cancel Order #${String(order.id).padStart(4, '0')}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text:  'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ Using correct cancel endpoint
              await axios.patch(
                `${API_URL}/orders/${order.id}/cancel`,
                null,
                {
                  params: {
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
                'Your order has been cancelled.'
              );
              fetchOrders(1, false);
            } catch {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
              ).catch(() => {});
              showToast(
                'error',
                'Error',
                'Could not cancel. Try again.'
              );
            }
          },
        },
      ]
    );
  }, [userId, fetchOrders]);

  // ── REVIEW ────────────────────────────────
  const handleOpenReview = useCallback((order) => {
    setSelectedOrder(order);
    setShowReviewScreen(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setShowReviewScreen(false);
    setSelectedOrder(null);
  }, []);

  const handleReviewSuccess = useCallback(() => {
    setShowReviewScreen(false);
    setSelectedOrder(null);
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    showToast(
      'success',
      'Review Saved! ⭐',
      'Thank you for your feedback!'
    );
    fetchOrders(1, false);
  }, [fetchOrders]);

  // ── TRACKING ──────────────────────────────
  const handleOpenTracking = useCallback((order) => {
    setTrackingOrderId(order.id);
    setShowTracking(true);
  }, []);

  const handleCloseTracking = useCallback(() => {
    setShowTracking(false);
    setTrackingOrderId(null);
    // Refresh list when coming back
    fetchOrders(1, false);
  }, [fetchOrders]);

  // ── STATS ─────────────────────────────────
  const stats = useMemo(() => {
    const totalOrders    = orders.length;
    const deliveredCount = orders.filter(
      o => o.status?.toLowerCase() === 'delivered'
    ).length;
    const pendingCount   = orders.filter(
      o => ['pending', 'confirmed', 'preparing',
            'ready', 'delivering'].includes(
        o.status?.toLowerCase()
      )
    ).length;
    const totalSpent = orders
      .filter(o => o.status?.toLowerCase() !== 'cancelled')
      .reduce(
        (sum, o) => sum + (o.grand_total || o.total_price || 0),
        0
      );
    return {
      totalOrders,
      deliveredCount,
      pendingCount,
      totalSpent,
    };
  }, [orders]);

  const filterCounts = useMemo(() => {
    const counts = { All: orders.length };
    FILTERS.slice(1).forEach(f => {
      counts[f] = orders.filter(
        o => o.status?.toLowerCase() === f.toLowerCase()
      ).length;
    });
    return counts;
  }, [orders]);

  // ── RENDER ITEM ───────────────────────────
  const renderOrder = useCallback(({ item }) => (
    <OrderCard
      item={item}
      isExpanded={expandedId === item.id}
      onToggle={() => {
        Haptics.impactAsync(
          Haptics.ImpactFeedbackStyle.Light
        ).catch(() => {});
        setExpandedId(
          expandedId === item.id ? null : item.id
        );
      }}
      onCancel={() => handleCancelOrder(item)}
      onReview={() => handleOpenReview(item)}
      onTrack={() => onOpenTracking?.(item.id)}
    />
  ), [
    expandedId,
    handleCancelOrder,
    handleOpenReview,
    handleOpenTracking,
  ]);

  const keyExtractor = useCallback(
    (item) => item.id.toString(), []
  );

  // ── SCREEN ROUTING ────────────────────────

  // ✅ Order Tracking Screen
  if (showTracking && trackingOrderId) {
    return (
      <OrderTrackingScreen
        orderId={trackingOrderId}
        userId={userId}
        onBack={handleCloseTracking}
        onReview={(orderData) => {
          setShowTracking(false);
          setTrackingOrderId(null);
          setSelectedOrder(orderData);
          setShowReviewScreen(true);
        }}
      />
    );
  }

  // Review Screen
  if (showReviewScreen && selectedOrder) {
    return (
      <ReviewScreen
        userId={userId}
        orderId={selectedOrder.id}
        orderType={selectedOrder.order_type || 'food'}
        restaurantId={selectedOrder.restaurant_id}
        productId={selectedOrder.product_id}
        restaurantName={
          selectedOrder.restaurant_name ||
          selectedOrder.seller_name
        }
        productName={selectedOrder.product_name}
        onBack={handleCloseReview}
        onSuccess={handleReviewSuccess}
      />
    );
  }

  // Empty State
  if (!loading && orders.length === 0 &&
      selectedFilter === 'All') {
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
          <Text style={styles.emptyTitle}>
            No Orders Yet
          </Text>
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

  // ── MAIN RENDER ───────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
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
          <Text style={styles.headerTitle}>
            My Orders
          </Text>
          {stats.pendingCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {stats.pendingCount} active
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setLoading(true);
            fetchOrders(1, false);
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
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  ).catch(() => {});
                  setSelectedFilter(item);
                }}
                activeOpacity={0.8}>
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                  {item}
                </Text>
                {count > 0 && item !== 'All' && (
                  <View style={[
                    styles.filterBadge,
                    isActive && styles.filterBadgeActive,
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      isActive &&
                      styles.filterBadgeTextActive,
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
          data={orders}
          keyExtractor={keyExtractor}
          renderItem={renderOrder}
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreWrap}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyFilterWrap}>
              <Text style={styles.emptyFilterEmoji}>
                🔍
              </Text>
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
    flex:            1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor:   colors.headerBg,
    paddingTop:        52,
    paddingBottom:     16,
    paddingHorizontal: 20,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  headerBackBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: colors.inputBackground,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  headerBackText: {
    color:      colors.primary,
    fontSize:   18,
    fontWeight: '700',
  },
  headerCenter: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  headerTitle: {
    color:      colors.textDark,
    fontSize:   18,
    fontWeight: '900',
  },
  headerBadge: {
    backgroundColor:   colors.successPale,
    paddingHorizontal: 10,
    paddingVertical:   2,
    borderRadius:      borderRadius.round,
    borderWidth:       1,
    borderColor:       colors.success + '30',
  },
  headerBadgeText: {
    color:         colors.success,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: colors.primaryPale,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.borderGold,
  },
  refreshBtnText: {
    color:      colors.primary,
    fontSize:   20,
    fontWeight: '700',
  },
  statsBanner: {
    backgroundColor: colors.dark,
    marginHorizontal: 20,
    marginTop:        16,
    marginBottom:     8,
    borderRadius:     borderRadius.xlarge,
    padding:          18,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      colors.borderGold,
    ...shadowMd,
  },
  statItem: {
    alignItems: 'center',
    flex:       1,
    gap:        2,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: {
    color:      colors.primary,
    fontSize:   20,
    fontWeight: '900',
  },
  statLabel: {
    color:         'rgba(255,255,255,0.45)',
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width:           1,
    height:          40,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  filterWrap: {
    backgroundColor:   colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               8,
  },
  filterChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius:    borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  filterChipText: {
    fontSize:   11,
    color:      colors.textMedium,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color:      colors.textWhite,
    fontWeight: '900',
  },
  filterBadge: {
    backgroundColor: colors.border,
    borderRadius:    8,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    color:      colors.textMuted,
    fontSize:   8,
    fontWeight: '900',
  },
  filterBadgeTextActive: {
    color: colors.textWhite,
  },
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
  loadMoreWrap: {
    paddingVertical: 20,
    alignItems:      'center',
  },
  orderList: {
    padding:       16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xxlarge,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
    ...shadowMd,
  },
  activeBar: {
    backgroundColor: colors.successPale,
    paddingHorizontal: 16,
    paddingVertical:   6,
    borderBottomWidth: 1,
    borderBottomColor: colors.success + '20',
  },
  activeBarText: {
    color:         colors.success,
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 1,
  },
  orderCardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    padding:        16,
    gap:            12,
  },
  orderCardTopLeft:  { flex: 1, gap: 4 },
  orderCardTopRight: {
    alignItems: 'flex-end',
    gap:        8,
  },
  orderTypePill: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
    alignSelf:         'flex-start',
  },
  orderTypePillText: {
    fontSize:   10,
    fontWeight: '800',
  },
  orderId: {
    color:         colors.textDark,
    fontSize:      20,
    fontWeight:    '900',
    letterSpacing: -0.5,
  },
  orderDate: {
    color:      colors.textMuted,
    fontSize:   10,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:  borderRadius.round,
    gap:           4,
    borderWidth:   1,
  },
  statusIcon: { fontSize: 12 },
  statusText: {
    fontSize:      10,
    fontWeight:    '900',
    letterSpacing: 0.5,
  },
  totalExpandRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  cardTotal: {
    color:      colors.primary,
    fontSize:   18,
    fontWeight: '900',
  },
  expandIcon: {
    color:      colors.textMuted,
    fontSize:   10,
    fontWeight: '700',
  },
  cardDivider: {
    height:          1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  orderDetails: {
    padding: 16,
    gap:     14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
  },
  detailIconWrap: {
    width:           36,
    height:          36,
    borderRadius:    12,
    backgroundColor: colors.inputBackground,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  detailIcon:  { fontSize: 16 },
  detailInfo:  { flex: 1, paddingTop: 2 },
  detailLabel: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.5,
    marginBottom:  3,
  },
  detailValue: {
    color:      colors.textDark,
    fontSize:   13,
    fontWeight: '600',
    lineHeight: 18,
  },
  totalRow: {
    backgroundColor: colors.primaryPale,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth:  1,
    borderTopColor:  colors.borderGold,
  },
  totalLabel: {
    color:         colors.textMedium,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1.5,
  },
  totalValue: {
    color:      colors.primary,
    fontSize:   22,
    fontWeight: '900',
  },
  trackerWrap: {
    backgroundColor:  colors.background,
    paddingHorizontal: 12,
    paddingTop:       16,
    paddingBottom:    8,
    borderTopWidth:   1,
    borderTopColor:   colors.border,
  },
  trackerTitle: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 2,
    marginBottom:  16,
    paddingLeft:   4,
  },
  tracker: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    paddingBottom:  8,
  },
  trackerStep: {
    flex:       1,
    alignItems: 'center',
    position:   'relative',
  },
  trackerDot: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: colors.inputBackground,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.border,
    marginBottom:    8,
    zIndex:          2,
  },
  trackerDotDone: {
    backgroundColor: colors.primaryPale,
    borderColor:     colors.primary,
  },
  trackerDotActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
    ...shadowGold,
  },
  trackerDotIcon: { fontSize: 14 },
  trackerLabel: {
    fontSize:   8,
    color:      colors.textMuted,
    fontWeight: '600',
    textAlign:  'center',
    lineHeight: 12,
  },
  trackerLabelDone: {
    color:      colors.primary,
    fontWeight: '800',
  },
  trackerLine: {
    position:        'absolute',
    top:             18,
    left:            '50%',
    width:           '100%',
    height:          2,
    backgroundColor: colors.border,
    zIndex:          1,
  },
  trackerLineDone: {
    backgroundColor: colors.primary,
    opacity:         0.6,
  },
  cancelledBanner: {
    backgroundColor: colors.dangerPale,
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    gap:             12,
    borderTopWidth:  1,
    borderTopColor:  colors.danger + '20',
  },
  cancelledIcon:  { fontSize: 20 },
  cancelledTitle: {
    color:        colors.danger,
    fontSize:     13,
    fontWeight:   '800',
    marginBottom: 2,
  },
  cancelledSub: {
    color:    colors.danger,
    fontSize: 11,
    opacity:  0.7,
  },
  actionBtns: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackBtn: {
    padding:         15,
    alignItems:      'center',
    backgroundColor: colors.riderBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.riderBorder,
  },
  trackBtnText: {
    color:      colors.riderColor,
    fontWeight: '900',
    fontSize:   13,
  },
  cancelOrderBtn: {
    padding:         15,
    alignItems:      'center',
    backgroundColor: colors.dangerPale,
  },
  cancelOrderBtnText: {
    color:      colors.danger,
    fontWeight: '800',
    fontSize:   13,
  },
  reviewBtn: {
    backgroundColor: colors.primaryPale,
    padding:         15,
    alignItems:      'center',
    borderTopWidth:  1,
    borderTopColor:  colors.borderGold,
  },
  reviewBtnText: {
    color:         colors.primary,
    fontWeight:    '900',
    fontSize:      13,
    letterSpacing: 0.5,
  },
  reviewedBadge: {
    padding:         12,
    alignItems:      'center',
    backgroundColor: colors.successPale,
  },
  reviewedText: {
    color:      colors.success,
    fontWeight: '700',
    fontSize:   12,
  },
  emptyWrap: {
    flex:       1,
    alignItems: 'center',
    justifyContent: 'center',
    padding:    40,
  },
  emptyCircle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: colors.primaryPale,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    24,
    borderWidth:     2,
    borderColor:     colors.borderGold,
    ...shadowGold,
  },
  emptyEmoji:  { fontSize: 55 },
  emptyTitle: {
    fontSize:     24,
    fontWeight:   '900',
    color:        colors.textDark,
    marginBottom: 10,
  },
  emptySub: {
    fontSize:     14,
    color:        colors.textLight,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: 32,
  },
  emptyBtn: {
    backgroundColor:   colors.primary,
    paddingHorizontal: 28,
    paddingVertical:   15,
    borderRadius:      borderRadius.large,
    ...shadowGold,
  },
  emptyBtnText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   14,
  },
  emptyFilterWrap: {
    alignItems:     'center',
    paddingVertical: 60,
    gap:            10,
  },
  emptyFilterEmoji: { fontSize: 48 },
  emptyFilterTitle: {
    color:      colors.textDark,
    fontSize:   18,
    fontWeight: '900',
  },
  emptyFilterSub: {
    color:      colors.textLight,
    fontSize:   12,
    fontWeight: '500',
  },
});