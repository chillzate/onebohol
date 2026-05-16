// ============================================
// ZAVARA FOOD SCREEN - COMPLETE FIXED v2.1
// ============================================
import { useEffect, useState, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowStrong,
  shadowGold,
  borderRadius,
} from '../theme';
import CartScreen from './CartScreen';
import { API_URL } from '../config'; // 🔧 FIX: from config

const { width } = Dimensions.get('window');

export default function FoodScreen({ userId, onBack }) {

  // ── STATES ──────────────────────────────────
  const [restaurants, setRestaurants]           = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [menuLoading, setMenuLoading]           = useState(false);
  const [refreshing, setRefreshing]             = useState(false); // 🆕
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMenuCat, setSelectedMenuCat]   = useState('All');
  const [cart, setCart]                         = useState([]);
  const [showCart, setShowCart]                 = useState(false);
  const [searchText, setSearchText]             = useState('');
  const [searchFocused, setSearchFocused]       = useState(false);
  const [restaurantRatings, setRestaurantRatings] = useState({});

  // ── ANIMATIONS ──────────────────────────────
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const cartBounce  = useRef(new Animated.Value(1)).current;

  const categories = [
    'All', 'Fast Food', 'Carinderia',
    'Pizza', 'Cafe', 'Seafood', 'BBQ',
  ];

  // ── STARTUP ─────────────────────────────────
  useEffect(() => {
    fetchRestaurants();
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Cart bounce animation
  useEffect(() => {
    if (cart.length > 0) {
      Animated.sequence([
        Animated.spring(cartBounce, {
          toValue: 1.3,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(cartBounce, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cart.length]);

  // ── FETCH RESTAURANTS ───────────────────────
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/restaurants`,
        { timeout: 10000 }
      );
      const data = response.data;
      setRestaurants(data);

      // 🔧 FIX: Fetch ratings for ALL restaurants at once
      fetchAllRatings(data);
    } catch {
      setRestaurants([]);
    }
    setLoading(false);
  };

  // 🆕 Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  }, []);

  // 🔧 FIX: Fetch ratings for all restaurants
  const fetchAllRatings = async (restaurantList) => {
    const ratingMap = {};
    await Promise.allSettled(
      restaurantList.map(async (r) => {
        try {
          const res = await axios.get(
            `${API_URL}/reviews/restaurant/${r.id}`,
            { timeout: 5000 }
          );
          ratingMap[r.id] = {
            avg: res.data.average_rating || 0,
            total: res.data.total_reviews || 0,
          };
        } catch {
          ratingMap[r.id] = { avg: 0, total: 0 };
        }
      })
    );
    setRestaurantRatings(ratingMap);
  };

  // Fetch ratings for a single restaurant
  const fetchRatings = async (restaurantId) => {
    try {
      const res = await axios.get(
        `${API_URL}/reviews/restaurant/${restaurantId}`,
        { timeout: 5000 }
      );
      setRestaurantRatings(prev => ({
        ...prev,
        [restaurantId]: {
          avg: res.data.average_rating || 0,
          total: res.data.total_reviews || 0,
        }
      }));
    } catch {}
  };

  // ── FETCH MENU ──────────────────────────────
  const fetchMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedMenuCat('All');
    setMenuLoading(true);
    fetchRatings(restaurant.id);
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${restaurant.id}/menu`,
        { timeout: 10000 }
      );
      setMenuItems(response.data);
    } catch {
      setMenuItems([]);
    }
    setMenuLoading(false);
  };

  // ── CART FUNCTIONS ──────────────────────────
  // 🔧 FIX: addToCart now includes order_type and menu_item_id
  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c =>
        c.id === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        ...item,
        quantity: 1,
        order_type: 'food',        // 🔑 Critical!
        menu_item_id: item.id,     // 🔑 Critical!
        restaurant_name: selectedRestaurant?.name,
        restaurant_id: selectedRestaurant?.id,
      }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartCount = cart.reduce(
    (sum, i) => sum + i.quantity, 0
  );
  const cartTotal = cart.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  );

  // ── FILTER LOGIC ────────────────────────────
  const filteredRestaurants = restaurants.filter(r => {
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
  });

  const filteredMenu = selectedMenuCat === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === selectedMenuCat);

  const menuCategories = [
    'All',
    ...new Set(
      menuItems
        .map(i => i.category)
        .filter(Boolean)
    ),
  ];

  // Helper for display rating
  const getDisplayRating = (id) => {
    const r = restaurantRatings[id];
    if (r && r.avg > 0) return r.avg.toFixed(1);
    return 'New';
  };

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
          // 🔧 FIX: correct prop name
          setShowCart(false);
          setSelectedRestaurant(null);
          setCart([]);
        }}
      />
    );
  }

  // ============================================
  // MENU SCREEN
  // ============================================
  if (selectedRestaurant) {
    const rating = restaurantRatings[selectedRestaurant.id];

    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />

        {/* RESTAURANT HERO */}
        <View style={styles.heroWrap}>
          {selectedRestaurant.image_url ? (
            <Image
              source={{ uri: selectedRestaurant.image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderEmoji}>
                🍔
              </Text>
            </View>
          )}

          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  ● OPEN NOW
                </Text>
              </View>
              <View style={[styles.heroBadge, {
                backgroundColor: 'rgba(255,255,255,0.15)'
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
                  {getDisplayRating(selectedRestaurant.id)}
                  {rating?.total > 0
                    ? ` (${rating.total})`
                    : ''}
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

          {/* BACK */}
          <TouchableOpacity
            style={styles.heroBackBtn}
            onPress={() => setSelectedRestaurant(null)}>
            <Text style={styles.heroBackBtnText}>←</Text>
          </TouchableOpacity>

          {/* CART */}
          <TouchableOpacity
            style={styles.heroCartBtn}
            onPress={() => setShowCart(true)}>
            <Animated.Text style={[
              styles.heroCartIcon,
              { transform: [{ scale: cartBounce }] },
            ]}>
              🛒
            </Animated.Text>
            {cartCount > 0 && (
              <View style={styles.heroCartBadge}>
                <Text style={styles.heroCartBadgeText}>
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* MENU CATEGORIES */}
        <View style={styles.menuCatWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuCatScroll}>
            {menuCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.menuCatChip,
                  selectedMenuCat === cat &&
                  styles.menuCatChipActive,
                ]}
                onPress={() => setSelectedMenuCat(cat)}>
                <Text style={[
                  styles.menuCatChipText,
                  selectedMenuCat === cat &&
                  styles.menuCatChipTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* MENU COUNT */}
        <View style={styles.menuCountRow}>
          <Text style={styles.menuCountText}>
            {filteredMenu.length} items available
          </Text>
          {cart.length > 0 && (
            <TouchableOpacity onPress={() =>
              setShowCart(true)}>
              <Text style={styles.viewCartLink}>
                View Cart ({cartCount}) →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MENU ITEMS */}
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
          <FlatList
            data={filteredMenu}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyTitle}>
                  No items available
                </Text>
                <Text style={styles.emptySub}>
                  Check back soon!
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const inCart = cart.find(
                c => c.id === item.id
              );
              return (
                <View style={[
                  styles.menuCard,
                  inCart && styles.menuCardInCart,
                ]}>
                  <View style={styles.menuCardLeft}>
                    {/* IN CART BADGE */}
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

                    {/* 🆕 Remove from cart button */}
                    {inCart && (
                      <TouchableOpacity
                        onPress={() =>
                          removeFromCart(item.id)
                        }
                        style={styles.removeFromCartBtn}>
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
                      <View style={
                        styles.menuItemImgPlaceholder
                      }>
                        <Text style={
                          styles.menuItemImgEmoji
                        }>
                          🍽️
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.addBtn,
                        inCart && styles.addBtnActive,
                      ]}
                      onPress={() => addToCart(item)}>
                      <Text style={styles.addBtnText}>
                        {inCart
                          ? `+${inCart.quantity}`
                          : '+'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* FLOATING CART */}
        {cartCount > 0 && (
          <TouchableOpacity
            style={styles.floatingCart}
            onPress={() => setShowCart(true)}>
            <View style={styles.floatingCartLeft}>
              <Animated.View style={[
                styles.floatingCartBadge,
                { transform: [{ scale: cartBounce }] },
              ]}>
                <Text style={styles.floatingCartBadgeText}>
                  {cartCount}
                </Text>
              </Animated.View>
              <Text style={styles.floatingCartLabel}>
                View Cart
              </Text>
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
        )}

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

      {/* HEADER */}
      <Animated.View style={[
        styles.header,
        { opacity: headerAnim },
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerBrand}>ZAVARA</Text>
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => setShowCart(true)}>
            <Animated.Text style={[
              styles.headerCartIcon,
              { transform: [{ scale: cartBounce }] },
            ]}>
              🛒
            </Animated.Text>
            {cartCount > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>
                  {cartCount}
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

      {/* SEARCH BAR */}
      <View style={styles.searchWrap}>
        <View style={[
          styles.searchBar,
          searchFocused && styles.searchBarFocused,
        ]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORIES */}
      <View style={styles.catWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat &&
                styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[
                styles.catChipText,
                selectedCategory === cat &&
                styles.catChipTextActive,
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* RESULTS COUNT */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredRestaurants.length} restaurants
          </Text>
          {searchText.length > 0 && (
            <Text style={styles.resultsSearch}>
              for "{searchText}"
            </Text>
          )}
        </View>
      )}

      {/* RESTAURANT LIST */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="large"
            color={colors.cuisineColor}
          />
          <Text style={styles.loadingText}>
            Finding restaurants...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.restaurantList}
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
              <Text style={styles.emptyIcon}>🍔</Text>
              <Text style={styles.emptyTitle}>
                No restaurants found
              </Text>
              <Text style={styles.emptySub}>
                {searchText
                  ? `No results for "${searchText}"`
                  : 'No restaurants open right now'}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => {
                  setSearchText('');
                  setSelectedCategory('All');
                }}>
                <Text style={styles.emptyBtnText}>
                  Clear Filters
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const rating = restaurantRatings[item.id];
            return (
              <TouchableOpacity
                style={styles.restaurantCard}
                onPress={() => fetchMenu(item)}
                activeOpacity={0.92}>

                {/* IMAGE */}
                <View style={styles.restaurantImgWrap}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.restaurantImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={
                      styles.restaurantImgPlaceholder
                    }>
                      <Text style={
                        styles.restaurantImgEmoji
                      }>
                        🍔
                      </Text>
                    </View>
                  )}
                  <View style={styles.imgBadges}>
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>
                        ● Open
                      </Text>
                    </View>
                  </View>
                  <View style={styles.catTag}>
                    <Text style={styles.catTagText}>
                      {item.category}
                    </Text>
                  </View>
                </View>

                {/* INFO */}
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantNameRow}>
                    <Text
                      style={styles.restaurantName}
                      numberOfLines={1}>
                      {item.name}
                    </Text>

                    {/* 🔧 FIX: Real ratings */}
                    <View style={styles.ratingWrap}>
                      <Text style={styles.ratingStar}>
                        ⭐
                      </Text>
                      <Text style={styles.ratingText}>
                        {rating?.avg > 0
                          ? rating.avg.toFixed(1)
                          : 'New'}
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
                    <View style={
                      styles.restaurantMetaDivider
                    } />
                    <View style={styles.restaurantMetaItem}>
                      <Text style={styles.restaurantMetaText}>
                        💰 ₱{item.delivery_fee}
                      </Text>
                    </View>
                    <View style={
                      styles.restaurantMetaDivider
                    } />
                    <View style={styles.restaurantMetaItem}>
                      <Text style={styles.restaurantMetaText}>
                        ⏱️ 30-45 min
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.restaurantOrderBtn}
                    onPress={() => fetchMenu(item)}>
                    <Text style={
                      styles.restaurantOrderBtnText
                    }>
                      View Menu →
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  headerBrand: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    position: 'relative',
  },
  headerCartIcon: { fontSize: 18 },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBackground,
  },
  headerCartBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 26,
    fontWeight: '900',
  },
  headerSub: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },

  // ── SEARCH ──────────────────────────────────
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchBarFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    padding: 0,
  },
  searchClear: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // ── CATEGORIES ──────────────────────────────
  catWrap: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.cuisineColor,
    borderColor: colors.cuisineColor,
  },
  catChipText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '700',
  },
  catChipTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },

  // ── RESULTS ─────────────────────────────────
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  resultsText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  resultsSearch: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── LOADING ─────────────────────────────────
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

  // ── EMPTY ───────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  emptyBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },

  // ── RESTAURANT LIST ─────────────────────────
  restaurantList: {
    padding: 16,
    paddingBottom: 30,
  },
  restaurantCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  restaurantImgWrap: {
    position: 'relative',
    height: 170,
  },
  restaurantImg: {
    width: '100%',
    height: '100%',
  },
  restaurantImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cuisineBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantImgEmoji: { fontSize: 55 },
  imgBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  openBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  openBadgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '900',
  },
  catTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  catTagText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  restaurantInfo: { padding: 16 },
  restaurantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    flex: 1,
    marginRight: 10,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    gap: 3,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  ratingStar: { fontSize: 11 },
  ratingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  ratingCount: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  restaurantDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 6,
    lineHeight: 18,
  },
  restaurantAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.medium,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restaurantMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  restaurantMetaText: {
    fontSize: 11,
    color: colors.textMedium,
    fontWeight: '600',
  },
  restaurantMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  restaurantOrderBtn: {
    backgroundColor: colors.cuisineColor,
    paddingVertical: 12,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    ...shadow,
  },
  restaurantOrderBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── HERO ────────────────────────────────────
  heroWrap: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cuisineBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: { fontSize: 70 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  heroBadgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
  },
  heroName: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroAddress: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  heroMetaIcon: { fontSize: 12 },
  heroMetaText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  heroMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroBackBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowMd,
  },
  heroBackBtnText: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: '700',
  },
  heroCartBtn: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  heroCartIcon: { fontSize: 20 },
  heroCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBackground,
  },
  heroCartBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },

  // ── MENU CATEGORIES ─────────────────────────
  menuCatWrap: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuCatScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  menuCatChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuCatChipActive: {
    backgroundColor: colors.cuisineColor,
    borderColor: colors.cuisineColor,
  },
  menuCatChipText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '700',
  },
  menuCatChipTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },
  menuCountRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCountText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  // 🆕 View cart link in menu header
  viewCartLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  menuList: {
    padding: 16,
    paddingBottom: 120,
  },

  // ── MENU CARD ───────────────────────────────
  menuCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  // 🆕 Highlight when in cart
  menuCardInCart: {
    borderColor: colors.success + '40',
    backgroundColor: colors.successPale + '60',
  },
  menuCardLeft: {
    flex: 1,
    marginRight: 14,
  },
  inCartBadge: {
    backgroundColor: colors.successPale,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.success + '25',
  },
  inCartBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 5,
  },
  menuItemDesc: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.cuisineColor,
  },
  menuItemPriceUnit: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  // 🆕 Remove from cart button
  removeFromCartBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  removeFromCartText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  menuCardRight: {
    alignItems: 'center',
    gap: 10,
  },
  menuItemImg: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.large,
  },
  menuItemImgPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.large,
    backgroundColor: colors.cuisineBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cuisineBorder,
  },
  menuItemImgEmoji: { fontSize: 38 },
  addBtn: {
    backgroundColor: colors.cuisineColor,
    width: 88,
    height: 36,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  addBtnActive: {
    backgroundColor: colors.success,
  },
  addBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 16,
  },

  // ── FLOATING CART ───────────────────────────
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xxlarge,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowStrong,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartBadge: {
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  floatingCartBadgeText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 15,
  },
  floatingCartLabel: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCartTotal: {
    color: colors.primaryLight,
    fontWeight: '900',
    fontSize: 18,
  },
  floatingCartArrow: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
});