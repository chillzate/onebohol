// ============================================
// ZAVARA PRODUCER DASHBOARD - COMPLETE v3.0
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
  RefreshControl,
  Dimensions,
  Image,
  Modal,
  TextInput,
  FlatList,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  shadowDark,
  borderRadius,
} from '../theme';
import { API_URL } from '../config';
import { showToast } from './ToastManager';

const { width } = Dimensions.get('window');

// ============================================
// ADD PRODUCT MODAL - OUTSIDE MAIN COMPONENT
// ← THIS IS THE KEY FIX FOR THE KEYBOARD BUG
// ============================================
function AddProductModal({
  visible,
  onClose,
  onSubmit,
  adding,
}) {
  // ── Local state lives HERE, not in parent ──
  const [productName, setProductName]         = useState('');
  const [productDesc, setProductDesc]         = useState('');
  const [productPrice, setProductPrice]       = useState('');
  const [productQty, setProductQty]           = useState('');
  const [productUnit, setProductUnit]         = useState('kg');
  const [productCategory, setProductCategory] = useState('vegetables');

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setProductName('');
      setProductDesc('');
      setProductPrice('');
      setProductQty('');
      setProductUnit('kg');
      setProductCategory('vegetables');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!productName.trim() || !productPrice || !productQty) {
      showToast('warning', 'Missing Fields',
        'Please fill in name, price, and quantity');
      return;
    }
    if (isNaN(parseFloat(productPrice)) ||
      parseFloat(productPrice) <= 0) {
      showToast('warning', 'Invalid Price',
        'Please enter a valid price');
      return;
    }
    onSubmit({
      name:        productName.trim(),
      description: productDesc.trim(),
      price:       parseFloat(productPrice),
      quantity:    parseInt(productQty),
      unit:        productUnit,
      category:    productCategory,
    });
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modalStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={modalStyles.content}>
                <View style={modalStyles.handle} />

                {/* TITLE ROW */}
                <View style={modalStyles.titleRow}>
                  <Text style={modalStyles.title}>
                    🌾 Add Product
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={modalStyles.close}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">

                  {/* PRODUCT NAME */}
                  <Text style={modalStyles.label}>
                    PRODUCT NAME *
                  </Text>
                  <View style={modalStyles.inputWrap}>
                    <TextInput
                      style={modalStyles.input}
                      placeholder="e.g. Fresh Tomatoes"
                      placeholderTextColor={colors.textMuted}
                      value={productName}
                      onChangeText={setProductName}
                      returnKeyType="next"
                      autoCorrect={false}
                    />
                  </View>

                  {/* DESCRIPTION */}
                  <Text style={modalStyles.label}>
                    DESCRIPTION
                  </Text>
                  <View style={[modalStyles.inputWrap,
                    { height: 90, paddingVertical: 10 }]}>
                    <TextInput
                      style={[modalStyles.input,
                        { textAlignVertical: 'top', height: 70 }]}
                      placeholder="Describe your product..."
                      placeholderTextColor={colors.textMuted}
                      value={productDesc}
                      onChangeText={setProductDesc}
                      multiline
                      autoCorrect={false}
                    />
                  </View>

                  {/* PRICE & QUANTITY */}
                  <View style={modalStyles.twoCol}>
                    <View style={modalStyles.twoColItem}>
                      <Text style={modalStyles.label}>
                        PRICE (₱) *
                      </Text>
                      <View style={modalStyles.inputWrap}>
                        <TextInput
                          style={modalStyles.input}
                          placeholder="0.00"
                          placeholderTextColor={colors.textMuted}
                          value={productPrice}
                          onChangeText={setProductPrice}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <View style={modalStyles.twoColItem}>
                      <Text style={modalStyles.label}>
                        QUANTITY *
                      </Text>
                      <View style={modalStyles.inputWrap}>
                        <TextInput
                          style={modalStyles.input}
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          value={productQty}
                          onChangeText={setProductQty}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* UNIT */}
                  <Text style={modalStyles.label}>UNIT</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={modalStyles.chipRow}>
                    {['kg', 'g', 'piece', 'bundle',
                      'box', 'liter', 'pack', 'dozen'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[modalStyles.chip,
                          productUnit === u && modalStyles.chipActive]}
                        onPress={() => setProductUnit(u)}>
                        <Text style={[modalStyles.chipText,
                          productUnit === u &&
                          modalStyles.chipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* CATEGORY */}
                  <Text style={modalStyles.label}>CATEGORY</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={modalStyles.chipRow}>
                    {[
                      { id: 'vegetables', label: '🥦 Veggies'  },
                      { id: 'seafood',    label: '🐟 Seafood'   },
                      { id: 'rice',       label: '🌾 Rice'      },
                      { id: 'fruits',     label: '🍌 Fruits'    },
                      { id: 'livestock',  label: '🐄 Livestock' },
                      { id: 'other',      label: '🌿 Other'     },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[modalStyles.chip,
                          productCategory === cat.id &&
                          modalStyles.chipActive]}
                        onPress={() => setProductCategory(cat.id)}>
                        <Text style={[modalStyles.chipText,
                          productCategory === cat.id &&
                          modalStyles.chipTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* SUBMIT */}
                  {adding ? (
                    <ActivityIndicator
                      size="large"
                      color={colors.farmerColor}
                      style={{ marginVertical: 20 }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={modalStyles.submitBtn}
                      onPress={handleSubmit}>
                      <Text style={modalStyles.submitBtnText}>
                        🌾 ADD PRODUCT
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ height: 20 }} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Modal styles - separate from main styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 10,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: colors.farmerBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
  },
  close: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
    padding: 4,
  },
  label: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrap: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
    margin: 0,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColItem: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.farmerColor,
    borderColor: colors.farmerColor,
  },
  chipText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },
  submitBtn: {
    backgroundColor: colors.farmerColor,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: 8,
    ...shadowGold,
  },
  submitBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProducerDashboardScreen({
  userId,
  onBack,
}) {
  // ── STATES ──────────────────────────────────
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [data, setData]               = useState(null);
  const [error, setError]             = useState(false);
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addingProduct, setAddingProduct]   = useState(false);

  // Order management
  const [products, setProducts]               = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders]     = useState(false);
  const [updatingOrder, setUpdatingOrder]     = useState(null);

  // ── FETCH DASHBOARD ─────────────────────────
  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const res = await axios.get(
        `${API_URL}/producer/dashboard/${userId}`,
        { timeout: 10000 }
      );
      setData(res.data);
    } catch (err) {
      console.error('Dashboard Error:', err?.message);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(
        `${API_URL}/producer/products/${userId}`,
        { timeout: 10000 }
      );
      setProducts(res.data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [userId]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(
        `${API_URL}/producer/orders/${userId}`,
        { timeout: 10000 }
      );
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders')   fetchOrders();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders')   fetchOrders();
  }, [activeTab]);

  // ── SUBMIT PRODUCT ──────────────────────────
  const handleAddProduct = async (productData) => {
    setAddingProduct(true);
    try {
      await axios.post(
        `${API_URL}/producer/products/${userId}`,
        productData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      showToast('success', 'Product Added! ✅',
        `${productData.name} has been listed!`);
      setShowAddProduct(false);
      fetchData();
      fetchProducts();
    } catch {
      showToast('error', 'Failed',
        'Could not add product. Try again.');
    }
    setAddingProduct(false);
  };

  // ── UPDATE ORDER STATUS ──────────────────────
  const handleUpdateOrder = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await axios.patch(
        `${API_URL}/producer/orders/${orderId}/status` +
        `?user_id=${userId}&new_status=${newStatus}`
      );
      showToast('success', 'Order Updated! ✅',
        `Order is now ${newStatus}`);
      fetchOrders();
      fetchData();
    } catch {
      showToast('error', 'Error',
        'Could not update order status');
    }
    setUpdatingOrder(null);
  };

  // ── DELETE PRODUCT ──────────────────────────
  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Delete Product',
      `Delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/producer/products` +
                `/${product.id}?user_id=${userId}`
              );
              showToast('success', 'Deleted!',
                `${product.name} removed.`);
              fetchProducts();
              fetchData();
            } catch {
              showToast('error', 'Error',
                'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  // ── STATUS HELPERS ──────────────────────────
  const getStatusColor = (status) => {
    const map = {
      pending:    colors.warning,
      confirmed:  colors.riderColor,
      preparing:  colors.cuisineColor,
      ready:      colors.farmerColor,
      delivering: colors.primary,
      delivered:  colors.success,
      cancelled:  colors.danger,
    };
    return map[status?.toLowerCase()] || colors.textLight;
  };

  const getStatusBg = (status) => {
    const map = {
      pending:    colors.warningPale,
      confirmed:  colors.riderBg,
      preparing:  colors.cuisineBg,
      ready:      colors.farmerBg,
      delivering: colors.primaryPale,
      delivered:  colors.successPale,
      cancelled:  colors.dangerPale,
    };
    return map[status?.toLowerCase()] || colors.inputBackground;
  };

  const getStatusIcon = (status) => {
    const map = {
      pending:    '⏳',
      confirmed:  '✅',
      preparing:  '📦',
      ready:      '🌾',
      delivering: '🛵',
      delivered:  '🎉',
      cancelled:  '❌',
    };
    return map[status?.toLowerCase()] || '❓';
  };

  const getNextStatuses = (current) => {
    const flow = {
      pending:    ['confirmed', 'cancelled'],
      confirmed:  ['preparing', 'cancelled'],
      preparing:  ['ready', 'cancelled'],
      ready:      ['delivering'],
      delivering: ['delivered'],
    };
    return flow[current?.toLowerCase()] || [];
  };

  const getCategoryEmoji = (cat) => {
    const map = {
      vegetables: '🥦',
      seafood:    '🐟',
      rice:       '🌾',
      fruits:     '🍌',
      livestock:  '🐄',
      other:      '🌿',
    };
    return map[cat?.toLowerCase()] || '🌴';
  };

  // ── LOADING ─────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <ActivityIndicator
          size="large"
          color={colors.farmerColor}
        />
        <Text style={styles.loadingText}>
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  // ── ERROR STATE ─────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>
          Could not load dashboard
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={fetchData}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={onBack}>
          <Text style={styles.backLinkText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats        = data?.stats        || {};
  const producer     = data?.producer     || {};
  const recentOrders = data?.recent_orders || [];
  const topProducts  = data?.top_products  || [];

  // ============================================
  // DASHBOARD TAB
  // ============================================
  const DashboardTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.farmerColor]}
          tintColor={colors.farmerColor}
        />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* PRODUCER INFO */}
      <View style={styles.producerCard}>
        <View style={styles.producerCardLeft}>
          <View style={styles.producerAvatar}>
            {producer.profile_image ? (
              <Image
                source={{ uri: producer.profile_image }}
                style={styles.producerAvatarImg}
              />
            ) : (
              <Text style={styles.producerAvatarText}>
                {producer.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.producerName}>
              {producer.name || 'Producer'}
            </Text>
            <Text style={styles.producerFarm}>
              🌾 {producer.farm_name || 'My Farm'}
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                {producer.is_verified
                  ? '✅ Verified Partner'
                  : '⏳ Pending Verification'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* REVENUE CARD */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueTop}>
          <Text style={styles.revLabel}>Total Revenue</Text>
          <View style={styles.revGrowthBadge}>
            <Text style={styles.revGrowthText}>🌾 Live</Text>
          </View>
        </View>
        <Text style={styles.revAmount}>
          ₱{(stats.total_revenue || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <View style={styles.revSubRow}>
          <Text style={styles.revSub}>
            From {stats.total_orders || 0} total orders
          </Text>
        </View>
      </View>

      {/* STATS GRID */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox,
          { borderTopColor: colors.farmerColor }]}>
          <Text style={styles.statBoxEmoji}>🌾</Text>
          <Text style={styles.statVal}>
            {stats.total_products || 0}
          </Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={[styles.statBox,
          { borderTopColor: colors.warning }]}>
          <Text style={styles.statBoxEmoji}>⏳</Text>
          <Text style={[styles.statVal,
            { color: colors.warning }]}>
            {stats.pending_orders || 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox,
          { borderTopColor: colors.success }]}>
          <Text style={styles.statBoxEmoji}>📦</Text>
          <Text style={[styles.statVal,
            { color: colors.success }]}>
            {stats.total_orders || 0}
          </Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn,
            { borderTopColor: colors.farmerColor }]}
          onPress={() => setShowAddProduct(true)}>
          <Text style={styles.actionEmoji}>➕</Text>
          <Text style={styles.actionText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn,
            { borderTopColor: colors.warning }]}
          onPress={() => setActiveTab('orders')}>
          <Text style={styles.actionEmoji}>📋</Text>
          <Text style={styles.actionText}>Orders</Text>
          {stats.pending_orders > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>
                {stats.pending_orders}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn,
            { borderTopColor: colors.primary }]}
          onPress={() => setActiveTab('products')}>
          <Text style={styles.actionEmoji}>🌾</Text>
          <Text style={styles.actionText}>Products</Text>
        </TouchableOpacity>
      </View>

      {/* PENDING ALERT */}
      {stats.pending_orders > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => setActiveTab('orders')}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {stats.pending_orders} order
              {stats.pending_orders > 1 ? 's' : ''} waiting!
            </Text>
            <Text style={styles.alertSub}>
              Tap to review and confirm
            </Text>
          </View>
          <Text style={styles.alertArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* TOP PRODUCTS */}
      {topProducts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Products</Text>
          {topProducts.map((product, idx) => (
            <View key={idx} style={styles.topProductCard}>
              <View style={styles.topProductLeft}>
                <Text style={styles.topProductRank}>
                  #{idx + 1}
                </Text>
                <Text style={styles.topProductEmoji}>
                  {getCategoryEmoji(product.category)}
                </Text>
                <View>
                  <Text style={styles.topProductName}>
                    {product.name}
                  </Text>
                  <Text style={styles.topProductStat}>
                    {product.total_sold} sold ·{' '}
                    ₱{product.price}/{product.unit}
                  </Text>
                </View>
              </View>
              <Text style={styles.topProductRevenue}>
                ₱{(product.total_sold * product.price).toFixed(0)}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* RECENT ORDERS */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {recentOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        recentOrders.map((order, idx) => (
          <View key={idx} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>
                Order #{String(order.order_id).padStart(4, '0')}
              </Text>
              <View style={[styles.statusPill, {
                backgroundColor: getStatusBg(order.status),
              }]}>
                <Text style={styles.statusPillIcon}>
                  {getStatusIcon(order.status)}
                </Text>
                <Text style={[styles.statusPillText, {
                  color: getStatusColor(order.status),
                }]}>
                  {order.status?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.orderBuyer}>
              👤 {order.buyer_name}
            </Text>
            {order.delivery_address && (
              <Text style={styles.orderAddress} numberOfLines={1}>
                📍 {order.delivery_address}
              </Text>
            )}
            <View style={styles.orderBottom}>
              <Text style={styles.orderTotal}>
                ₱{(order.grand_total ||
                  order.total_price || 0).toFixed(2)}
              </Text>
              <Text style={styles.orderPayment}>
                {order.payment_method === 'gcash'
                  ? '📱 GCash' : '💵 COD'}
              </Text>
            </View>
          </View>
        ))
      )}

      {recentOrders.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => setActiveTab('orders')}>
          <Text style={styles.viewAllBtnText}>
            View All Orders →
          </Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );

  // ============================================
  // PRODUCTS TAB
  // ============================================
  const ProductsTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.addProductTopBtn}
        onPress={() => setShowAddProduct(true)}>
        <Text style={styles.addProductTopBtnText}>
          ➕ Add New Product
        </Text>
      </TouchableOpacity>

      {loadingProducts ? (
        <View style={styles.center}>
          <ActivityIndicator
            color={colors.farmerColor}
            size="large"
          />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigIcon}>🌾</Text>
          <Text style={styles.emptyBigTitle}>No Products Yet</Text>
          <Text style={styles.emptyBigSub}>
            Add your first product to start selling!
          </Text>
          <TouchableOpacity
            style={styles.emptyBigBtn}
            onPress={() => setShowAddProduct(true)}>
            <Text style={styles.emptyBigBtnText}>
              ➕ Add Product
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productCardTop}>
                <View style={styles.productCardLeft}>
                  <Text style={styles.productCardEmoji}>
                    {getCategoryEmoji(item.category)}
                  </Text>
                  <View style={styles.productCardInfo}>
                    <Text style={styles.productCardName}>
                      {item.name}
                    </Text>
                    <Text style={styles.productCardCat}>
                      {item.category}
                    </Text>
                  </View>
                </View>
                <View style={[styles.productStatusBadge, {
                  backgroundColor: item.is_available
                    ? colors.successPale : colors.dangerPale,
                }]}>
                  <Text style={[styles.productStatusText, {
                    color: item.is_available
                      ? colors.success : colors.danger,
                  }]}>
                    {item.is_available ? '● Active' : '○ Hidden'}
                  </Text>
                </View>
              </View>

              <View style={styles.productCardStats}>
                <View style={styles.productStatItem}>
                  <Text style={styles.productStatValue}>
                    ₱{item.price}
                  </Text>
                  <Text style={styles.productStatLabel}>
                    per {item.unit}
                  </Text>
                </View>
                <View style={styles.productStatDivider} />
                <View style={styles.productStatItem}>
                  <Text style={[styles.productStatValue, {
                    color: item.quantity < 10
                      ? colors.danger : colors.textDark,
                  }]}>
                    {item.quantity}
                  </Text>
                  <Text style={styles.productStatLabel}>
                    in stock{item.quantity < 10 ? ' ⚠️' : ''}
                  </Text>
                </View>
                <View style={styles.productStatDivider} />
                <View style={styles.productStatItem}>
                  <Text style={styles.productStatValue}>
                    {item.total_sold || 0}
                  </Text>
                  <Text style={styles.productStatLabel}>sold</Text>
                </View>
                {item.rating > 0 && (
                  <>
                    <View style={styles.productStatDivider} />
                    <View style={styles.productStatItem}>
                      <Text style={styles.productStatValue}>
                        ⭐{item.rating}
                      </Text>
                      <Text style={styles.productStatLabel}>
                        rating
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {item.description ? (
                <Text
                  style={styles.productCardDesc}
                  numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {!item.is_approved && (
                <View style={styles.approvalBanner}>
                  <Text style={styles.approvalText}>
                    ⏳ Pending admin approval
                  </Text>
                </View>
              )}

              <View style={styles.productCardActions}>
                <TouchableOpacity
                  style={styles.productDeleteBtn}
                  onPress={() => handleDeleteProduct(item)}>
                  <Text style={styles.productDeleteText}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  // ============================================
  // ORDERS TAB
  // ============================================
  const OrdersTab = () => (
    <View style={styles.tabContent}>
      {loadingOrders ? (
        <View style={styles.center}>
          <ActivityIndicator
            color={colors.farmerColor}
            size="large"
          />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigIcon}>📦</Text>
          <Text style={styles.emptyBigTitle}>No Orders Yet</Text>
          <Text style={styles.emptyBigSub}>
            Orders from buyers will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id.toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const nextStatuses = getNextStatuses(item.status);
            const isUpdating   = updatingOrder === item.order_id;

            return (
              <View style={styles.fullOrderCard}>
                <View style={styles.fullOrderHeader}>
                  <View>
                    <Text style={styles.fullOrderId}>
                      Order #{String(item.order_id).padStart(4, '0')}
                    </Text>
                    <Text style={styles.fullOrderDate}>
                      {new Date(item.created_at).toLocaleDateString(
                        'en-PH',
                        {
                          month:  'short',
                          day:    'numeric',
                          hour:   '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, {
                    backgroundColor: getStatusBg(item.status),
                  }]}>
                    <Text style={styles.statusPillIcon}>
                      {getStatusIcon(item.status)}
                    </Text>
                    <Text style={[styles.statusPillText, {
                      color: getStatusColor(item.status),
                    }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.fullOrderDetails}>
                  <View style={styles.fullOrderRow}>
                    <Text style={styles.fullOrderLabel}>Customer</Text>
                    <Text style={styles.fullOrderValue}>
                      👤 {item.buyer_name}
                    </Text>
                  </View>
                  {item.buyer_phone ? (
                    <View style={styles.fullOrderRow}>
                      <Text style={styles.fullOrderLabel}>Phone</Text>
                      <Text style={styles.fullOrderValue}>
                        📱 {item.buyer_phone}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.fullOrderRow}>
                    <Text style={styles.fullOrderLabel}>Product</Text>
                    <Text style={styles.fullOrderValue}>
                      {getCategoryEmoji(item.product_category)}{' '}
                      {item.product_name}
                    </Text>
                  </View>
                  <View style={styles.fullOrderRow}>
                    <Text style={styles.fullOrderLabel}>Qty</Text>
                    <Text style={styles.fullOrderValue}>
                      {item.quantity} units
                    </Text>
                  </View>
                  {item.delivery_address && (
                    <View style={styles.fullOrderRow}>
                      <Text style={styles.fullOrderLabel}>
                        Address
                      </Text>
                      <Text style={[styles.fullOrderValue,
                        { flex: 1 }]}>
                        📍 {item.delivery_address}
                      </Text>
                    </View>
                  )}
                  <View style={styles.fullOrderRow}>
                    <Text style={styles.fullOrderLabel}>
                      Payment
                    </Text>
                    <Text style={styles.fullOrderValue}>
                      {item.payment_method === 'gcash'
                        ? '📱 GCash' : '💵 COD'}
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

                <View style={styles.fullOrderTotal}>
                  <Text style={styles.fullOrderTotalLabel}>
                    TOTAL
                  </Text>
                  <Text style={styles.fullOrderTotalValue}>
                    ₱{(item.grand_total ||
                      item.total_price || 0).toFixed(2)}
                  </Text>
                </View>

                {nextStatuses.length > 0 && (
                  <View style={styles.orderActions}>
                    <Text style={styles.orderActionsLabel}>
                      UPDATE STATUS:
                    </Text>
                    <View style={styles.orderActionBtns}>
                      {isUpdating ? (
                        <ActivityIndicator
                          color={colors.farmerColor}
                          size="small"
                        />
                      ) : (
                        nextStatuses.map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.orderActionBtn,
                              status === 'cancelled' &&
                              styles.orderActionBtnDanger,
                            ]}
                            onPress={() =>
                              handleUpdateOrder(
                                item.order_id, status
                              )
                            }>
                            <Text style={[
                              styles.orderActionBtnText,
                              status === 'cancelled' &&
                              { color: colors.danger },
                            ]}>
                              {getStatusIcon(status)}{' '}
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* ADD PRODUCT MODAL - now a proper component */}
      <AddProductModal
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSubmit={handleAddProduct}
        adding={addingProduct}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            🌾 Harvest Dashboard
          </Text>
          <Text style={styles.headerSub}>
            {producer.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddProduct(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {[
          { id: 'dashboard', label: '📊 Overview' },
          { id: 'products',  label: '🌾 Products' },
          { id: 'orders',    label: '📦 Orders'   },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem,
              activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.id === 'orders' &&
              stats.pending_orders > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {stats.pending_orders}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB CONTENT */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'products'  && <ProductsTab />}
      {activeTab === 'orders'    && <OrdersTab />}

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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  errorEmoji:  { fontSize: 50, marginBottom: 16 },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: colors.farmerColor,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: borderRadius.large,
    marginBottom: 12,
    ...shadowGold,
  },
  retryBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 14,
  },
  backLink:     { paddingVertical: 8 },
  backLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerCenter:  { flex: 1, paddingHorizontal: 12 },
  headerTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.farmerColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  addBtnText: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },

  // ── TAB BAR ─────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.farmerColor,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.farmerColor,
    fontWeight: '900',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '15%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },
  tabContent: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── PRODUCER CARD ───────────────────────────
  producerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.farmerBorder,
    ...shadow,
  },
  producerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  producerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.farmerColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  producerAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  producerAvatarText: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '900',
  },
  producerName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  producerFarm: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 6,
  },
  verifiedBadge: {
    backgroundColor: colors.farmerBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.farmerBorder,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    color: colors.farmerColor,
    fontSize: 10,
    fontWeight: '800',
  },

  // ── REVENUE CARD ────────────────────────────
  revenueCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xxlarge,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowDark,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  revGrowthBadge: {
    backgroundColor: colors.farmerColor + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.farmerColor + '50',
  },
  revGrowthText: {
    color: colors.farmerColor,
    fontSize: 11,
    fontWeight: '800',
  },
  revAmount: {
    color: colors.textWhite,
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  revSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },

  // ── STATS ───────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: 14,
    borderRadius: borderRadius.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    alignItems: 'center',
    ...shadow,
  },
  statBoxEmoji: { fontSize: 22, marginBottom: 6 },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── QUICK ACTIONS ───────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: borderRadius.xlarge,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    position: 'relative',
    ...shadow,
  },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionText: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.textMedium,
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  actionBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },

  // ── ALERT CARD ──────────────────────────────
  alertCard: {
    backgroundColor: colors.warningPale,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  alertIcon:    { fontSize: 24 },
  alertContent: { flex: 1 },
  alertTitle: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  alertSub: {
    color: colors.textLight,
    fontSize: 11,
  },
  alertArrow: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: '900',
  },

  // ── TOP PRODUCTS ────────────────────────────
  topProductCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  topProductLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topProductRank: {
    width: 24,
    fontSize: 12,
    fontWeight: '900',
    color: colors.textMuted,
  },
  topProductEmoji:   { fontSize: 28 },
  topProductName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  topProductStat: {
    fontSize: 11,
    color: colors.textLight,
  },
  topProductRevenue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.farmerColor,
  },

  // ── ORDER CARD (Dashboard) ───────────────────
  orderCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: borderRadius.xlarge,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: '900',
    color: colors.textDark,
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    gap: 4,
  },
  statusPillIcon: { fontSize: 11 },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderBuyer: {
    color: colors.textMedium,
    fontSize: 13,
    marginBottom: 4,
  },
  orderAddress: {
    color: colors.textLight,
    fontSize: 11,
    marginBottom: 8,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.farmerColor,
  },
  orderPayment: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── VIEW ALL ────────────────────────────────
  viewAllBtn: {
    backgroundColor: colors.farmerBg,
    padding: 14,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.farmerBorder,
    marginTop: 4,
    marginBottom: 10,
  },
  viewAllBtnText: {
    color: colors.farmerColor,
    fontWeight: '900',
    fontSize: 13,
  },

  // ── EMPTY ───────────────────────────────────
  emptyCard: {
    backgroundColor: colors.cardBackground,
    padding: 40,
    borderRadius: borderRadius.xlarge,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBig: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyBigIcon:  { fontSize: 60 },
  emptyBigTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  emptyBigSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBigBtn: {
    backgroundColor: colors.farmerColor,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.large,
    marginTop: 8,
  },
  emptyBigBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
  },

  // ── ADD PRODUCT BTN ─────────────────────────
  addProductTopBtn: {
    backgroundColor: colors.farmerColor,
    margin: 16,
    padding: 14,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    ...shadowGold,
  },
  addProductTopBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── PRODUCT CARD ────────────────────────────
  productCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  productCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  productCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  productCardEmoji: { fontSize: 32 },
  productCardInfo:  { flex: 1 },
  productCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  productCardCat: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  productStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  productCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  productStatItem:  { flex: 1, alignItems: 'center' },
  productStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  productStatLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  productStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  productCardDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
    padding: 14,
    paddingTop: 12,
  },
  approvalBanner: {
    backgroundColor: colors.warningPale,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.warning + '20',
  },
  approvalText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  productCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  productDeleteBtn: {
    backgroundColor: colors.dangerPale,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  productDeleteText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── FULL ORDER CARD ─────────────────────────
  fullOrderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  fullOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  fullOrderId: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  fullOrderDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  fullOrderDetails: {
    backgroundColor: colors.inputBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  fullOrderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  fullOrderLabel: {
    width: 70,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    paddingTop: 1,
  },
  fullOrderValue: {
    flex: 1,
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  fullOrderTotal: {
    backgroundColor: colors.farmerBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.farmerBorder,
  },
  fullOrderTotalLabel: {
    color: colors.textMedium,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  fullOrderTotalValue: {
    color: colors.farmerColor,
    fontSize: 22,
    fontWeight: '900',
  },
  orderActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderActionsLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  orderActionBtns: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  orderActionBtn: {
    backgroundColor: colors.farmerBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.farmerBorder,
  },
  orderActionBtnDanger: {
    backgroundColor: colors.dangerPale,
    borderColor: colors.danger + '25',
  },
  orderActionBtnText: {
    color: colors.farmerColor,
    fontSize: 12,
    fontWeight: '800',
  },
});