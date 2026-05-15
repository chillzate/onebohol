import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Animated,
  useRef,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowLg,
  shadowDark,
  shadowStrong,
  shadowGold,
  borderRadius,
} from '../theme';
import {
  ErrorModal,
  OrderSuccessModal,
} from './CustomToast';

const API_URL = 'https://onebohol-production.up.railway.app';

export default function CartScreen({
  cart,
  setCart,
  userId,
  onBack,
  onOrderSuccess,
}) {
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showAddressError, setShowAddressError] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [addressFocused, setAddressFocused] = useState(false);

  const totalItems = cart.reduce(
    (sum, i) => sum + i.quantity, 0
  );
  const subtotal = cart.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  );
  const deliveryFee = 49;
  const total = subtotal + deliveryFee;

  const increaseQty = (id) =>
    setCart(cart.map(i =>
      i.id === id
        ? { ...i, quantity: i.quantity + 1 }
        : i
    ));

  const decreaseQty = (id) => {
    const item = cart.find(i => i.id === id);
    if (item.quantity === 1) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i =>
        i.id === id
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    }
  };

  const clearCart = () => setCart([]);

  const placeOrder = async () => {
    if (!address.trim()) {
      setShowAddressError(true);
      return;
    }
    setPlacing(true);
    try {
      for (const item of cart) {
        await axios.post(
          `${API_URL}/orders?buyer_id=${userId}`,
          {
            order_type: 'food',
            menu_item_id: item.id,
            quantity: item.quantity,
            delivery_address: address,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      setOrderTotal(total);
      setCart([]);
      setShowSuccess(true);
    } catch (error) {
      setShowError(true);
    }
    setPlacing(false);
  };

  // ============================================
  // EMPTY CART
  // ============================================
  if (cart.length === 0 && !showSuccess) {
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
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>
            Your Cart is Empty
          </Text>
          <Text style={styles.emptySub}>
            Add some delicious food{'\n'}
            to get started!
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={onBack}>
            <Text style={styles.emptyBtnText}>
              Browse Restaurants →
            </Text>
          </TouchableOpacity>
        </View>

        <OrderSuccessModal
          visible={showSuccess}
          total={orderTotal.toFixed(2)}
          onClose={() => {
            setShowSuccess(false);
            onOrderSuccess();
          }}
          onTrack={() => {
            setShowSuccess(false);
            onOrderSuccess();
          }}
        />
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

      {/* SCROLL */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* RESTAURANT NOTE */}
        <View style={styles.restaurantNote}>
          <Text style={styles.restaurantNoteIcon}>🍴</Text>
          <Text style={styles.restaurantNoteText}>
            Your order will be prepared fresh
            and delivered hot!
          </Text>
        </View>

        {/* SECTION - ORDER ITEMS */}
        <Text style={styles.sectionLabel}>
          ORDER ITEMS
        </Text>

        {cart.map((item, index) => (
          <View key={item.id} style={styles.cartCard}>

            {/* NUMBER */}
            <View style={styles.cartNumber}>
              <Text style={styles.cartNumberText}>
                {index + 1}
              </Text>
            </View>

            {/* INFO */}
            <View style={styles.cartInfo}>
              <Text style={styles.cartName}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cartUnitPrice}>
                ₱{item.price.toFixed(2)} each
              </Text>
              <Text style={styles.cartSubtotal}>
                ₱{(item.price * item.quantity).toFixed(2)}
              </Text>
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

        {/* SECTION - DELIVERY ADDRESS */}
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

        {/* SECTION - ORDER SUMMARY */}
        <Text style={styles.sectionLabel}>
          ORDER SUMMARY
        </Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({totalItems}{' '}
              {totalItems === 1 ? 'item' : 'items'})
            </Text>
            <Text style={styles.summaryValue}>
              ₱{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery Fee
            </Text>
            <Text style={styles.summaryValue}>
              ₱{deliveryFee}.00
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

        {/* SECTION - PAYMENT */}
        <Text style={styles.sectionLabel}>
          PAYMENT METHOD
        </Text>
        <View style={styles.paymentCard}>
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
          <View style={styles.paymentCheck}>
            <Text style={styles.paymentCheckText}>✓</Text>
          </View>
        </View>

        {/* MORE PAYMENT OPTIONS SOON */}
        <View style={styles.morePaymentWrap}>
          <Text style={styles.morePaymentText}>
            🔜 GCash · Maya · Credit Card coming soon!
          </Text>
        </View>

        {/* DELIVERY NOTE */}
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
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            placing && styles.checkoutBtnDisabled,
          ]}
          onPress={placeOrder}
          disabled={placing}>
          <Text style={styles.checkoutBtnText}>
            {placing ? '⏳ Placing...' : '🚀 PLACE ORDER'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODALS */}
      <OrderSuccessModal
        visible={showSuccess}
        total={orderTotal.toFixed(2)}
        onClose={() => {
          setShowSuccess(false);
          onOrderSuccess();
        }}
        onTrack={() => {
          setShowSuccess(false);
          onOrderSuccess();
        }}
      />
      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title="Order Failed ❌"
        message="Could not place your order. Please check your connection and try again."
      />
      <ErrorModal
        visible={showAddressError}
        onClose={() => setShowAddressError(false)}
        title="Address Required 📍"
        message="Please enter your delivery address before placing your order."
      />

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

  // ── SCROLL ────────────────────────────────
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },

  // ── RESTAURANT NOTE ───────────────────────
  restaurantNote: {
    backgroundColor: colors.cuisineBg,
    borderRadius: borderRadius.large,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.cuisineBorder,
  },
  restaurantNoteIcon: { fontSize: 24 },
  restaurantNoteText: {
    color: colors.cuisineColor,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // ── SECTION LABEL ─────────────────────────
  sectionLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── CART CARD ─────────────────────────────
  cartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadow,
  },
  cartNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  cartNumberText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  cartInfo: { flex: 1 },
  cartName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 3,
  },
  cartUnitPrice: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },
  cartSubtotal: {
    fontSize: 14,
    color: colors.cuisineColor,
    fontWeight: '900',
  },

  // ── QTY CONTROLS ──────────────────────────
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
    backgroundColor: colors.cuisineColor,
    borderColor: colors.cuisineColor,
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

  // ── ADDRESS ───────────────────────────────
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
    backgroundColor: colors.cardBackground,
  },
  addressIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
    minHeight: 44,
  },

  // ── SUMMARY ───────────────────────────────
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

  // ── PAYMENT ───────────────────────────────
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: 10,
    gap: 14,
    ...shadow,
  },
  paymentIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  paymentIcon: { fontSize: 26 },
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
  paymentCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  paymentCheckText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 15,
  },
  morePaymentWrap: {
    alignItems: 'center',
    marginBottom: 22,
    paddingVertical: 6,
  },
  morePaymentText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── NOTE CARD ─────────────────────────────
  noteCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 10,
    marginBottom: 10,
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

  // ── CHECKOUT FOOTER ───────────────────────
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginBottom: 3,
  },
  checkoutTotal: {
    color: colors.textDark,
    fontSize: 26,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: borderRadius.large,
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