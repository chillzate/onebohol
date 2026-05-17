// ============================================
// ZAVARA CART SCREEN - v5.0
// INSPIRED BY: GrabFood, Shopee, Gojek, Foodpanda
// Improvements over v4.0:
// 1. Cart items stagger slide in entrance
// 2. Qty number bounce animation on change
// 3. Checkout button pulse glow
// 4. Empty cart floating emoji animation
// 5. Item removal slide + fade animation
// 6. Payment card scale pop on select
// 7. Checkout button scale press feedback
// 8. Free delivery pop celebration
// 9. Address input animated focus glow
// 10. Screen entrance fade animation
// ============================================
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios        from 'axios';
import * as Haptics from 'expo-haptics';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { API_URL }      from '../config';
import { showToast }    from './ToastManager';
import { useAppContext } from '../context/AppContext';
import {
  OrderSuccessModal,
  LoadingModal,
  ConfirmModal,
} from './CustomToast';

// ============================================
// CONSTANTS
// ============================================
const DELIVERY_FEE      = 49;
const FREE_DELIVERY_MIN = 500;

const CATEGORY_EMOJI = {
  seafood:    '🐟',
  vegetables: '🥦',
  rice:       '🌾',
  fruits:     '🍌',
  livestock:  '🐄',
  other:      '🌿',
};

function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category?.toLowerCase()] || '🌴';
}

// ============================================
// HELPER: Haptic with silent fail
// ============================================
async function haptic(type = 'light') {
  try {
    if (type === 'light') {
      await Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light
      );
    } else if (type === 'medium') {
      await Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Medium
      );
    } else if (type === 'success') {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } else if (type === 'warning') {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    } else if (type === 'error') {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
  } catch (_) {}
}

// ============================================
// SUB COMPONENT: Animated Cart Item
// ============================================
function CartItem({ item, onIncrease, onDecrease, index }) {
  // Entrance animation
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  // Qty bounce animation
  const qtyScale  = useRef(new Animated.Value(1)).current;
  // Remove animation
  const removeAnim = useRef(new Animated.Value(1)).current;
  const removeSlide = useRef(new Animated.Value(0)).current;

  // Stagger entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        350,
        delay:           index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        delay:           index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Qty bounce
  const bounceQty = () => {
    Animated.sequence([
      Animated.spring(qtyScale, {
        toValue:         1.4,
        friction:        4,
        useNativeDriver: true,
      }),
      Animated.spring(qtyScale, {
        toValue:         1,
        friction:        4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleIncrease = () => {
    haptic('light');
    bounceQty();
    onIncrease(item.id);
  };

  const handleDecrease = () => {
    if (item.quantity === 1) {
      // Animate removal
      haptic('medium');
      Animated.parallel([
        Animated.timing(removeAnim, {
          toValue:         0,
          duration:        250,
          useNativeDriver: true,
        }),
        Animated.timing(removeSlide, {
          toValue:         -60,
          duration:        250,
          useNativeDriver: true,
        }),
      ]).start(() => onDecrease(item));
    } else {
      haptic('light');
      bounceQty();
      onDecrease(item);
    }
  };

  return (
    <Animated.View style={[
      styles.cartCard,
      {
        opacity:   Animated.multiply(fadeAnim, removeAnim),
        transform: [
          { translateY: slideAnim },
          { translateX: removeSlide },
        ],
      },
    ]}>
      {/* Item image or emoji */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.cartItemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cartItemEmoji}>
          <Text style={styles.cartItemEmojiText}>
            {getCategoryEmoji(item.category)}
          </Text>
        </View>
      )}

      <View style={styles.cartInfo}>
        <Text style={styles.cartName} numberOfLines={1}>
          {item.name}
        </Text>
        {(item.restaurant_name || item.seller_name) && (
          <Text style={styles.cartFrom} numberOfLines={1}>
            {item.order_type === 'food' ? '🍴' : '🏪'}{' '}
            {item.restaurant_name || item.seller_name}
          </Text>
        )}
        <Text style={styles.cartUnitPrice}>
          ₱{item.price.toFixed(2)}{' '}
          {item.unit ? `per ${item.unit}` : 'each'}
        </Text>
        <View style={styles.cartBottomRow}>
          <Text style={styles.cartSubtotal}>
            ₱{(item.price * item.quantity).toFixed(2)}
          </Text>
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
      </View>

      {/* Qty Controls */}
      <View style={styles.qtyWrap}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={handleDecrease}
          activeOpacity={0.8}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>

        {/* Animated qty number */}
        <Animated.View style={[
          styles.qtyNum,
          { transform: [{ scale: qtyScale }] },
        ]}>
          <Text style={styles.qtyNumText}>
            {item.quantity}
          </Text>
        </Animated.View>

        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={handleIncrease}
          activeOpacity={0.8}>
          <Text style={[styles.qtyBtnText,
            { color: colors.textWhite }]}>+</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Payment Option
// ============================================
function PaymentOption({
  icon,
  title,
  subtitle,
  selected,
  onSelect,
  iconBg,
  index = 0,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        350,
      delay:           index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPress = () => {
    haptic('light');
    // Scale pop on select
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:         0.96,
        friction:        8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        5,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect();
  };

  return (
    <Animated.View style={[{
      opacity:   fadeAnim,
      transform: [{ scale: scaleAnim }],
    }]}>
      <TouchableOpacity
        style={[
          styles.paymentCard,
          selected && styles.paymentCardActive,
        ]}
        onPress={onPress}
        activeOpacity={1}>
        <View style={[styles.paymentIconWrap,
          { backgroundColor: iconBg || colors.primaryPale }]}>
          <Text style={styles.paymentIcon}>{icon}</Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{title}</Text>
          <Text style={styles.paymentSub}>{subtitle}</Text>
        </View>
        <View style={[
          styles.paymentRadio,
          selected && styles.paymentRadioActive,
        ]}>
          {selected && (
            <Text style={styles.paymentRadioCheck}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Empty Cart
// ============================================
function EmptyCart({ onBack }) {
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        6,
        tension:         40,
        useNativeDriver: true,
      }),
    ]).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue:         -16,
          duration:        1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue:         0,
          duration:        1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onPressIn  = () => Animated.spring(btnScale, {
    toValue: 0.96, friction: 8, useNativeDriver: true,
  }).start();
  const onPressOut = () => Animated.spring(btnScale, {
    toValue: 1, friction: 5, useNativeDriver: true,
  }).start();

  return (
    <Animated.View style={[
      styles.emptyWrap,
      { opacity: fadeAnim },
    ]}>
      <Animated.View style={[
        styles.emptyCircle,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: floatAnim },
          ],
        },
      ]}>
        <Text style={styles.emptyEmoji}>🛒</Text>
      </Animated.View>

      <Animated.Text style={[
        styles.emptyTitle,
        { opacity: fadeAnim },
      ]}>
        Your Cart is Empty
      </Animated.Text>

      <Animated.Text style={[
        styles.emptySub,
        { opacity: fadeAnim },
      ]}>
        Add some food or fresh products{'\n'}
        to get started!
      </Animated.Text>

      <Animated.View style={{
        transform: [{ scale: btnScale }],
      }}>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={onBack}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}>
          <Text style={styles.emptyBtnText}>
            Browse Now →
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ============================================
// MAIN CART SCREEN
// ============================================
export default function CartScreen({
  cart,
  setCart,
  userId,
  onBack,
  onOrderPlaced,
}) {
  const [address, setAddress]           = useState('');
  const [placing, setPlacing]           = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState('cod');
  const [showSuccess, setShowSuccess]       = useState(false);
  const [showLoading, setShowLoading]       = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [orderTotal, setOrderTotal]         = useState(0);
  const [orderType, setOrderType]           = useState('food');
  const [freeDeliveryPop, setFreeDeliveryPop] = useState(false);

  const { saveCart, clearPersistedCart } = useAppContext();

  // ── ANIMATION REFS ────────────────────────
  const screenFade       = useRef(new Animated.Value(0)).current;
  const progressAnim     = useRef(new Animated.Value(0)).current;
  const checkoutScale    = useRef(new Animated.Value(1)).current;
  const checkoutPulse    = useRef(new Animated.Value(1)).current;
  const addressBorder    = useRef(new Animated.Value(0)).current;
  const freeDeliveryPop_ = useRef(new Animated.Value(0)).current;

  // ── SCREEN ENTRANCE ───────────────────────
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue:         1,
      duration:        350,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── CHECKOUT PULSE ────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(checkoutPulse, {
          toValue:         1.03,
          duration:        1000,
          useNativeDriver: true,
        }),
        Animated.timing(checkoutPulse, {
          toValue:         1,
          duration:        1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── CART CALCULATIONS ─────────────────────
  const cartTotals = useMemo(() => {
    const totalItems = cart.reduce(
      (sum, i) => sum + i.quantity, 0
    );
    const subtotal   = cart.reduce(
      (sum, i) => sum + i.price * i.quantity, 0
    );
    const deliveryFee = subtotal >= FREE_DELIVERY_MIN
      ? 0 : DELIVERY_FEE;
    const total    = subtotal + deliveryFee;
    const progress = Math.min(
      subtotal / FREE_DELIVERY_MIN, 1
    );
    return { totalItems, subtotal, deliveryFee, total, progress };
  }, [cart]);

  // ── FREE DELIVERY CELEBRATION ─────────────
  const prevDeliveryFee = useRef(cartTotals.deliveryFee);
  useEffect(() => {
    if (
      prevDeliveryFee.current > 0 &&
      cartTotals.deliveryFee === 0
    ) {
      haptic('success');
      freeDeliveryPop_.setValue(0);
      Animated.spring(freeDeliveryPop_, {
        toValue:         1,
        friction:        4,
        tension:         40,
        useNativeDriver: true,
      }).start();
    }
    prevDeliveryFee.current = cartTotals.deliveryFee;
  }, [cartTotals.deliveryFee]);

  // ── ORDER TYPE DETECTION ──────────────────
  const detectedOrderType = useMemo(() => {
    const hasFood   = cart.some(
      i => i.order_type === 'food' || i.menu_item_id
    );
    const hasMarket = cart.some(
      i => i.order_type === 'market' || i.product_id
    );
    if (hasFood && hasMarket) return 'mixed';
    if (hasFood) return 'food';
    return 'market';
  }, [cart]);

  // ── PROGRESS BAR ─────────────────────────
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue:         cartTotals.progress,
      duration:        400,
      useNativeDriver: false,
    }).start();
  }, [cartTotals.progress]);

  // ── ADDRESS FOCUS ANIMATION ───────────────
  const onAddressFocus = () => {
    setAddressFocused(true);
    Animated.timing(addressBorder, {
      toValue:         1,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const onAddressBlur = () => {
    setAddressFocused(false);
    Animated.timing(addressBorder, {
      toValue:         0,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const addressBorderColor = addressBorder.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  // ── CHECKOUT BUTTON PRESS ─────────────────
  const onCheckoutPressIn  = () => {
    Animated.spring(checkoutScale, {
      toValue:         0.96,
      friction:        8,
      useNativeDriver: true,
    }).start();
  };
  const onCheckoutPressOut = () => {
    Animated.spring(checkoutScale, {
      toValue:         1,
      friction:        5,
      useNativeDriver: true,
    }).start();
  };

  // ── CART FUNCTIONS ────────────────────────
  const increaseQty = useCallback((id) => {
    setCart(prev => {
      const updated = prev.map(i =>
        i.id === id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
      saveCart(updated);
      return updated;
    });
  }, [setCart, saveCart]);

  const decreaseQty = useCallback((item) => {
    if (item.quantity === 1) {
      setCart(prev => {
        const updated = prev.filter(i => i.id !== item.id);
        saveCart(updated);
        return updated;
      });
      showToast('info', 'Item Removed',
        `${item.name} removed from cart`);
    } else {
      setCart(prev => {
        const updated = prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
        saveCart(updated);
        return updated;
      });
    }
  }, [setCart, saveCart]);

  const handleClearCart = useCallback(() => {
    haptic('medium');
    setShowClearConfirm(true);
  }, []);

  const confirmClearCart = useCallback(() => {
    setCart([]);
    clearPersistedCart();
    haptic('success');
    showToast('info', 'Cart Cleared',
      'All items removed');
  }, [setCart, clearPersistedCart]);

  // ── PLACE ORDER ───────────────────────────
  const placeOrder = useCallback(async () => {
    if (!address.trim()) {
      showToast('warning', 'Address Required',
        'Please enter your delivery address');
      haptic('warning');
      return;
    }
    if (address.trim().length < 10) {
      showToast('warning', 'Address Too Short',
        'Please enter a complete delivery address');
      haptic('warning');
      return;
    }

    setPlacing(true);
    setShowLoading(true);

    let successCount = 0;
    let failCount    = 0;
    const finalTotal = cartTotals.total;

    for (const item of cart) {
      try {
        const isFood =
          item.order_type === 'food' ||
          !!item.menu_item_id;
        await axios.post(
          `${API_URL}/orders?buyer_id=${userId}`,
          {
            order_type:       isFood ? 'food' : 'market',
            menu_item_id:     isFood
              ? (item.menu_item_id || item.id)
              : undefined,
            product_id:       !isFood
              ? (item.product_id || item.id)
              : undefined,
            quantity:         item.quantity,
            delivery_address: address.trim(),
            payment_method:   paymentMethod,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        successCount++;
      } catch { failCount++; }
    }

    setPlacing(false);
    setShowLoading(false);

    if (successCount > 0) {
      haptic('success');
      setOrderTotal(finalTotal);
      setOrderType(
        detectedOrderType === 'mixed'
          ? 'food' : detectedOrderType
      );
      setCart([]);
      clearPersistedCart();
      setShowSuccess(true);
      if (failCount > 0) {
        showToast('warning',
          `${failCount} item(s) failed`,
          'Some items could not be ordered'
        );
      }
    } else {
      haptic('error');
      showToast('error', 'Order Failed',
        'Could not place order. Check your connection.');
    }
  }, [
    address, cart, userId, paymentMethod,
    cartTotals.total, detectedOrderType,
    setCart, clearPersistedCart,
  ]);

  // ── SUCCESS ACTIONS ───────────────────────
  const handleTrackOrder = useCallback(() => {
    setShowSuccess(false);
    onOrderPlaced?.();
  }, [onOrderPlaced]);

  const handleContinueShopping = useCallback(() => {
    setShowSuccess(false);
    onBack?.();
  }, [onBack]);

  // ============================================
  // EMPTY CART STATE
  // ============================================
  if (!cart || cart.length === 0) {
    return (
      <Animated.View style={[
        styles.container,
        { opacity: screenFade },
      ]}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />

        <LoadingModal
          visible={showLoading}
          message="Placing your order..."
        />
        <OrderSuccessModal
          visible={showSuccess}
          onClose={handleContinueShopping}
          total={orderTotal.toFixed(2)}
          onTrack={handleTrackOrder}
          paymentMethod={paymentMethod}
          orderType={orderType}
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        <EmptyCart onBack={onBack} />
      </Animated.View>
    );
  }

  // ============================================
  // MAIN CART
  // ============================================
  return (
    <Animated.View style={[
      styles.containerFlex,
      { opacity: screenFade },
    ]}>
      <KeyboardAvoidingView
        style={styles.containerFlex}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />

        <LoadingModal
          visible={showLoading}
          message="Placing your order..."
        />
        <OrderSuccessModal
          visible={showSuccess}
          onClose={handleContinueShopping}
          total={orderTotal.toFixed(2)}
          onTrack={handleTrackOrder}
          paymentMethod={paymentMethod}
          orderType={orderType}
        />
        <ConfirmModal
          visible={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={confirmClearCart}
          title="Clear Cart?"
          message={`Remove all ${cartTotals.totalItems} items from your cart?`}
          confirmText="Clear All"
          cancelText="Keep Items"
          dangerous={true}
        />

        {/* ── HEADER ──────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              My Cart
            </Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {cartTotals.totalItems}{' '}
                {cartTotals.totalItems === 1
                  ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearCart}
            activeOpacity={0.8}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* ── FREE DELIVERY BANNER ─────────── */}
        <Animated.View style={[
          styles.deliveryBanner,
          cartTotals.deliveryFee === 0 && {
            transform: [{
              scale: freeDeliveryPop_.interpolate({
                inputRange:  [0, 0.5, 1],
                outputRange: [1, 1.03, 1],
              }),
            }],
          },
        ]}>
          {cartTotals.deliveryFee === 0 ? (
            <Text style={styles.deliveryBannerTextFree}>
              🎉 You got FREE delivery!
            </Text>
          ) : (
            <>
              <Text style={styles.deliveryBannerText}>
                Add ₱{(FREE_DELIVERY_MIN -
                  cartTotals.subtotal).toFixed(2)} more
                for FREE delivery!
              </Text>
              <View style={styles.deliveryProgressBg}>
                <Animated.View style={[
                  styles.deliveryProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]} />
              </View>
            </>
          )}
        </Animated.View>

        {/* Mixed cart banner */}
        {detectedOrderType === 'mixed' && (
          <View style={styles.mixedCartBanner}>
            <Text style={styles.mixedCartIcon}>ℹ️</Text>
            <Text style={styles.mixedCartText}>
              Mixed cart: Food + Market items will be
              placed as separate orders
            </Text>
          </View>
        )}

        {/* ── SCROLL ──────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* Order Items */}
          <Text style={styles.sectionLabel}>
            ORDER ITEMS
          </Text>
          {cart.map((item, index) => (
            <CartItem
              key={item.id}
              item={item}
              index={index}
              onIncrease={increaseQty}
              onDecrease={decreaseQty}
            />
          ))}

          {/* Delivery Address */}
          <Text style={styles.sectionLabel}>
            DELIVERY ADDRESS
          </Text>
          <Animated.View style={[
            styles.addressCard,
            { borderColor: addressBorderColor },
          ]}>
            <Text style={styles.addressIcon}>📍</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your complete address..."
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              onFocus={onAddressFocus}
              onBlur={onAddressBlur}
              textAlignVertical="top"
            />
            {address.trim().length >= 10 && (
              <Text style={styles.addressCheck}>✓</Text>
            )}
          </Animated.View>

          {/* Order Summary */}
          <Text style={styles.sectionLabel}>
            ORDER SUMMARY
          </Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({cartTotals.totalItems} items)
              </Text>
              <Text style={styles.summaryValue}>
                ₱{cartTotals.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery Fee
              </Text>
              <Text style={[styles.summaryValue,
                cartTotals.deliveryFee === 0 &&
                { color: colors.success }]}>
                {cartTotals.deliveryFee === 0
                  ? '🎉 FREE'
                  : `₱${cartTotals.deliveryFee}.00`}
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
                ₱{cartTotals.total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionLabel}>
            PAYMENT METHOD
          </Text>
          <PaymentOption
            icon="💵"
            title="Cash on Delivery"
            subtitle="Pay when your order arrives"
            selected={paymentMethod === 'cod'}
            onSelect={() => setPaymentMethod('cod')}
            iconBg={colors.primaryPale}
            index={0}
          />
          <PaymentOption
            icon="📱"
            title="GCash"
            subtitle="Pay via GCash (screenshot required)"
            selected={paymentMethod === 'gcash'}
            onSelect={() => setPaymentMethod('gcash')}
            iconBg={colors.infoPale}
            index={1}
          />

          {/* Notes */}
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

          <View style={{ height: 10 }} />
        </ScrollView>

        {/* ── CHECKOUT FOOTER ─────────────── */}
        <View style={styles.checkoutFooter}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutLabel}>
              TOTAL AMOUNT
            </Text>
            <Text style={styles.checkoutTotal}>
              ₱{cartTotals.total.toFixed(2)}
            </Text>
            {cartTotals.deliveryFee === 0 && (
              <Text style={styles.checkoutFreeTag}>
                🎉 Free Delivery Included!
              </Text>
            )}
          </View>

          {/* Pulsing checkout button */}
          <Animated.View style={{
            transform: [
              { scale: placing ? 1 : checkoutPulse },
            ],
          }}>
            <Animated.View style={{
              transform: [{ scale: checkoutScale }],
            }}>
              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  placing && styles.checkoutBtnDisabled,
                ]}
                onPress={placeOrder}
                onPressIn={onCheckoutPressIn}
                onPressOut={onCheckoutPressOut}
                disabled={placing}
                activeOpacity={1}>
                <Text style={styles.checkoutBtnText}>
                  {placing
                    ? '⏳ Placing...'
                    : '🚀 PLACE ORDER'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

      </KeyboardAvoidingView>
    </Animated.View>
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
  containerFlex: {
    flex:            1,
    backgroundColor: colors.background,
  },

  // ── HEADER ──────────────────────────────────
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
    alignItems: 'center',
    gap:        4,
  },
  headerTitle: {
    color:      colors.textDark,
    fontSize:   18,
    fontWeight: '900',
  },
  headerBadge: {
    backgroundColor:   colors.primaryPale,
    paddingHorizontal: 12,
    paddingVertical:   3,
    borderRadius:      borderRadius.round,
    borderWidth:       1,
    borderColor:       colors.borderGold,
  },
  headerBadgeText: {
    color:      colors.primary,
    fontSize:   10,
    fontWeight: '800',
  },
  clearBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: colors.dangerPale,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.danger + '20',
  },
  clearBtnText: {
    color:      colors.danger,
    fontSize:   11,
    fontWeight: '800',
  },

  // ── DELIVERY BANNER ─────────────────────────
  deliveryBanner: {
    backgroundColor:   colors.warningPale,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '25',
    gap:               8,
  },
  deliveryBannerText: {
    color:      colors.warning,
    fontSize:   12,
    fontWeight: '700',
    textAlign:  'center',
  },
  deliveryBannerTextFree: {
    color:      colors.success,
    fontSize:   12,
    fontWeight: '800',
    textAlign:  'center',
  },
  deliveryProgressBg: {
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    2,
    overflow:        'hidden',
  },
  deliveryProgressFill: {
    height:          '100%',
    backgroundColor: colors.warning,
    borderRadius:    2,
  },

  // ── MIXED CART BANNER ───────────────────────
  mixedCartBanner: {
    backgroundColor:   colors.infoPale,
    paddingHorizontal: 16,
    paddingVertical:   10,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    borderBottomWidth: 1,
    borderBottomColor: colors.info + '20',
  },
  mixedCartIcon: { fontSize: 16 },
  mixedCartText: {
    color:      colors.info,
    fontSize:   11,
    fontWeight: '600',
    flex:       1,
    lineHeight: 16,
  },

  // ── SCROLL ──────────────────────────────────
  scrollContent: {
    padding:       20,
    paddingBottom: 140,
  },
  sectionLabel: {
    color:         colors.textLight,
    fontSize:      10,
    fontWeight:    '900',
    letterSpacing: 2,
    marginBottom:  12,
    marginTop:     4,
  },

  // ── CART CARD ───────────────────────────────
  cartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         14,
    marginBottom:    10,
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             12,
    ...shadow,
  },
  cartItemImage: {
    width:           52,
    height:          52,
    borderRadius:    14,
    backgroundColor: colors.inputBackground,
  },
  cartItemEmoji: {
    width:          52,
    height:         52,
    borderRadius:   14,
    backgroundColor: colors.primaryPale,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    colors.borderGold,
  },
  cartItemEmojiText: { fontSize: 24 },
  cartInfo:          { flex: 1 },
  cartName: {
    fontSize:     14,
    fontWeight:   '800',
    color:        colors.textDark,
    marginBottom: 2,
  },
  cartFrom: {
    fontSize:     10,
    color:        colors.textMuted,
    marginBottom: 2,
    fontWeight:   '600',
  },
  cartUnitPrice: {
    fontSize:     11,
    color:        colors.textMuted,
    marginBottom: 4,
  },
  cartBottomRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  cartSubtotal: {
    fontSize:   15,
    color:      colors.primary,
    fontWeight: '900',
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      borderRadius.small,
  },
  orderTypeBadgeText: {
    fontSize:   9,
    fontWeight: '800',
  },

  // ── QTY ─────────────────────────────────────
  qtyWrap: {
    flexDirection: 'column',
    alignItems:    'center',
    gap:           6,
  },
  qtyBtn: {
    width:          32,
    height:         32,
    borderRadius:   10,
    backgroundColor: colors.inputBackground,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    colors.border,
  },
  qtyBtnPlus: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  qtyBtnText: {
    fontSize:   18,
    color:      colors.textDark,
    fontWeight: '900',
    lineHeight: 22,
  },
  qtyNum: {
    width:          32,
    height:         32,
    borderRadius:   10,
    backgroundColor: colors.primaryPale,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    colors.borderGold,
  },
  qtyNumText: {
    fontSize:   15,
    fontWeight: '900',
    color:      colors.primary,
  },

  // ── ADDRESS ─────────────────────────────────
  addressCard: {
    backgroundColor:  colors.cardBackground,
    borderRadius:     borderRadius.xlarge,
    padding:          16,
    flexDirection:    'row',
    alignItems:       'flex-start',
    borderWidth:      1.5,
    marginBottom:     22,
    gap:              10,
    ...shadow,
  },
  addressIcon:  { fontSize: 22, marginTop: 2 },
  addressInput: {
    flex:       1,
    fontSize:   14,
    color:      colors.textDark,
    lineHeight: 22,
    minHeight:  44,
    paddingTop: 0,
  },
  addressCheck: {
    color:      '#22C55E',
    fontSize:   18,
    fontWeight: '900',
    marginTop:  2,
  },

  // ── SUMMARY ─────────────────────────────────
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         20,
    marginBottom:    22,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadowMd,
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  summaryLabel: {
    color:    colors.textLight,
    fontSize: 13,
  },
  summaryValue: {
    color:      colors.textDark,
    fontSize:   13,
    fontWeight: '700',
  },
  summaryDivider: {
    height:          1,
    backgroundColor: colors.border,
    marginVertical:  12,
  },
  summaryTotalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  summaryTotalLabel: {
    color:         colors.textDark,
    fontSize:      14,
    fontWeight:    '900',
    letterSpacing: 2,
  },
  summaryTotalValue: {
    color:      colors.primary,
    fontSize:   28,
    fontWeight: '900',
  },

  // ── PAYMENT ─────────────────────────────────
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
    marginBottom:    10,
    gap:             14,
    ...shadow,
  },
  paymentCardActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primaryPale,
  },
  paymentIconWrap: {
    width:          46,
    height:         46,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    colors.borderGold,
  },
  paymentIcon:  { fontSize: 24 },
  paymentInfo:  { flex: 1 },
  paymentTitle: {
    fontSize:     14,
    fontWeight:   '800',
    color:        colors.textDark,
    marginBottom: 3,
  },
  paymentSub: {
    fontSize: 11,
    color:    colors.textLight,
  },
  paymentRadio: {
    width:          24,
    height:         24,
    borderRadius:   12,
    borderWidth:    2,
    borderColor:    colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primary,
  },
  paymentRadioCheck: {
    color:      colors.textWhite,
    fontSize:   12,
    fontWeight: '900',
  },

  // ── NOTE CARD ───────────────────────────────
  noteCard: {
    backgroundColor: colors.primaryPale,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    borderWidth:     1,
    borderColor:     colors.borderGold,
    gap:             10,
    marginTop:       10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  noteIcon: { fontSize: 16 },
  noteText: {
    color:      colors.textMedium,
    fontSize:   12,
    fontWeight: '600',
    flex:       1,
  },

  // ── EMPTY CART ──────────────────────────────
  emptyWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        40,
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

  // ── CHECKOUT FOOTER ─────────────────────────
  checkoutFooter: {
    position:          'absolute',
    bottom:            0,
    width:             '100%',
    backgroundColor:   colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical:   14,
    paddingBottom:     30,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               16,
    borderTopWidth:    1,
    borderTopColor:    colors.border,
    ...shadowMd,
  },
  checkoutInfo:  { flex: 1 },
  checkoutLabel: {
    color:         colors.textMuted,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.5,
    marginBottom:  2,
  },
  checkoutTotal: {
    color:      colors.textDark,
    fontSize:   24,
    fontWeight: '900',
  },
  checkoutFreeTag: {
    color:      colors.success,
    fontSize:   10,
    fontWeight: '700',
    marginTop:  2,
  },
  checkoutBtn: {
    backgroundColor:   colors.primary,
    paddingHorizontal: 22,
    paddingVertical:   16,
    borderRadius:      borderRadius.large,
    minWidth:          140,
    alignItems:        'center',
    ...shadowGold,
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: {
    color:         colors.textWhite,
    fontWeight:    '900',
    fontSize:      13,
    letterSpacing: 0.5,
  },
});