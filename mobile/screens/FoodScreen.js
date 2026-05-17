// ============================================
// ZAVARA FOOD SCREEN - v5.0
// INSPIRED BY: GrabFood, Foodpanda, Gojek
// Improvements over v4.0:
// 1. Restaurant cards stagger slide up entrance
// 2. Restaurant card scale press feedback
// 3. Category chip scale pop on select
// 4. Skeleton loading screen
// 5. Empty state floating emoji animation
// 6. Menu items stagger entrance
// 7. Search bar expansion on focus
// 8. Hero image parallax on scroll
// ============================================
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  StatusBar,
  Animated,
  TextInput,
  Dimensions,
  RefreshControl,
  AppState,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import CartScreen    from './CartScreen';
import { API_URL }   from '../config';
import { showToast } from './ToastManager';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'All', 'Fast Food', 'Carinderia',
  'Pizza', 'Cafe', 'Seafood', 'BBQ',
];

// ============================================
// SUB COMPONENT: Skeleton Card (Loading state)
// ============================================
function SkeletonCard() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue:         1,
          duration:        900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue:         0,
          duration:        900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
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
        <View style={styles.skeletonLine3} />
        <View style={styles.skeletonMeta} />
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Empty State
// ============================================
function AnimatedEmpty({ icon, title, sub, onClear }) {
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
        {icon}
      </Animated.Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      {onClear && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={onClear}>
          <Text style={styles.emptyBtnText}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Category Chip
// ============================================
function CategoryChip({ label, active, onPress, activeColor }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:         0.90,
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
          active && {
            backgroundColor: activeColor || colors.cuisineColor,
            borderColor:     activeColor || colors.cuisineColor,
          },
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
// SUB COMPONENT: Animated Restaurant Card
// ============================================
function RestaurantCard({ item, rating, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Stagger entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        400,
        delay:           index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        delay:           index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  return (
    <Animated.View style={[
      styles.restaurantCard,
      {
        opacity:   fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}>
        <View style={styles.restaurantImgWrap}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.restaurantImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.restaurantImgPlaceholder}>
              <Text style={styles.restaurantImgEmoji}>
                🍴
              </Text>
            </View>
          )}
          <View style={styles.imgBadges}>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: item.is_open
                  ? colors.success : colors.danger,
              },
            ]}>
              <Text style={styles.statusBadgeText}>
                {item.is_open ? '● Open' : '● Closed'}
              </Text>
            </View>
          </View>
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>
              {item.category}
            </Text>
          </View>
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantNameRow}>
            <Text
              style={styles.restaurantName}
              numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.ratingWrap}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>
                {rating?.avg > 0
                  ? rating.avg.toFixed(1) : 'New'}
              </Text>
              {rating?.total > 0 && (
                <Text style={styles.ratingCount}>
                  ({rating.total})
                </Text>
              )}
            </View>
          </View>

          {item.description ? (
            <Text
              style={styles.restaurantDesc}
              numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          <Text
            style={styles.restaurantAddress}
            numberOfLines={1}>
            📍 {item.address}
          </Text>

          <View style={styles.restaurantMetaRow}>
            <View style={styles.restaurantMetaItem}>
              <Text style={styles.restaurantMetaText}>
                🛵 {item.delivery_range_km}km
              </Text>
            </View>
            <View style={styles.restaurantMetaDivider} />
            <View style={styles.restaurantMetaItem}>
              <Text style={styles.restaurantMetaText}>
                💰 ₱{item.delivery_fee}
              </Text>
            </View>
            <View style={styles.restaurantMetaDivider} />
            <View style={styles.restaurantMetaItem}>
              <Text style={styles.restaurantMetaText}>
                ⏱️ 30-45 min
              </Text>
            </View>
          </View>

          <View style={[
            styles.restaurantOrderBtn,
            !item.is_open &&
            styles.restaurantOrderBtnClosed,
          ]}>
            <Text style={styles.restaurantOrderBtnText}>
              {item.is_open ? 'View Menu →' : 'See Menu'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Menu Item Card
// ============================================
function MenuItemCard({
  item, inCart, onAdd, onRemove, index,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleAdd = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:         0.94,
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
  }, [item, onAdd, scaleAnim]);

  return (
    <Animated.View style={[
      styles.menuCard,
      inCart && styles.menuCardInCart,
      {
        opacity:   fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      },
    ]}>
      <View style={styles.menuCardLeft}>
        {inCart && (
          <View style={styles.inCartBadge}>
            <Text style={styles.inCartBadgeText}>
              ✓ {inCart.quantity} in cart
            </Text>
          </View>
        )}
        <Text style={styles.menuItemName}>
          {item.name}
        </Text>
        <Text
          style={styles.menuItemDesc}
          numberOfLines={2}>
          {item.description ||
            'Freshly prepared with love 🍽️'}
        </Text>
        <Text style={styles.menuItemPrice}>
          ₱{item.price}
          <Text style={styles.menuItemPriceUnit}>
            {' '}each
          </Text>
        </Text>
        {inCart && (
          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            style={styles.removeFromCartBtn}
            activeOpacity={0.8}>
            <Text style={styles.removeFromCartText}>
              🗑️ Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuCardRight}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.menuItemImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.menuItemImgPlaceholder}>
            <Text style={styles.menuItemImgEmoji}>
              🍽️
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.addBtn,
            inCart && styles.addBtnActive,
          ]}
          onPress={handleAdd}
          activeOpacity={0.85}>
          <Text style={styles.addBtnText}>
            {inCart ? `+${inCart.quantity}` : '+'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ============================================
// MAIN FOOD SCREEN
// ============================================
export default function FoodScreen({ userId, onBack }) {

  const [restaurants, setRestaurants]   = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState(null);
  const [menuItems, setMenuItems]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [menuLoading, setMenuLoading]   = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState('All');
  const [selectedMenuCat, setSelectedMenuCat] =
    useState('All');
  const [cart, setCart]                 = useState([]);
  const [showCart, setShowCart]         = useState(false);
  const [searchText, setSearchText]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [restaurantRatings, setRestaurantRatings] =
    useState({});

  const {
    persistedCart,
    cartLoaded,
    saveCart,
  } = useAppContext();

  // ── ANIMATION REFS ────────────────────────
  const headerAnim   = useRef(new Animated.Value(0)).current;
  const cartBounce   = useRef(new Animated.Value(1)).current;
  const cartAnim     = useRef(new Animated.Value(0)).current;
  const searchWidth  = useRef(new Animated.Value(0)).current;
  const heroScrollY  = useRef(new Animated.Value(0)).current;
  const mountedRef   = useRef(true);
  const abortRef     = useRef(null);
  const appStateRef  = useRef(AppState.currentState);

  // ── RESTORE CART ──────────────────────────
  useEffect(() => {
    if (cartLoaded && persistedCart.length > 0) {
      const foodCart = persistedCart.filter(
        i => i.order_type === 'food' || i.menu_item_id
      );
      if (foodCart.length > 0) setCart(foodCart);
    }
  }, [cartLoaded]);

  // ── CLEAR CART ────────────────────────────
  const clearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, [saveCart]);

  // ── STARTUP ───────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    fetchRestaurants();

    Animated.timing(headerAnim, {
      toValue:         1,
      duration:        600,
      useNativeDriver: true,
    }).start();

    const appStateSub = AppState.addEventListener(
      'change',
      (nextState) => {
        appStateRef.current = nextState;
      }
    );

    return () => {
      mountedRef.current = false;
      appStateSub.remove();
      abortRef.current?.abort();
    };
  }, []);

  // ── CART ANIMATION ────────────────────────
  const cartCount = useMemo(() =>
    cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (cart.length > 0) {
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
      tension:         40,
      useNativeDriver: true,
    }).start();
  }, [cart.length, cartCount]);

  // ── SEARCH FOCUS ANIMATION ────────────────
  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchWidth, {
      toValue:         1,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };
  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchWidth, {
      toValue:         0,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };

  // ── FETCH RESTAURANTS ─────────────────────
  const fetchRestaurants = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await axios.get(
        `${API_URL}/restaurants`,
        {
          timeout: 10000,
          signal:  abortRef.current.signal,
        }
      );
      if (!mountedRef.current) return;
      const data = response.data || [];
      setRestaurants(data);
      fetchRatingsInBatches(data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      if (!mountedRef.current) return;
      setRestaurants([]);
      showToast(
        'error',
        'Could not load restaurants',
        'Pull down to retry'
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRestaurants();
  }, [fetchRestaurants]);

  // ── FETCH RATINGS IN BATCHES ──────────────
  const fetchRatingsInBatches = useCallback(
    async (list) => {
      const batchSize = 3;
      const ratingMap = {};

      for (let i = 0; i < list.length; i += batchSize) {
        if (!mountedRef.current) break;
        const batch = list.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (r) => {
            try {
              const res = await axios.get(
                `${API_URL}/reviews/restaurant/${r.id}`,
                { timeout: 5000 }
              );
              ratingMap[r.id] = {
                avg:   res.data.average_rating || 0,
                total: res.data.total_reviews  || 0,
              };
            } catch {
              ratingMap[r.id] = { avg: 0, total: 0 };
            }
          })
        );
        if (mountedRef.current) {
          setRestaurantRatings(prev => ({
            ...prev,
            ...ratingMap,
          }));
        }
        await new Promise(r => setTimeout(r, 200));
      }
    },
    []
  );

  // ── FETCH MENU ────────────────────────────
  const fetchMenu = useCallback(async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedMenuCat('All');
    setMenuLoading(true);
    heroScrollY.setValue(0);
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${restaurant.id}/menu`,
        { timeout: 10000 }
      );
      if (!mountedRef.current) return;
      setMenuItems(response.data || []);
    } catch {
      if (!mountedRef.current) return;
      setMenuItems([]);
      showToast('error', 'Could not load menu',
        'Please try again');
    } finally {
      if (mountedRef.current) setMenuLoading(false);
    }
  }, []);

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
          quantity:        1,
          order_type:      'food',
          menu_item_id:    item.id,
          restaurant_name: selectedRestaurant?.name,
          restaurant_id:   selectedRestaurant?.id,
        }];
      }
      saveCart(updated);
      return updated;
    });
  }, [selectedRestaurant, saveCart]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  // ── COMPUTED ──────────────────────────────
  const cartTotal = useMemo(() =>
    cart.reduce(
      (sum, i) => sum + i.price * i.quantity, 0
    ),
    [cart]
  );

  const filteredRestaurants = useMemo(() =>
    restaurants.filter(r => {
      const matchCat = selectedCategory === 'All' ||
        r.category === selectedCategory;
      const matchSearch = !searchText.trim() ||
        r.name?.toLowerCase().includes(
          searchText.toLowerCase()
        ) ||
        r.description?.toLowerCase().includes(
          searchText.toLowerCase()
        );
      return matchCat && matchSearch;
    }),
    [restaurants, selectedCategory, searchText]
  );

  const filteredMenu = useMemo(() =>
    selectedMenuCat === 'All'
      ? menuItems
      : menuItems.filter(
          i => i.category === selectedMenuCat
        ),
    [menuItems, selectedMenuCat]
  );

  const menuCategories = useMemo(() => [
    'All',
    ...new Set(
      menuItems.map(i => i.category).filter(Boolean)
    ),
  ], [menuItems]);

  // ── RENDER FUNCTIONS ──────────────────────
  const renderRestaurant = useCallback(
    ({ item, index }) => (
      <RestaurantCard
        item={item}
        rating={restaurantRatings[item.id]}
        onPress={() => fetchMenu(item)}
        index={index}
      />
    ),
    [restaurantRatings, fetchMenu]
  );

  const renderMenuItem = useCallback(
    ({ item, index }) => {
      const inCart = cart.find(c => c.id === item.id);
      return (
        <MenuItemCard
          item={item}
          inCart={inCart}
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

  // ── HERO PARALLAX ─────────────────────────
  const heroTranslate = heroScrollY.interpolate({
    inputRange:  [0, 200],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  // ── SEARCH BAR WIDTH ──────────────────────
  const searchBarBorder = searchWidth.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border, colors.cuisineColor],
  });

  // ============================================
  // CART SCREEN
  // ============================================
  if (showCart) {
    return (
      <CartScreen
        cart={cart}
        setCart={setCart}
        userId={userId}
        onBack={() => setShowCart(false)}
        onOrderPlaced={() => {
          setShowCart(false);
          setSelectedRestaurant(null);
          clearCart();
          showToast(
            'success',
            'Order Placed! 🎉',
            'Your food is being prepared!'
          );
        }}
      />
    );
  }

  // ============================================
  // MENU SCREEN
  // ============================================
  if (selectedRestaurant) {
    const rating =
      restaurantRatings[selectedRestaurant.id];

    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />

        {/* Hero with Parallax */}
        <View style={styles.heroWrap}>
          <Animated.View style={[
            styles.heroParallaxWrap,
            { transform: [{ translateY: heroTranslate }] },
          ]}>
            {selectedRestaurant.image_url ? (
              <Image
                source={{ uri: selectedRestaurant.image_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderEmoji}>
                  🍴
                </Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, {
                backgroundColor:
                  selectedRestaurant.is_open
                    ? colors.success
                    : colors.danger,
              }]}>
                <Text style={styles.heroBadgeText}>
                  {selectedRestaurant.is_open
                    ? '● OPEN NOW'
                    : '● CLOSED'}
                </Text>
              </View>
              <View style={[styles.heroBadge, {
                backgroundColor: 'rgba(255,255,255,0.15)',
              }]}>
                <Text style={styles.heroBadgeText}>
                  {selectedRestaurant.category}
                </Text>
              </View>
            </View>

            <Text style={styles.heroName}>
              {selectedRestaurant.name}
            </Text>
            <Text style={styles.heroAddress}>
              📍 {selectedRestaurant.address}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaIcon}>⭐</Text>
                <Text style={styles.heroMetaText}>
                  {rating?.avg > 0
                    ? rating.avg.toFixed(1) : 'New'}
                  {rating?.total > 0
                    ? ` (${rating.total})` : ''}
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaIcon}>🛵</Text>
                <Text style={styles.heroMetaText}>
                  {selectedRestaurant.delivery_range_km}km
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaIcon}>💰</Text>
                <Text style={styles.heroMetaText}>
                  ₱{selectedRestaurant.delivery_fee} fee
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroBackBtn}
            onPress={() => setSelectedRestaurant(null)}
            activeOpacity={0.85}>
            <Text style={styles.heroBackBtnText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroCartBtn}
            onPress={() => setShowCart(true)}
            activeOpacity={0.85}>
            <Animated.Text style={[
              styles.heroCartIcon,
              { transform: [{ scale: cartBounce }] },
            ]}>
              🛒
            </Animated.Text>
            {cartCount > 0 && (
              <View style={styles.heroCartBadge}>
                <Text style={styles.heroCartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Menu Category Chips */}
        <View style={styles.menuCatWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuCatScroll}>
            {menuCategories.map((cat) => (
              <CategoryChip
                key={cat}
                label={cat}
                active={selectedMenuCat === cat}
                onPress={() => setSelectedMenuCat(cat)}
                activeColor={colors.cuisineColor}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuCountRow}>
          <Text style={styles.menuCountText}>
            {filteredMenu.length} items available
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

        {menuLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={colors.cuisineColor}
            />
            <Text style={styles.loadingText}>
              Loading menu...
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            data={filteredMenu}
            keyExtractor={keyExtractor}
            renderItem={renderMenuItem}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            windowSize={8}
            initialNumToRender={5}
            onScroll={Animated.event(
              [{ nativeEvent: {
                contentOffset: { y: heroScrollY }
              }}],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <AnimatedEmpty
                icon="🍽️"
                title="No items available"
                sub="Check back soon!"
              />
            }
          />
        )}

        {/* Floating Cart */}
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
              <Text style={styles.floatingCartArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ============================================
  // RESTAURANT LIST
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* Header */}
      <Animated.View style={[
        styles.header,
        { opacity: headerAnim },
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerBrand}>ZAVARA</Text>
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => setShowCart(true)}
            activeOpacity={0.8}>
            <Animated.Text style={[
              styles.headerCartIcon,
              { transform: [{ scale: cartBounce }] },
            ]}>
              🛒
            </Animated.Text>
            {cartCount > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>🍴 Cuisine</Text>
        <Text style={styles.headerSub}>
          {filteredRestaurants.length} restaurants found
        </Text>
      </Animated.View>

      {/* Animated Search Bar */}
      <View style={styles.searchWrap}>
        <Animated.View style={[
          styles.searchBar,
          { borderColor: searchBarBorder },
        ]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
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

      {/* Category Chips */}
      <View style={styles.catWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
              activeColor={colors.cuisineColor}
            />
          ))}
        </ScrollView>
      </View>

      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredRestaurants.length} restaurant
            {filteredRestaurants.length !== 1 ? 's' : ''}
          </Text>
          {searchText.length > 0 && (
            <Text style={styles.resultsSearch}>
              for "{searchText}"
            </Text>
          )}
        </View>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <ScrollView
          contentContainerStyle={styles.restaurantList}
          showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={keyExtractor}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.restaurantList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={7}
          initialNumToRender={4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.cuisineColor]}
              tintColor={colors.cuisineColor}
            />
          }
          ListEmptyComponent={
            <AnimatedEmpty
              icon="🍔"
              title="No restaurants found"
              sub={searchText
                ? `No results for "${searchText}"`
                : 'No restaurants open right now'}
              onClear={() => {
                setSearchText('');
                setSelectedCategory('All');
              }}
            />
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

  // ── SKELETON ────────────────────────────────
  skeletonCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xxlarge,
    marginBottom:    16,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  skeletonImg: {
    height:          170,
    backgroundColor: colors.inputBackground,
  },
  skeletonBody: {
    padding: 16,
    gap:     10,
  },
  skeletonLine1: {
    height:          20,
    width:           '60%',
    backgroundColor: colors.inputBackground,
    borderRadius:    6,
  },
  skeletonLine2: {
    height:          14,
    width:           '80%',
    backgroundColor: colors.inputBackground,
    borderRadius:    6,
  },
  skeletonLine3: {
    height:          12,
    width:           '45%',
    backgroundColor: colors.inputBackground,
    borderRadius:    6,
  },
  skeletonMeta: {
    height:          40,
    backgroundColor: colors.inputBackground,
    borderRadius:    borderRadius.medium,
    marginVertical:  4,
  },
  skeletonBtn: {
    height:          44,
    backgroundColor: colors.inputBackground,
    borderRadius:    borderRadius.large,
  },

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor:   colors.headerBg,
    paddingTop:        52,
    paddingBottom:     16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   10,
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
  headerBrand: {
    color:         colors.primary,
    fontSize:      14,
    fontWeight:    '900',
    letterSpacing: 4,
  },
  headerCartBtn: {
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
  headerCartIcon:  { fontSize: 18 },
  headerCartBadge: {
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
  headerCartBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },
  headerTitle: {
    color:      colors.textDark,
    fontSize:   26,
    fontWeight: '900',
  },
  headerSub: {
    color:     colors.textLight,
    fontSize:  12,
    marginTop: 2,
  },

  // ── SEARCH ──────────────────────────────────
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    backgroundColor:   colors.headerBg,
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
  catScroll: {
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
  catChipText: {
    fontSize:   12,
    color:      colors.textMedium,
    fontWeight: '700',
  },
  catChipTextActive: {
    color:      colors.textWhite,
    fontWeight: '900',
  },

  // ── RESULTS ROW ─────────────────────────────
  resultsRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   10,
    gap:               6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsText: {
    color:      colors.textLight,
    fontSize:   12,
    fontWeight: '600',
  },
  resultsSearch: {
    color:      colors.primary,
    fontSize:   12,
    fontWeight: '700',
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

  // ── EMPTY ───────────────────────────────────
  emptyWrap: {
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   60,
    paddingHorizontal: 40,
  },
  emptyIcon:  { fontSize: 60, marginBottom: 16 },
  emptyTitle: {
    fontSize:     20,
    fontWeight:   '900',
    color:        colors.textDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize:     13,
    color:        colors.textLight,
    textAlign:    'center',
    lineHeight:   20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor:   colors.primaryPale,
    paddingHorizontal: 24,
    paddingVertical:   12,
    borderRadius:      borderRadius.large,
    borderWidth:       1,
    borderColor:       colors.borderGold,
  },
  emptyBtnText: {
    color:      colors.primary,
    fontWeight: '800',
    fontSize:   13,
  },

  // ── RESTAURANT LIST ─────────────────────────
  restaurantList: {
    padding:       16,
    paddingBottom: 30,
  },
  restaurantCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xxlarge,
    marginBottom:    16,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadowMd,
  },
  restaurantImgWrap: {
    position: 'relative',
    height:   170,
  },
  restaurantImg: { width: '100%', height: '100%' },
  restaurantImgPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: colors.cuisineBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  restaurantImgEmoji: { fontSize: 55 },
  imgBadges: {
    position:      'absolute',
    top:           12,
    left:          12,
    flexDirection: 'row',
    gap:           8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
  },
  statusBadgeText: {
    color:      colors.textWhite,
    fontSize:   10,
    fontWeight: '900',
  },
  catTag: {
    position:          'absolute',
    bottom:            12,
    right:             12,
    backgroundColor:   'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
  },
  catTagText: {
    color:      colors.textWhite,
    fontSize:   10,
    fontWeight: '700',
  },
  restaurantInfo:    { padding: 16 },
  restaurantNameRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
  },
  restaurantName: {
    fontSize:    18,
    fontWeight:  '900',
    color:       colors.textDark,
    flex:        1,
    marginRight: 10,
  },
  ratingWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      borderRadius.small,
    gap:               3,
    borderWidth:       1,
    borderColor:       colors.borderGold,
  },
  ratingStar:   { fontSize: 11 },
  ratingText: {
    color:      colors.primary,
    fontSize:   12,
    fontWeight: '800',
  },
  ratingCount: {
    color:      colors.textMuted,
    fontSize:   10,
    fontWeight: '600',
  },
  restaurantDesc: {
    fontSize:     12,
    color:        colors.textLight,
    marginBottom: 6,
    lineHeight:   18,
  },
  restaurantAddress: {
    fontSize:     11,
    color:        colors.textMuted,
    marginBottom: 12,
  },
  restaurantMetaRow: {
    flexDirection:   'row',
    alignItems:      'center',
    marginBottom:    14,
    backgroundColor: colors.inputBackground,
    borderRadius:    borderRadius.medium,
    padding:         10,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  restaurantMetaItem:    { flex: 1, alignItems: 'center' },
  restaurantMetaText: {
    fontSize:   11,
    color:      colors.textMedium,
    fontWeight: '600',
  },
  restaurantMetaDivider: {
    width:           1,
    height:          16,
    backgroundColor: colors.border,
  },
  restaurantOrderBtn: {
    backgroundColor: colors.cuisineColor,
    paddingVertical: 12,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    ...shadow,
  },
  restaurantOrderBtnClosed: {
    backgroundColor: colors.border,
    opacity:         0.7,
  },
  restaurantOrderBtnText: {
    color:         colors.textWhite,
    fontWeight:    '900',
    fontSize:      13,
    letterSpacing: 0.5,
  },

  // ── HERO ────────────────────────────────────
  heroWrap: {
    height:   300,
    position: 'relative',
    overflow: 'hidden',
  },
  heroParallaxWrap: {
    position: 'absolute',
    top:      -30,
    left:     0,
    right:    0,
    height:   360,
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: colors.cuisineBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  heroPlaceholderEmoji: { fontSize: 70 },
  heroOverlay: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          '70%',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  heroContent: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    padding:  18,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  8,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
  },
  heroBadgeText: {
    color:      colors.textWhite,
    fontSize:   10,
    fontWeight: '800',
  },
  heroName: {
    color:        colors.textWhite,
    fontSize:     24,
    fontWeight:   '900',
    marginBottom: 4,
  },
  heroAddress: {
    color:        'rgba(255,255,255,0.75)',
    fontSize:     12,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  heroMetaItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
  },
  heroMetaIcon: { fontSize: 12 },
  heroMetaText: {
    color:      colors.textWhite,
    fontSize:   11,
    fontWeight: '700',
  },
  heroMetaDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroBackBtn: {
    position:        'absolute',
    top:             52,
    left:            16,
    width:           42,
    height:          42,
    borderRadius:    14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    ...shadowMd,
  },
  heroBackBtnText: {
    color:      colors.textDark,
    fontSize:   20,
    fontWeight: '700',
  },
  heroCartBtn: {
    position:        'absolute',
    top:             52,
    right:           16,
    width:           42,
    height:          42,
    borderRadius:    14,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadowGold,
  },
  heroCartIcon: { fontSize: 20 },
  heroCartBadge: {
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
  heroCartBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },

  // ── MENU CATEGORIES ─────────────────────────
  menuCatWrap: {
    backgroundColor:   colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuCatScroll: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    gap:               8,
  },
  menuCatChip: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      borderRadius.round,
    backgroundColor:   colors.inputBackground,
    borderWidth:       1,
    borderColor:       colors.border,
  },
  menuCatChipActive: {
    backgroundColor: colors.cuisineColor,
    borderColor:     colors.cuisineColor,
  },
  menuCatChipText: {
    fontSize:   12,
    color:      colors.textMedium,
    fontWeight: '700',
  },
  menuCatChipTextActive: {
    color:      colors.textWhite,
    fontWeight: '900',
  },
  menuCountRow: {
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor:   colors.cardBackground,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
  },
  menuCountText: {
    color:      colors.textLight,
    fontSize:   12,
    fontWeight: '600',
  },
  viewCartLink: {
    color:      colors.primary,
    fontSize:   12,
    fontWeight: '800',
  },

  // ── MENU LIST ───────────────────────────────
  menuList: {
    padding:       16,
    paddingBottom: 120,
  },
  menuCard: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    marginBottom:    12,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  menuCardInCart: {
    borderColor:     colors.success + '40',
    backgroundColor: colors.successPale + '40',
  },
  menuCardLeft: { flex: 1, marginRight: 14 },
  inCartBadge: {
    backgroundColor:   colors.successPale,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      borderRadius.round,
    alignSelf:         'flex-start',
    marginBottom:      6,
    borderWidth:       1,
    borderColor:       colors.success + '25',
  },
  inCartBadgeText: {
    color:      colors.success,
    fontSize:   10,
    fontWeight: '800',
  },
  menuItemName: {
    fontSize:     15,
    fontWeight:   '800',
    color:        colors.textDark,
    marginBottom: 5,
  },
  menuItemDesc: {
    fontSize:     11,
    color:        colors.textLight,
    lineHeight:   16,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize:   20,
    fontWeight: '900',
    color:      colors.cuisineColor,
  },
  menuItemPriceUnit: {
    fontSize:   12,
    color:      colors.textMuted,
    fontWeight: '400',
  },
  removeFromCartBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    padding:   4,
  },
  removeFromCartText: {
    color:      colors.danger,
    fontSize:   11,
    fontWeight: '700',
  },
  menuCardRight: {
    alignItems: 'center',
    gap:        10,
  },
  menuItemImg: {
    width:        88,
    height:       88,
    borderRadius: borderRadius.large,
  },
  menuItemImgPlaceholder: {
    width:           88,
    height:          88,
    borderRadius:    borderRadius.large,
    backgroundColor: colors.cuisineBg,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.cuisineBorder || colors.border,
  },
  menuItemImgEmoji: { fontSize: 38 },
  addBtn: {
    backgroundColor: colors.cuisineColor,
    width:           88,
    height:          36,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadow,
  },
  addBtnActive:  { backgroundColor: colors.success },
  addBtnText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   16,
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
    color:      'rgba(255,255,255,0.5)',
    fontSize:   10,
    fontWeight: '600',
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