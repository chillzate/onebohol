// ============================================
// ZAVARA CART SCREEN - COMPLETE FIXED v2.1
// ============================================
import { useState, useRef } from 'react'; // 🔧 FIX: from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
// 🔧 FIX: Removed Animated (unused), removed useRef from RN
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { API_URL } from '../config';

export default function CartScreen({
  cart,
  setCart,
  userId,
  onBack,
  onOrderPlaced, // 🔧 FIX: consistent prop name
}) {
  const [address, setAddress]           = useState('');
  const [placing, setPlacing]           = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderTotal, setOrderTotal]     = useState(0);
  const [addressFocused, setAddressFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 🆕

  // ── CART CALCULATIONS ───────────────────
  const totalItems = cart.reduce(
    (sum, i) => sum + i.quantity, 0
  );
  const subtotal = cart.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  );
  // 🔧 Free delivery over ₱500
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const total = subtotal + deliveryFee;

  // ── CART FUNCTIONS ──────────────────────
  const increaseQty = (id) =>
    setCart(cart.map(i =>
      i.id === id
        ? { ...i, quantity: i.quantity + 1 }
        : i
    ));

  const decreaseQty = (id) => {
    const item = cart.find(i => i.id === id);
    if (item.quantity === 1) {
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => setCart(
              cart.filter(i => i.id !== id)
            ),
          },
        ]
      );
    } else {
      setCart(cart.map(i =>
        i.id === id
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    }
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setCart([]),
        },
      ]
    );
  };

  const getCategoryEmoji = (category) => {
    const map = {
      seafood: '🐟', vegetables: '🥦',
      rice: '🌾', fruits: '🍌',
      livestock: '🐄', other: '🌿',
    };
    return map[category?.toLowerCase()] || '🌴';
  };

  // ── PLACE ORDER ─────────────────────────
  const placeOrder = async () => {
    if (!address.trim()) {
      Alert.alert(
        '📍 Address Required',
        'Please enter your delivery address before placing your order.'
      );
      return;
    }
    if (address.trim().length < 10) {
      Alert.alert(
        '📍 Address Too Short',
        'Please enter a complete delivery address.'
      );
      return;
    }

    setPlacing(true);
    try {
      // 🔧 FIX: Handle BOTH food and market orders
      for (const item of cart) {
        if (item.order_type === 'food' || item.menu_item_id) {
          // Food order
          await axios.post(
            `${API_URL}/orders?buyer_id=${userId}`,
            {
              order_type: 'food',
              menu_item_id: item.menu_item_id || item.id,
              quantity: item.quantity,
              delivery_address: address,
              payment_method: paymentMethod,
            },
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          // Market/product order
          await axios.post(
            `${API_URL}/orders?buyer_id=${userId}`,
            {
              order_type: 'market',
              product_id: item.product_id || item.id,
              quantity: item.quantity,
              delivery_address: address,
              payment_method: paymentMethod,
            },
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      setOrderTotal(total);
      setCart([]);
      setOrderSuccess(true);
    } catch (error) {
      const msg = error.response?.data?.detail ||
        'Could not place your order. Please check your connection.';
      Alert.alert('Order Failed ❌', msg);
    }
    setPlacing(false);
  };

  // ============================================
  // SUCCESS SCREEN
  // ============================================
  if (orderSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={styles.successTitle}>
            Order Placed!
          </Text>
          <Text style={styles.successSub}>
            Your order has been placed successfully.
            {'\n'}We'll notify you when it's confirmed!
          </Text>
          <View style={styles.successTotalCard}>
            <Text style={styles.successTotalLabel}>
              TOTAL PAID
            </Text>
            <Text style={styles.successTotalValue}>
              ₱{orderTotal.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.trackOrderBtn}
            onPress={() => {
              setOrderSuccess(false);
              onOrderPlaced?.();
            }}>
            <Text style={styles.trackOrderBtnText}>
              📦 TRACK MY ORDER
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueBrowsingBtn}
            onPress={() => {
              setOrderSuccess(false);
              onBack?.();
            }}>
            <Text style={styles.continueBrowsingText}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // EMPTY CART
  // ============================================
  if (!cart || cart.length === 0) {
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
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>
            Your Cart is Empty
          </Text>
          <Text style={styles.emptySub}>
            Add some food or fresh products{'\n'}
            to get started!
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={onBack}>
            <Text style={styles.emptyBtnText}>
              Browse Now →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // CART SCREEN
  // ============================================
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
          onPress={onBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {totalItems}{' '}
              {totalItems === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearCart}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* FREE DELIVERY BANNER */}
      {subtotal < 500 && (
        <View style={styles.freeDeliveryBanner}>
          <Text style={styles.freeDeliveryText}>
            🚀 Add ₱{(500 - subtotal).toFixed(2)} more for
            FREE delivery!
          </Text>
        </View>
      )}
      {subtotal >= 500 && (
        <View style={[styles.freeDeliveryBanner,
          { backgroundColor: colors.successPale,
            borderColor: colors.success + '30' }]}>
          <Text style={[styles.freeDeliveryText,
            { color: colors.success }]}>
            🎉 You got FREE delivery!
          </Text>
        </View>
      )}

      {/* SCROLL CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ORDER ITEMS */}
        <Text style={styles.sectionLabel}>
          ORDER ITEMS
        </Text>

        {cart.map((item, index) => (
          <View key={item.id} style={styles.cartCard}>

            {/* IMAGE or EMOJI */}
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.cartItemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cartNumber}>
                <Text style={styles.cartNumberText}>
                  {getCategoryEmoji(item.category) ||
                    (index + 1).toString()}
                </Text>
              </View>
            )}

            {/* INFO */}
            <View style={styles.cartInfo}>
              <Text style={styles.cartName}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cartUnitPrice}>
                ₱{item.price.toFixed(2)}{' '}
                {item.unit ? `per ${item.unit}` : 'each'}
              </Text>
              <Text style={styles.cartSubtotal}>
                ₱{(item.price * item.quantity).toFixed(2)}
              </Text>
              {/* 🆕 Order type badge */}
              <View style={[styles.orderTypeBadge, {
                backgroundColor: item.order_type === 'food'
                  ? colors.cuisineBg : colors.farmerBg,
              }]}>
                <Text style={[styles.orderTypeBadgeText, {
                  color: item.order_type === 'food'
                    ? colors.cuisineColor
                    : colors.farmerColor,
                }]}>
                  {item.order_type === 'food'
                    ? '🍴 Food' : '🌾 Market'}
                </Text>
              </View>
            </View>

            {/* QTY CONTROLS */}
            <View style={styles.qtyWrap}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => decreaseQty(item.id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.qtyNum}>
                <Text style={styles.qtyNumText}>
                  {item.quantity}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                onPress={() => increaseQty(item.id)}>
                <Text style={[styles.qtyBtnText,
                  { color: colors.textWhite }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}

        {/* DELIVERY ADDRESS */}
        <Text style={styles.sectionLabel}>
          DELIVERY ADDRESS
        </Text>
        <View style={[styles.addressCard,
          addressFocused && styles.addressCardFocused]}>
          <Text style={styles.addressIcon}>📍</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your complete address..."
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            onFocus={() => setAddressFocused(true)}
            onBlur={() => setAddressFocused(false)}
          />
        </View>

        {/* ORDER SUMMARY */}
        <Text style={styles.sectionLabel}>
          ORDER SUMMARY
        </Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({totalItems} items)
            </Text>
            <Text style={styles.summaryValue}>
              ₱{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery Fee
            </Text>
            <Text style={[styles.summaryValue,
              deliveryFee === 0 && { color: colors.success }]}>
              {deliveryFee === 0
                ? '🎉 FREE'
                : `₱${deliveryFee}.00`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Service Fee
            </Text>
            <Text style={[styles.summaryValue,
              { color: colors.success }]}>
              FREE
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>
              TOTAL
            </Text>
            <Text style={styles.summaryTotalValue}>
              ₱{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 🆕 PAYMENT METHOD SELECTOR */}
        <Text style={styles.sectionLabel}>
          PAYMENT METHOD
        </Text>

        {/* COD Option */}
        <TouchableOpacity
          style={[styles.paymentCard,
            paymentMethod === 'cod' &&
            styles.paymentCardActive]}
          onPress={() => setPaymentMethod('cod')}>
          <View style={styles.paymentIconWrap}>
            <Text style={styles.paymentIcon}>💵</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>
              Cash on Delivery
            </Text>
            <Text style={styles.paymentSub}>
              Pay when your order arrives
            </Text>
          </View>
          <View style={[styles.paymentRadio,
            paymentMethod === 'cod' &&
            styles.paymentRadioActive]}>
            {paymentMethod === 'cod' && (
              <Text style={styles.paymentRadioCheck}>✓</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* GCash Option */}
        <TouchableOpacity
          style={[styles.paymentCard,
            paymentMethod === 'gcash' &&
            styles.paymentCardActive]}
          onPress={() => setPaymentMethod('gcash')}>
          <View style={[styles.paymentIconWrap,
            { backgroundColor: colors.infoPale }]}>
            <Text style={styles.paymentIcon}>📱</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>
              GCash
            </Text>
            <Text style={styles.paymentSub}>
              Pay via GCash (screenshot required)
            </Text>
          </View>
          <View style={[styles.paymentRadio,
            paymentMethod === 'gcash' &&
            styles.paymentRadioActive]}>
            {paymentMethod === 'gcash' && (
              <Text style={styles.paymentRadioCheck}>✓</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* DELIVERY INFO */}
        <View style={styles.noteCard}>
          <View style={styles.noteRow}>
            <Text style={styles.noteIcon}>🛵</Text>
            <Text style={styles.noteText}>
              Estimated delivery: 30-45 minutes
            </Text>
          </View>
          <View style={styles.noteRow}>
            <Text style={styles.noteIcon}>📞</Text>
            <Text style={styles.noteText}>
              Rider will call you upon arrival
            </Text>
          </View>
          <View style={styles.noteRow}>
            <Text style={styles.noteIcon}>🌴</Text>
            <Text style={styles.noteText}>
              Supporting local Bohol businesses!
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* CHECKOUT FOOTER */}
      <View style={styles.checkoutFooter}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>
            Total Amount
          </Text>
          <Text style={styles.checkoutTotal}>
            ₱{total.toFixed(2)}
          </Text>
          {deliveryFee === 0 && (
            <Text style={styles.checkoutFreeTag}>
              🎉 Free Delivery!
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            placing && styles.checkoutBtnDisabled,
          ]}
          onPress={placeOrder}
          disabled={placing}>
          {placing ? (
            <ActivityIndicator
              size="small"
              color={colors.textWhite}
            />
          ) : (
            <Text style={styles.checkoutBtnText}>
              🚀 PLACE ORDER
            </Text>
          )}
        </TouchableOpacity>
      </View>

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

  // ── HEADER ──────────────────────────────
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
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  headerBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.dangerPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  clearBtnText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  // 🆕 FREE DELIVERY BANNER ────────────────
  freeDeliveryBanner: {
    backgroundColor: colors.warningPale,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '30',
  },
  freeDeliveryText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── SCROLL ──────────────────────────────
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },

  // ── SECTION LABEL ───────────────────────
  sectionLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── CART CARD ───────────────────────────
  cartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadow,
  },
  // 🆕 Image support
  cartItemImage: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.inputBackground,
  },
  cartNumber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  cartNumberText: {
    fontSize: 22,
  },
  cartInfo: { flex: 1 },
  cartName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  cartUnitPrice: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  cartSubtotal: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '900',
    marginBottom: 4,
  },
  // 🆕 Order type badge
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.small,
    alignSelf: 'flex-start',
  },
  orderTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // ── QTY CONTROLS ────────────────────────
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    fontSize: 18,
    color: colors.textDark,
    fontWeight: '900',
    lineHeight: 22,
  },
  qtyNum: {
    width: 34,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  qtyNumText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },

  // ── ADDRESS ─────────────────────────────
  addressCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
    gap: 10,
    ...shadow,
  },
  addressCardFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  addressIcon: { fontSize: 22, marginTop: 2 },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
    minHeight: 44,
  },

  // ── SUMMARY ─────────────────────────────
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: colors.textLight,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  summaryTotalValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },

  // 🆕 PAYMENT METHOD ──────────────────────
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 14,
    ...shadow,
  },
  paymentCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  paymentIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  paymentIcon: { fontSize: 24 },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 3,
  },
  paymentSub: {
    fontSize: 11,
    color: colors.textLight,
  },
  paymentRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  paymentRadioCheck: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '900',
  },

  // ── NOTE CARD ───────────────────────────
  noteCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteIcon: { fontSize: 16 },
  noteText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // ── EMPTY ───────────────────────────────
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

  // ── SUCCESS SCREEN ──────────────────────
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.success + '40',
  },
  successEmoji: { fontSize: 60 },
  successTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 10,
  },
  successSub: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successTotalCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  successTotalLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  successTotalValue: {
    color: colors.primaryLight,
    fontSize: 36,
    fontWeight: '900',
  },
  trackOrderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: borderRadius.large,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...shadowGold,
  },
  trackOrderBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  continueBrowsingBtn: {
    paddingVertical: 12,
  },
  continueBrowsingText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── CHECKOUT FOOTER ─────────────────────
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadowMd,
  },
  checkoutInfo: { flex: 1 },
  checkoutLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  checkoutTotal: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutFreeTag: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: borderRadius.large,
    minWidth: 140,
    alignItems: 'center',
    ...shadowGold,
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});