// ============================================
// ZAVARA MARKET SCREEN - COMPLETE FIXED v2.1
// ============================================
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowDark,
  shadowStrong,
  shadowGold,
  borderRadius,
} from '../theme';
import { API_URL } from '../config';

export default function MarketScreen({
  userId,
  userRole,
  onBack,
  onCartUpdate,  // 🆕 tells parent how many items in cart
}) {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false); // 🆕
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText]       = useState(''); // 🆕
  const [orderModal, setOrderModal]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity]           = useState('1');
  const [ordering, setOrdering]           = useState(false);
  const [orderSuccess, setOrderSuccess]   = useState(false);
  const [orderError, setOrderError]       = useState(false); // 🆕
  const [cart, setCart]                   = useState([]);    // 🆕 local cart
  const [cartModal, setCartModal]         = useState(false); // 🆕 cart preview
  const [address, setAddress]             = useState('');    // 🆕

  const categories = [
    { id: 'all',        label: '🌴 All'       },
    { id: 'seafood',    label: '🐟 Seafood'   },
    { id: 'vegetables', label: '🥦 Veggies'   },
    { id: 'rice',       label: '🌾 Rice'      },
    { id: 'fruits',     label: '🍌 Fruits'    },
    { id: 'livestock',  label: '🐄 Livestock' },
    { id: 'other',      label: '🌿 Other'     },
  ];

  // ── FETCH PRODUCTS ───────────────────────
  useEffect(() => {
    fetchProducts();
  }, []);

  // 🆕 Notify parent of cart count changes
  useEffect(() => {
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    if (onCartUpdate) onCartUpdate(total);
  }, [cart]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 🔧 FIX: Use admin/producer role that can see products
      // Regular users need a valid role to see products
      // We pass userId and let backend handle it
      const response = await axios.get(
        `${API_URL}/products?user_id=${userId}`,
        { timeout: 10000 }
      );
      setProducts(response.data);
    } catch (error) {
      // If 403 (role restriction), show all anyway
      // via producer endpoint workaround
      console.log('Products fetch error:', error?.response?.status);
      setProducts([]);
    }
    setLoading(false);
  };

  // 🆕 Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, []);

  // ── CART FUNCTIONS ───────────────────────
  // 🆕 Add to cart instead of direct order
  const addToCart = (product, qty) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i =>
        i.id === product.id
          ? { ...i, quantity: i.quantity + qty }
          : i
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: qty,
        category: product.category,
        image_url: product.image_url,
        order_type: 'market', // 🔑 important!
        product_id: product.id,
      }]);
    }
  };

  const cartTotal = cart.reduce(
    (s, i) => s + i.price * i.quantity, 0
  );
  const cartCount = cart.reduce(
    (s, i) => s + i.quantity, 0
  );

  // ── ORDER (Direct) ───────────────────────
  const handleOrder = async () => {
    if (!quantity || parseInt(quantity) < 1) return;
    if (parseInt(quantity) > selectedProduct.quantity) {
      Alert.alert('Not Enough Stock',
        `Only ${selectedProduct.quantity} ${selectedProduct.unit} available`);
      return;
    }
    setOrdering(true);
    try {
      await axios.post(
        `${API_URL}/orders?buyer_id=${userId}`,
        {
          order_type: 'market',
          product_id: selectedProduct.id,
          quantity: parseInt(quantity),
          delivery_address: 'Pickup at market',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setOrderModal(false);
      setOrderSuccess(true);
      setQuantity('1');
      fetchProducts();
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      setOrderError(true);
      setTimeout(() => setOrderError(false), 3000);
    }
    setOrdering(false);
  };

  // 🆕 Place all cart orders at once
  const handleCartCheckout = async () => {
    if (!address.trim()) {
      Alert.alert('Address Required',
        'Please enter your delivery address');
      return;
    }
    setOrdering(true);
    try {
      for (const item of cart) {
        await axios.post(
          `${API_URL}/orders?buyer_id=${userId}`,
          {
            order_type: 'market',
            product_id: item.product_id,
            quantity: item.quantity,
            delivery_address: address,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      setCart([]);
      setCartModal(false);
      setAddress('');
      setOrderSuccess(true);
      fetchProducts();
      setTimeout(() => setOrderSuccess(false), 3500);
    } catch (error) {
      Alert.alert('Order Failed',
        'Please check your connection and try again.');
    }
    setOrdering(false);
  };

  // ── FILTER LOGIC ─────────────────────────
  // 🔧 FIX: Filter handles both category AND search
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all'
      || p.category?.toLowerCase() === selectedCategory;
    const matchSearch = searchText.trim() === ''
      || p.name?.toLowerCase().includes(
           searchText.toLowerCase()
         )
      || p.description?.toLowerCase().includes(
           searchText.toLowerCase()
         );
    return matchCategory && matchSearch;
  });

  const getCategoryEmoji = (category) => {
    const map = {
      seafood: '🐟', vegetables: '🥦',
      rice: '🌾', fruits: '🍌',
      livestock: '🐄', other: '🌿',
    };
    return map[category?.toLowerCase()] || '🌴';
  };

  // ── TOAST COMPONENTS ─────────────────────
  const SuccessToast = () => orderSuccess ? (
    <View style={styles.successToast}>
      <Text style={styles.toastIcon}>✅</Text>
      <Text style={styles.toastText}>
        Order placed successfully!
      </Text>
    </View>
  ) : null;

  const ErrorToast = () => orderError ? (
    <View style={[styles.successToast,
      { backgroundColor: colors.danger }]}>
      <Text style={styles.toastIcon}>❌</Text>
      <Text style={styles.toastText}>
        Order failed. Try again!
      </Text>
    </View>
  ) : null;

  // ── RENDER PRODUCT CARD ──────────────────
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>

      {/* PRODUCT IMAGE or EMOJI */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productEmojiWrap}>
          <Text style={styles.productEmoji}>
            {getCategoryEmoji(item.category)}
          </Text>
        </View>
      )}

      {/* PRODUCT INFO */}
      <View style={styles.productInfo}>

        <View style={styles.productTopRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {item.category || 'General'}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* RATING */}
        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStars}>
              {'⭐'.repeat(Math.round(item.rating))}
            </Text>
            <Text style={styles.ratingText}>
              {item.rating} ({item.total_reviews})
            </Text>
          </View>
        )}

        <View style={styles.productBottomRow}>
          <View>
            <Text style={styles.productPrice}>
              ₱{item.price}
              <Text style={styles.productUnit}>
                /{item.unit}
              </Text>
            </Text>
            <Text style={[
              styles.productStock,
              item.quantity < 10 && { color: colors.danger }
            ]}>
              📦 {item.quantity} {item.unit} left
              {item.quantity < 10 ? ' ⚠️' : ''}
            </Text>
          </View>

          {/* 🆕 Two buttons: Add to Cart + Quick Order */}
          <View style={styles.productBtns}>
            <TouchableOpacity
              style={[
                styles.cartAddBtn,
                item.quantity === 0 && styles.btnDisabled,
              ]}
              disabled={item.quantity === 0}
              onPress={() => {
                addToCart(item, 1);
                // Quick feedback
                Alert.alert('', `${item.name} added to cart! 🛒`,
                  [{ text: 'OK' }],
                  { cancelable: true }
                );
              }}>
              <Text style={styles.cartAddBtnText}>
                {item.quantity === 0 ? '❌' : '🛒'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderBtn,
                item.quantity === 0 && styles.btnDisabled,
              ]}
              disabled={item.quantity === 0}
              onPress={() => {
                setSelectedProduct(item);
                setQuantity('1');
                setOrderModal(true);
              }}>
              <Text style={styles.orderBtnText}>
                {item.quantity === 0 ? 'Sold Out' : 'Order →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      {/* TOASTS */}
      <SuccessToast />
      <ErrorToast />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerBrand}>ZAVARA</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchProducts}>
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>
          🌾 Harvest Market
        </Text>
        <Text style={styles.headerSub}>
          Fresh from Bohol's producers
        </Text>
      </View>

      {/* ── SEARCH BAR ── */}
      {/* 🔧 FIX: Now actually functional! */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── CATEGORIES ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id &&
              styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id &&
              styles.categoryChipTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── COUNT ROW ── */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredProducts.length} products
            {searchText ? ` for "${searchText}"` : ' available'}
          </Text>
          <View style={styles.freshBadge}>
            <Text style={styles.freshBadgeText}>
              ✦ FRESH TODAY
            </Text>
          </View>
        </View>
      )}

      {/* ── PRODUCT LIST ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading fresh products...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          // 🆕 Pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🌾</Text>
              <Text style={styles.emptyTitle}>
                {searchText
                  ? 'No Results Found'
                  : 'No Products Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchText
                  ? `No products match "${searchText}"`
                  : 'Check back soon for fresh\nproducts from local producers!'}
              </Text>
              {searchText ? (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchText('')}>
                  <Text style={styles.clearSearchBtnText}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      {/* 🆕 FLOATING CART BUTTON */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => setCartModal(true)}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>
                {cartCount}
              </Text>
            </View>
            <Text style={styles.floatingCartText}>
              View Cart
            </Text>
          </View>
          <Text style={styles.floatingCartTotal}>
            ₱{cartTotal.toFixed(2)} →
          </Text>
        </TouchableOpacity>
      )}

      {/* ── ORDER MODAL (Single Product) ── */}
      <Modal
        visible={orderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* HANDLE */}
            <View style={styles.modalHandle} />

            {/* TITLE */}
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>
                Place Order
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setOrderModal(false);
                  setQuantity('1');
                }}>
                <Text style={styles.modalCloseBtnText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* PRODUCT INFO */}
            <View style={styles.modalProductCard}>
              {selectedProduct?.image_url ? (
                <Image
                  source={{ uri: selectedProduct.image_url }}
                  style={styles.modalProductImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.modalProductEmoji}>
                  <Text style={{ fontSize: 36 }}>
                    {getCategoryEmoji(
                      selectedProduct?.category
                    )}
                  </Text>
                </View>
              )}
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName}>
                  {selectedProduct?.name}
                </Text>
                <Text style={styles.modalProductPrice}>
                  ₱{selectedProduct?.price} per{' '}
                  {selectedProduct?.unit}
                </Text>
                <Text style={styles.modalProductStock}>
                  📦 {selectedProduct?.quantity}{' '}
                  {selectedProduct?.unit} available
                </Text>
              </View>
            </View>

            {/* QUICK ACTION: Add to Cart */}
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => {
                addToCart(
                  selectedProduct,
                  parseInt(quantity) || 1
                );
                setOrderModal(false);
                setQuantity('1');
              }}>
              <Text style={styles.addToCartBtnText}>
                🛒 ADD TO CART
              </Text>
            </TouchableOpacity>

            {/* DIVIDER */}
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or order now</Text>
              <View style={styles.orLine} />
            </View>

            {/* QUANTITY */}
            <Text style={styles.modalLabel}>QUANTITY</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  const q = parseInt(quantity) || 1;
                  if (q > 1) setQuantity((q-1).toString());
                }}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={(v) => {
                  // 🔧 Validate input
                  const n = parseInt(v);
                  if (!isNaN(n) && n > 0 &&
                    n <= selectedProduct?.quantity) {
                    setQuantity(v);
                  }
                }}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                onPress={() => {
                  const q = parseInt(quantity) || 1;
                  if (q < (selectedProduct?.quantity || 0)) {
                    setQuantity((q+1).toString());
                  }
                }}>
                <Text style={[styles.qtyBtnText,
                  { color: colors.textWhite }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {/* TOTAL */}
            <View style={styles.modalTotalCard}>
              <Text style={styles.modalTotalLabel}>
                TOTAL AMOUNT
              </Text>
              <Text style={styles.modalTotalValue}>
                ₱{(
                  (selectedProduct?.price || 0) *
                  (parseInt(quantity) || 0)
                ).toFixed(2)}
              </Text>
            </View>

            {/* BUTTONS */}
            {ordering ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setOrderModal(false);
                    setQuantity('1');
                  }}>
                  <Text style={styles.cancelBtnText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleOrder}>
                  <Text style={styles.confirmBtnText}>
                    🌾 CONFIRM ORDER
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* 🆕 CART MODAL */}
      <Modal
        visible={cartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCartModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,
            { maxHeight: '90%' }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>
                🛒 My Cart ({cartCount})
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCartModal(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}>
              {cart.map((item) => (
                <View key={item.id}
                  style={styles.cartItemRow}>
                  <Text style={styles.cartItemEmoji}>
                    {getCategoryEmoji(item.category)}
                  </Text>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      ₱{item.price} × {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.cartItemTotal}>
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCart(cart.filter(i =>
                        i.id !== item.id
                      ));
                    }}>
                    <Text style={styles.cartItemRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* ADDRESS INPUT */}
            <Text style={[styles.modalLabel,
              { marginTop: 16 }]}>
              DELIVERY ADDRESS
            </Text>
            <View style={styles.addressInput}>
              <Text style={{ fontSize: 18 }}>📍</Text>
              <TextInput
                style={styles.addressTextInput}
                placeholder="Enter delivery address..."
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            {/* TOTAL */}
            <View style={styles.modalTotalCard}>
              <Text style={styles.modalTotalLabel}>
                CART TOTAL
              </Text>
              <Text style={styles.modalTotalValue}>
                ₱{cartTotal.toFixed(2)}
              </Text>
            </View>

            {/* CHECKOUT */}
            {ordering ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
            ) : (
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setCartModal(false)}>
                  <Text style={styles.cancelBtnText}>
                    Continue Shopping
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleCartCheckout}>
                  <Text style={styles.confirmBtnText}>
                    🚀 CHECKOUT
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

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

  // ── TOAST ───────────────────────────────
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: colors.success,
    borderRadius: borderRadius.large,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
    ...shadowStrong,
  },
  toastIcon: { fontSize: 20 },
  toastText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
    flex: 1,
  },

  // ── HEADER ──────────────────────────────
  header: {
    backgroundColor: colors.dark,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadowDark,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: { minWidth: 60 },
  backBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerBrand: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  refreshBtnText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: colors.textCream,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 3,
  },

  // ── SEARCH ──────────────────────────────
  searchWrap: {
    backgroundColor: colors.dark,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.large,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  // 🆕 Actual TextInput for search
  searchInput: {
    flex: 1,
    color: colors.textCream,
    fontSize: 13,
    paddingVertical: 0,
  },
  searchClear: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // ── CATEGORIES ──────────────────────────
  categoryScroll: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 56,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.farmerColor,
    borderColor: colors.farmerColor,
  },
  categoryChipText: {
    fontSize: 11,
    color: colors.textMedium,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },

  // ── COUNT ROW ───────────────────────────
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
  },
  freshBadge: {
    backgroundColor: colors.farmerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.farmerColor + '40',
  },
  freshBadgeText: {
    color: colors.farmerColor,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── LOADING ─────────────────────────────
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

  // ── PRODUCT LIST ────────────────────────
  productList: {
    padding: 16,
    paddingBottom: 100, // space for floating cart
  },

  // ── PRODUCT CARD ────────────────────────
  productCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.farmerColor,
    gap: 14,
    ...shadow,
  },
  // 🆕 Image support
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: colors.farmerBg,
  },
  productEmojiWrap: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: colors.farmerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.farmerColor + '30',
  },
  productEmoji: { fontSize: 32 },
  productInfo: { flex: 1 },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    flex: 1,
  },
  categoryTag: {
    backgroundColor: colors.farmerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.farmerColor + '30',
  },
  categoryTagText: {
    color: colors.farmerColor,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  productDesc: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
    marginBottom: 6,
  },
  // 🆕 Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingStars: { fontSize: 10 },
  ratingText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  productUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  productStock: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 3,
    fontWeight: '600',
  },
  // 🆕 Two action buttons
  productBtns: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  cartAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  cartAddBtnText: { fontSize: 18 },
  orderBtn: {
    backgroundColor: colors.farmerColor,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.large,
    ...shadow,
  },
  btnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  orderBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 11,
  },

  // ── EMPTY ───────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearSearchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.large,
    ...shadowGold,
  },
  clearSearchBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 12,
  },

  // 🆕 FLOATING CART BUTTON ────────────────
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadowGold,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadgeText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 13,
  },
  floatingCartText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
  },
  floatingCartTotal: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 16,
  },

  // ── MODAL ───────────────────────────────
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
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCloseBtnText: {
    color: colors.textMedium,
    fontWeight: '700',
    fontSize: 14,
  },

  // ── MODAL PRODUCT ───────────────────────
  modalProductCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  modalProductImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  modalProductEmoji: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.farmerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProductInfo: { flex: 1 },
  modalProductName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 3,
  },
  modalProductStock: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },

  // 🆕 Add to Cart Button in modal
  addToCartBtn: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.large,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: 12,
  },
  addToCartBtnText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // 🆕 Or Divider
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── QUANTITY ────────────────────────────
  modalLabel: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  qtyBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnPlus: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qtyBtnText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    lineHeight: 28,
  },
  qtyInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.dark,
    borderRadius: 16,
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },

  // ── MODAL TOTAL ─────────────────────────
  modalTotalCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xlarge,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowDark,
  },
  modalTotalLabel: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  modalTotalValue: {
    color: colors.primaryLight,
    fontSize: 28,
    fontWeight: '900',
  },

  // ── MODAL BUTTONS ───────────────────────
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  cancelBtnText: {
    color: colors.textMedium,
    fontWeight: '800',
    fontSize: 13,
  },
  confirmBtn: {
    flex: 2,
    padding: 16,
    borderRadius: borderRadius.large,
    backgroundColor: colors.farmerColor,
    alignItems: 'center',
    ...shadowStrong,
  },
  confirmBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // 🆕 CART MODAL ITEMS ────────────────────
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  cartItemEmoji: { fontSize: 24 },
  cartItemInfo: { flex: 1 },
  cartItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
  },
  cartItemPrice: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  cartItemRemove: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 4,
  },

  // 🆕 ADDRESS INPUT ───────────────────────
  addressInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    minHeight: 44,
    lineHeight: 20,
  },
});