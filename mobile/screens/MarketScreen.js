// ============================================
// ZAVARA MARKET SCREEN - v4.0
// INSPIRED BY: Shopee, Lazada, GrabMart, Tokopedia
// Improvements over v3.0:
// 1. Header fade + slide entrance animation
// 2. Product cards stagger fade + slide entrance
// 3. Product card scale press feedback
// 4. Skeleton grid loading screen
// 5. Category chip scale pop on select
// 6. Search bar animated focus glow
// 7. Empty state floating emoji animation
// 8. Low stock pulse animation
// 9. Add to cart bounce feedback
// 10. Screen entrance fade animation
// ============================================
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  TextInput,
  RefreshControl,
  Animated,
  ScrollView,
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
import { showToast }     from './ToastManager';
import { API_URL }       from '../config';
import { useAppContext } from '../context/AppContext';
import CartScreen        from './CartScreen';

// ============================================
// CONSTANTS
// ============================================
const CATEGORIES = [
  'All', 'Vegetables', 'Fruits',
  'Seafood', 'Meat', 'Rice & Grains',
  'Dairy', 'Others',
];

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
    }
  } catch (_) {}
}

// ============================================
// SUB COMPONENT: Skeleton Product Card
// ============================================
function SkeletonProductCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue:         1,
          duration:        800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue:         0,
          duration:        800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Animated.View style={[
      styles.skeletonCard,
      { opacity },
    ]}>
      <View style={styles.skeletonImg} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Category Chip
// ============================================
function CategoryChip({ label, active, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptic('light');
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:         0.88,
        friction:        8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        5,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
    }}>
      <TouchableOpacity
        style={[
          styles.catChip,
          active && styles.catChipActive,
        ]}
        onPress={handlePress}
        activeOpacity={1}>
        <Text style={[
          styles.catChipText,
          active && styles.catChipTextActive,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Empty State
// ============================================
function AnimatedEmpty({ searchText, selectedCat, onClear }) {
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        6,
        tension:         40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue:         -14,
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

  return (
    <Animated.View style={[
      styles.emptyWrap,
      { opacity: fadeAnim },
    ]}>
      <Animated.Text style={[
        styles.emptyIcon,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: floatAnim },
          ],
        },
      ]}>
        🌾
      </Animated.Text>
      <Text style={styles.emptyTitle}>
        No Products Found
      </Text>
      <Text style={styles.emptySub}>
        {searchText
          ? `No results for "${searchText}"`
          : 'No products available right now'}
      </Text>
      {(searchText || selectedCat !== 'All') && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={onClear}>
          <Text style={styles.clearBtnText}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Low Stock Pulse
// ============================================
function LowStockText({ quantity }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue:         0.5,
          duration:        800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue:         1,
          duration:        800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={[
      styles.stockText,
      styles.stockLow,
      { opacity: pulseAnim },
    ]}>
      ⚠️ Only {quantity} left!
    </Animated.Text>
  );
}

// ============================================
// SUB COMPONENT: Animated Product Card
// ============================================
function ProductCard({
  item, cartQty, onAdd, onRemove, index,
}) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const addBounce  = useRef(new Animated.Value(1)).current;

  // Stagger entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        350,
        delay:           index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        delay:           index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Card press animations
  const onPressIn  = () => {
    Animated.spring(scaleAnim, {
      toValue:         0.97,
      friction:        8,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue:         1,
      friction:        5,
      useNativeDriver: true,
    }).start();
  };

  const handleAdd = useCallback(() => {
    haptic('light');
    // Add bounce
    Animated.sequence([
      Animated.spring(addBounce, {
        toValue:         0.88,
        friction:        4,
        useNativeDriver: true,
      }),
      Animated.spring(addBounce, {
        toValue:         1,
        friction:        4,
        useNativeDriver: true,
      }),
    ]).start();
    // Card scale
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:         0.95,
        friction:        4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        4,
        useNativeDriver: true,
      }),
    ]).start();
    onAdd(item);
  }, [item, onAdd]);

  const handleRemove = useCallback(() => {
    haptic('light');
    onRemove(item.id);
  }, [item.id, onRemove]);

  const isOutOfStock = item.quantity === 0;
  const isLowStock   = item.quantity > 0 &&
    item.quantity < 10;

  return (
    <Animated.View style={[
      styles.productCard,
      cartQty > 0 && styles.productCardInCart,
      {
        opacity:   fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      },
    ]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        onPress={handleAdd}
        disabled={isOutOfStock}>

        {/* Image */}
        <View style={styles.productImgWrap}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.productImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImgPlaceholder}>
              <Text style={styles.productImgEmoji}>
                🌾
              </Text>
            </View>
          )}

          {/* In cart badge */}
          {cartQty > 0 && (
            <View style={styles.inCartBadge}>
              <Text style={styles.inCartBadgeText}>
                ✓ {cartQty} in cart
              </Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>
                Out of Stock
              </Text>
            </View>
          )}

          {/* Market type badge */}
          <View style={[
            styles.marketTypeBadge,
            item.market_type === 'wholesale'
              ? styles.wholesaleBadge
              : styles.retailBadge,
          ]}>
            <Text style={styles.marketTypeBadgeText}>
              {item.market_type === 'wholesale'
                ? '📦 Wholesale'
                : '🛒 Retail'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text
            style={styles.productName}
            numberOfLines={2}>
            {item.name}
          </Text>

          {item.description ? (
            <Text
              style={styles.productDesc}
              numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          {(item.barangay || item.municipality) && (
            <Text style={styles.productLocation}>
              📍 {[item.barangay, item.municipality]
                .filter(Boolean).join(', ')}
            </Text>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              ₱{item.price}
            </Text>
            <Text style={styles.productUnit}>
              /{item.unit}
            </Text>
          </View>

          {/* Stock status */}
          {isLowStock ? (
            <LowStockText quantity={item.quantity} />
          ) : !isOutOfStock ? (
            <Text style={styles.stockText}>
              ✅ {item.quantity} available
            </Text>
          ) : null}

          {/* Rating */}
          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
              </Text>
              {item.total_reviews > 0 && (
                <Text style={styles.ratingCount}>
                  ({item.total_reviews})
                </Text>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {cartQty > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={handleRemove}
                  activeOpacity={0.8}>
                  <Text style={styles.removeBtnText}>
                    🗑️
                  </Text>
                </TouchableOpacity>
                <Animated.View style={[
                  styles.addMoreBtnWrap,
                  { transform: [{ scale: addBounce }] },
                ]}>
                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    onPress={handleAdd}
                    disabled={isOutOfStock}
                    activeOpacity={0.85}>
                    <Text style={styles.addMoreBtnText}>
                      + Add More
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <Animated.View style={[
                styles.addBtnWrap,
                { transform: [{ scale: addBounce }] },
              ]}>
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    isOutOfStock && styles.addBtnDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={isOutOfStock}
                  activeOpacity={0.85}>
                  <Text style={styles.addBtnText}>
                    {isOutOfStock
                      ? 'Out of Stock'
                      : '+ Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// MAIN MARKET SCREEN
// ============================================
export default function MarketScreen({
  userId,
  userRole,
  onBack,
  onCartUpdate,
  onGoToDashboard,
}) {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedCat, setSelectedCat] = useState('All');
  const [searchText, setSearchText]   = useState('');
  const [cart, setCart]               = useState([]);
  const [showCart, setShowCart]       = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    persistedCart,
    cartLoaded,
    saveCart,
    setCartCount,
  } = useAppContext();

  // ── ANIMATION REFS ────────────────────────
  const screenFade   = useRef(new Animated.Value(0)).current;
  const headerSlide  = useRef(new Animated.Value(-20)).current;
  const headerFade   = useRef(new Animated.Value(0)).current;
  const cartBounce   = useRef(new Animated.Value(1)).current;
  const cartAnim     = useRef(new Animated.Value(0)).current;
  const searchBorder = useRef(new Animated.Value(0)).current;

  // ── ENTRANCE ANIMATION ────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenFade, {
        toValue:         1,
        duration:        400,
        useNativeDriver: true,
      }),
      Animated.timing(headerFade, {
        toValue:         1,
        duration:        500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue:         0,
        friction:        8,
        tension:         50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── RESTORE CART ──────────────────────────
  useEffect(() => {
    if (!cartLoaded) return;
    const marketCart = persistedCart.filter(
      i => i.order_type === 'market' || i.product_id
    );
    if (marketCart.length > 0) setCart(marketCart);
  }, [cartLoaded]);

  // ── CART ANIMATION ────────────────────────
  const cartCount = useMemo(() =>
    cart.reduce((s, i) => s + i.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (cartCount > 0) {
      Animated.sequence([
        Animated.spring(cartBounce, {
          toValue:         1.3,
          friction:        3,
          useNativeDriver: true,
        }),
        Animated.spring(cartBounce, {
          toValue:         1,
          friction:        4,
          useNativeDriver: true,
        }),
      ]).start();
    }
    Animated.spring(cartAnim, {
      toValue:         cartCount > 0 ? 1 : 0,
      friction:        8,
      useNativeDriver: true,
    }).start();
    onCartUpdate?.(cartCount);
    setCartCount(cartCount);
  }, [cartCount]);

  // ── SEARCH FOCUS ANIMATION ────────────────
  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchBorder, {
      toValue:         1,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchBorder, {
      toValue:         0,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const searchBorderColor = searchBorder.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border, colors.farmerColor],
  });

  // ── FETCH PRODUCTS ────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/products`,
        {
          params:  { user_id: userId },
          timeout: 10000,
        }
      );
      setProducts(res.data || []);
    } catch (err) {
      if (__DEV__) console.log(
        'Products error:', err?.message
      );
      setProducts([]);
      showToast(
        'error',
        'Could not load products',
        'Pull down to retry'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
  }, [fetchProducts]);

  // ── CART FUNCTIONS ────────────────────────
  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      let updated;
      if (existing) {
        updated = prev.map(c =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      } else {
        updated = [...prev, {
          ...item,
          quantity:   1,
          order_type: 'market',
          product_id: item.id,
        }];
      }
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, [saveCart]);

  // ── COMPUTED ──────────────────────────────
  const cartTotal = useMemo(() =>
    cart.reduce(
      (s, i) => s + i.price * i.quantity, 0
    ),
    [cart]
  );

  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const matchCat = selectedCat === 'All' ||
        p.category === selectedCat;
      const matchSearch = !searchText.trim() ||
        p.name?.toLowerCase().includes(
          searchText.toLowerCase()
        ) ||
        p.description?.toLowerCase().includes(
          searchText.toLowerCase()
        );
      return matchCat && matchSearch;
    }),
    [products, selectedCat, searchText]
  );

  // ── RENDER PRODUCT ────────────────────────
  const renderProduct = useCallback(
    ({ item, index }) => {
      const cartItem = cart.find(c => c.id === item.id);
      return (
        <ProductCard
          item={item}
          cartQty={cartItem?.quantity || 0}
          onAdd={addToCart}
          onRemove={removeFromCart}
          index={index}
        />
      );
    },
    [cart, addToCart, removeFromCart]
  );

  const keyExtractor = useCallback(
    (item) => item.id.toString(), []
  );

  // ── CART SCREEN ───────────────────────────
  if (showCart) {
    return (
      <CartScreen
        cart={cart}
        setCart={setCart}
        userId={userId}
        onBack={() => setShowCart(false)}
        onOrderPlaced={() => {
          setShowCart(false);
          clearCart();
          showToast(
            'success',
            'Order Placed! 🎉',
            'Your order is being processed!'
          );
        }}
      />
    );
  }

  // ── SKELETON GRID ─────────────────────────
  const SkeletonGrid = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <SkeletonProductCard key={i} />
      ))}
    </View>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <Animated.View style={[
      styles.container,
      { opacity: screenFade },
    ]}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      {/* ── HEADER ────────────────────────── */}
      <Animated.View style={[
        styles.header,
        {
          opacity:   headerFade,
          transform: [{ translateY: headerSlide }],
        },
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerBrand}>ZAVARA</Text>

          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => setShowCart(true)}
            activeOpacity={0.8}>
            <Animated.Text style={[
              styles.cartBtnIcon,
              { transform: [{ scale: cartBounce }] },
            ]}>
              🛒
            </Animated.Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>
          🌾 Market
        </Text>
        <Text style={styles.headerSub}>
          {userRole === 'regular'
            ? 'Fresh products from local producers'
            : userRole === 'producer'
              ? 'Wholesale market'
              : 'Market'}
        </Text>

        {/* Producer dashboard shortcut */}
        {['producer', 'admin'].includes(userRole) && (
          <TouchableOpacity
            style={styles.dashShortcut}
            onPress={onGoToDashboard}
            activeOpacity={0.85}>
            <Text style={styles.dashShortcutText}>
              🌾 My Dashboard →
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── SEARCH ────────────────────────── */}
      <View style={styles.searchWrap}>
        <Animated.View style={[
          styles.searchBar,
          { borderColor: searchBorderColor },
        ]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={{ padding: 4 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* ── CATEGORIES ────────────────────── */}
      <View style={styles.catWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={selectedCat === cat}
              onPress={() => setSelectedCat(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── RESULTS COUNT ─────────────────── */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? 's' : ''}
          </Text>
          {cartCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowCart(true)}>
              <Text style={styles.viewCartLink}>
                View Cart ({cartCount}) →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── PRODUCT LIST OR SKELETON ──────── */}
      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 30,
          }}>
          <SkeletonGrid />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={keyExtractor}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.farmerColor]}
              tintColor={colors.farmerColor}
            />
          }
          ListEmptyComponent={
            <AnimatedEmpty
              searchText={searchText}
              selectedCat={selectedCat}
              onClear={() => {
                setSearchText('');
                setSelectedCat('All');
              }}
            />
          }
        />
      )}

      {/* ── FLOATING CART ─────────────────── */}
      <Animated.View style={[
        styles.floatingCartWrap,
        {
          transform: [{
            translateY: cartAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: [120, 0],
            }),
          }],
          opacity: cartAnim,
        },
      ]}>
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => setShowCart(true)}
          activeOpacity={0.9}>
          <View style={styles.floatingCartLeft}>
            <Animated.View style={[
              styles.floatingCartBadge,
              { transform: [{ scale: cartBounce }] },
            ]}>
              <Text style={styles.floatingCartBadgeText}>
                {cartCount}
              </Text>
            </Animated.View>
            <View>
              <Text style={styles.floatingCartLabel}>
                View Cart
              </Text>
              <Text style={styles.floatingCartSub}>
                {cartCount} item
                {cartCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartTotal}>
              ₱{cartTotal.toFixed(2)}
            </Text>
            <Text style={styles.floatingCartArrow}>
              →
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

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

  // ── SKELETON ────────────────────────────────
  skeletonGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    padding:        12,
    gap:            12,
  },
  skeletonCard: {
    width:           '47%',
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border,
    marginBottom:    0,
  },
  skeletonImg: {
    height:          140,
    backgroundColor: colors.inputBackground,
  },
  skeletonBody: {
    padding: 12,
    gap:     8,
  },
  skeletonLine1: {
    height:          14,
    width:           '80%',
    backgroundColor: colors.inputBackground,
    borderRadius:    4,
  },
  skeletonLine2: {
    height:          10,
    width:           '60%',
    backgroundColor: colors.inputBackground,
    borderRadius:    4,
  },
  skeletonPrice: {
    height:          20,
    width:           '50%',
    backgroundColor: colors.inputBackground,
    borderRadius:    4,
  },
  skeletonBtn: {
    height:          36,
    backgroundColor: colors.inputBackground,
    borderRadius:    borderRadius.large,
  },

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor:   colors.dark,
    paddingTop:        52,
    paddingBottom:     16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGold,
    ...shadowMd,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
  },
  backBtnText: {
    color:      colors.textWhite,
    fontSize:   18,
    fontWeight: '700',
  },
  headerBrand: {
    color:         colors.primary,
    fontSize:      14,
    fontWeight:    '900',
    letterSpacing: 4,
  },
  cartBtn: {
    width:           38,
    height:          38,
    borderRadius:    12,
    backgroundColor: colors.primaryPale,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.borderGold,
    position:        'relative',
  },
  cartBtnIcon: { fontSize: 18 },
  cartBadge: {
    position:          'absolute',
    top:               -4,
    right:             -4,
    minWidth:          18,
    height:            18,
    borderRadius:      9,
    backgroundColor:   colors.danger,
    alignItems:        'center',
    justifyContent:    'center',
    borderWidth:       1.5,
    borderColor:       colors.cardBackground,
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },
  headerTitle: {
    color:        colors.textWhite,
    fontSize:     26,
    fontWeight:   '900',
    marginBottom: 4,
  },
  headerSub: {
    color:    'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  dashShortcut: {
    marginTop:         10,
    backgroundColor:   colors.farmerBg,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      borderRadius.large,
    alignSelf:         'flex-start',
    borderWidth:       1,
    borderColor:       colors.farmerBorder || colors.border,
  },
  dashShortcutText: {
    color:      colors.farmerColor,
    fontSize:   12,
    fontWeight: '800',
  },

  // ── SEARCH ──────────────────────────────────
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    backgroundColor:   colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    backgroundColor:   colors.inputBackground,
    borderRadius:      borderRadius.large,
    paddingHorizontal: 14,
    paddingVertical:   12,
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1.5,
    gap:               10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex:     1,
    fontSize: 14,
    color:    colors.textDark,
    padding:  0,
  },
  searchClear: {
    color:      colors.textMuted,
    fontSize:   14,
    fontWeight: '700',
  },

  // ── CATEGORIES ──────────────────────────────
  catWrap: {
    backgroundColor:   colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catList: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    gap:               8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      borderRadius.round,
    backgroundColor:   colors.inputBackground,
    borderWidth:       1,
    borderColor:       colors.border,
  },
  catChipActive: {
    backgroundColor: colors.farmerColor,
    borderColor:     colors.farmerColor,
  },
  catChipText: {
    fontSize:   12,
    color:      colors.textMedium,
    fontWeight: '700',
  },
  catChipTextActive: {
    color:      colors.textWhite,
    fontWeight: '900',
  },

  // ── RESULTS ─────────────────────────────────
  resultsRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor:   colors.cardBackground,
  },
  resultsText: {
    color:      colors.textLight,
    fontSize:   12,
    fontWeight: '600',
  },
  viewCartLink: {
    color:      colors.farmerColor,
    fontSize:   12,
    fontWeight: '800',
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

  // ── PRODUCT GRID ────────────────────────────
  productList: {
    padding:       12,
    paddingBottom: 120,
  },
  columnWrapper: { gap: 12 },

  // ── PRODUCT CARD ────────────────────────────
  productCard: {
    flex:            1,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    marginBottom:    12,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  productCardInCart: {
    borderColor:     colors.farmerColor + '50',
    backgroundColor: colors.farmerBg + '20',
  },
  productImgWrap: {
    height:   140,
    position: 'relative',
  },
  productImg: { width: '100%', height: '100%' },
  productImgPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: colors.farmerBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  productImgEmoji: { fontSize: 44 },
  inCartBadge: {
    position:          'absolute',
    top:               8,
    left:              8,
    backgroundColor:   colors.farmerColor,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      borderRadius.round,
  },
  inCartBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },
  outOfStockBadge: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  outOfStockText: {
    color:      colors.textWhite,
    fontSize:   13,
    fontWeight: '900',
  },
  marketTypeBadge: {
    position:          'absolute',
    bottom:            8,
    right:             8,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      borderRadius.round,
  },
  wholesaleBadge: { backgroundColor: colors.riderBg  },
  retailBadge:    { backgroundColor: colors.farmerBg },
  marketTypeBadgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      colors.textDark,
  },
  productInfo: {
    padding: 12,
    gap:     4,
  },
  productName: {
    color:      colors.textDark,
    fontSize:   13,
    fontWeight: '800',
    lineHeight: 18,
  },
  productDesc: {
    color:      colors.textLight,
    fontSize:   10,
    lineHeight: 14,
  },
  productLocation: {
    color:    colors.textMuted,
    fontSize: 9,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           2,
    marginTop:     4,
  },
  productPrice: {
    color:      colors.farmerColor,
    fontSize:   18,
    fontWeight: '900',
  },
  productUnit: {
    color:      colors.textMuted,
    fontSize:   10,
    fontWeight: '500',
  },
  stockText: {
    color:      colors.success,
    fontSize:   9,
    fontWeight: '600',
  },
  stockLow: { color: colors.warning },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
    marginTop:     2,
  },
  ratingStar:   { fontSize: 10 },
  ratingText: {
    color:      colors.primary,
    fontSize:   10,
    fontWeight: '800',
  },
  ratingCount: {
    color:    colors.textMuted,
    fontSize: 9,
  },
  actionRow: {
    flexDirection: 'row',
    gap:           6,
    marginTop:     8,
  },
  addBtnWrap:    { flex: 1 },
  addMoreBtnWrap: { flex: 1 },
  addBtn: {
    flex:            1,
    backgroundColor: colors.farmerColor,
    paddingVertical: 10,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    ...shadow,
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
    opacity:         0.6,
  },
  addBtnText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   11,
  },
  removeBtn: {
    backgroundColor:  colors.dangerPale,
    paddingVertical:  10,
    paddingHorizontal: 12,
    borderRadius:     borderRadius.large,
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      colors.danger + '30',
  },
  removeBtnText: { fontSize: 14 },
  addMoreBtn: {
    flex:            1,
    backgroundColor: colors.farmerColor,
    paddingVertical: 10,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
  },
  addMoreBtnText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   11,
  },

  // ── EMPTY ───────────────────────────────────
  emptyWrap: {
    alignItems:        'center',
    paddingVertical:   60,
    paddingHorizontal: 40,
    gap:               10,
  },
  emptyIcon: { fontSize: 60 },
  emptyTitle: {
    fontSize:   20,
    fontWeight: '900',
    color:      colors.textDark,
  },
  emptySub: {
    fontSize:   13,
    color:      colors.textLight,
    textAlign:  'center',
    lineHeight: 20,
  },
  clearBtn: {
    backgroundColor:   colors.primaryPale,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      borderRadius.large,
    borderWidth:       1,
    borderColor:       colors.borderGold,
    marginTop:         8,
  },
  clearBtnText: {
    color:      colors.primary,
    fontWeight: '800',
    fontSize:   13,
  },

  // ── FLOATING CART ───────────────────────────
  floatingCartWrap: {
    position: 'absolute',
    bottom:   20,
    left:     16,
    right:    16,
  },
  floatingCart: {
    backgroundColor: colors.dark,
    borderRadius:    borderRadius.xxlarge,
    padding:         16,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.borderGold,
    ...shadowGold,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  floatingCartBadge: {
    backgroundColor: colors.primary,
    width:           34,
    height:          34,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadowGold,
  },
  floatingCartBadgeText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   15,
  },
  floatingCartLabel: {
    color:      colors.textWhite,
    fontWeight: '800',
    fontSize:   15,
  },
  floatingCartSub: {
    color:    'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  floatingCartTotal: {
    color:      colors.primary,
    fontWeight: '900',
    fontSize:   18,
  },
  floatingCartArrow: {
    color:      colors.primary,
    fontSize:   18,
    fontWeight: '900',
  },
});