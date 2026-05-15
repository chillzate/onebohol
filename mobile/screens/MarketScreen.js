import { useState, useEffect } from 'react';
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
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowDark,
  shadowStrong,
  borderRadius,
} from '../theme';

// ✅ FIXED: Using Railway URL instead of local IP
const API_URL = 'https://onebohol-production.up.railway.app';

export default function MarketScreen({ userId, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderModal, setOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const categories = [
    { id: 'all',        label: '🌴 All'      },
    { id: 'seafood',    label: '🐟 Seafood'  },
    { id: 'vegetables', label: '🥦 Veggies'  },
    { id: 'rice',       label: '🌾 Rice'     },
    { id: 'fruits',     label: '🍌 Fruits'   },
    { id: 'livestock',  label: '🐄 Livestock'},
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/products?user_id=${userId}`
      );
      setProducts(response.data);
    } catch (error) {
      setProducts([]);
    }
    setLoading(false);
  };

  const handleOrder = async () => {
    if (!quantity || parseInt(quantity) < 1) return;
    if (parseInt(quantity) > selectedProduct.quantity) return;

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
      // handle error
    }
    setOrdering(false);
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(
        p => p.category?.toLowerCase() === selectedCategory
      );

  const getCategoryEmoji = (category) => {
    const map = {
      seafood: '🐟', vegetables: '🥦',
      rice: '🌾', fruits: '🍌',
      livestock: '🐄', other: '🌿',
    };
    return map[category?.toLowerCase()] || '🌴';
  };

  // ============================================
  // SUCCESS TOAST
  // ============================================
  const SuccessToast = () => orderSuccess ? (
    <View style={styles.successToast}>
      <Text style={styles.successToastIcon}>✅</Text>
      <Text style={styles.successToastText}>
        Order placed successfully!
      </Text>
    </View>
  ) : null;

  // ============================================
  // RENDER PRODUCT CARD
  // ============================================
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>

      {/* CATEGORY EMOJI */}
      <View style={styles.productEmojiWrap}>
        <Text style={styles.productEmoji}>
          {getCategoryEmoji(item.category)}
        </Text>
      </View>

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

        <View style={styles.productBottomRow}>
          <View>
            <Text style={styles.productPrice}>
              ₱{item.price}
              <Text style={styles.productUnit}>/{item.unit}</Text>
            </Text>
            <Text style={styles.productStock}>
              📦 {item.quantity} {item.unit} available
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.orderBtn,
              item.quantity === 0 && styles.orderBtnDisabled,
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

      {/* SUCCESS TOAST */}
      <SuccessToast />

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
        <Text style={styles.headerTitle}>🌾 Harvest Market</Text>
        <Text style={styles.headerSub}>
          Fresh from Bohol's producers
        </Text>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search products...
          </Text>
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

      {/* ── PRODUCT COUNT ── */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredProducts.length} products available
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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🌾</Text>
              <Text style={styles.emptyTitle}>
                No Products Yet
              </Text>
              <Text style={styles.emptySub}>
                Check back soon for fresh{'\n'}
                products from local producers!
              </Text>
            </View>
          }
        />
      )}

      {/* ── ORDER MODAL ── */}
      <Modal
        visible={orderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                Place Order
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setOrderModal(false);
                  setQuantity('1');
                }}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* PRODUCT INFO */}
            <View style={styles.modalProductCard}>
              <View style={styles.modalProductEmoji}>
                <Text style={{ fontSize: 36 }}>
                  {getCategoryEmoji(selectedProduct?.category)}
                </Text>
              </View>
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

            {/* QUANTITY */}
            <Text style={styles.modalLabel}>QUANTITY</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  const q = parseInt(quantity) || 1;
                  if (q > 1) setQuantity((q - 1).toString());
                }}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                onPress={() => {
                  const q = parseInt(quantity) || 1;
                  if (q < selectedProduct?.quantity) {
                    setQuantity((q + 1).toString());
                  }
                }}>
                <Text style={[
                  styles.qtyBtnText,
                  { color: colors.dark },
                ]}>+</Text>
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

  // ── SUCCESS TOAST ─────────────────────────
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
  successToastIcon: { fontSize: 20 },
  successToastText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
  },

  // ── HEADER ────────────────────────────────
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

  // ── SEARCH ────────────────────────────────
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
  searchPlaceholder: {
    color: colors.textLight,
    fontSize: 13,
  },

  // ── CATEGORIES ────────────────────────────
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

  // ── COUNT ROW ─────────────────────────────
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

  // ── PRODUCT LIST ──────────────────────────
  productList: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── PRODUCT CARD ──────────────────────────
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
  productEmojiWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.farmerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.farmerColor + '30',
  },
  productEmoji: { fontSize: 30 },
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
    marginBottom: 10,
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
  orderBtn: {
    backgroundColor: colors.farmerColor,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.large,
    ...shadow,
  },
  orderBtnDisabled: {
    backgroundColor: colors.border,
  },
  orderBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 12,
  },

  // ── EMPTY ─────────────────────────────────
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
  },

  // ── MODAL ─────────────────────────────────
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 0,
    top: 16,
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

  // ── MODAL PRODUCT ─────────────────────────
  modalProductCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  modalProductEmoji: {
    width: 64,
    height: 64,
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

  // ── QUANTITY ──────────────────────────────
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

  // ── MODAL TOTAL ───────────────────────────
  modalTotalCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xlarge,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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

  // ── MODAL BUTTONS ─────────────────────────
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
    fontSize: 14,
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
    fontSize: 14,
    letterSpacing: 0.5,
  },
});