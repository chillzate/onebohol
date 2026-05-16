// ============================================
// ZAVARA SEARCH SCREEN - v1.0
// Unified search across restaurants + products
// Inspired by: GrabFood, Shopee, Airbnb
// ============================================
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Animated,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { API_URL }   from '../config';
import { showToast } from './ToastManager';

// ============================================
// CONSTANTS
// ============================================
const MAX_RECENT    = 8;
const SEARCH_DELAY  = 400; // ms debounce
const STORAGE_KEY   = '@zavara_recent_searches';

const QUICK_CATEGORIES = [
  { id: 'food',    icon: '🍴', label: 'Food',      color: colors.cuisineColor, bg: colors.cuisineBg   },
  { id: 'market',  icon: '🌾', label: 'Market',    color: colors.farmerColor,  bg: colors.farmerBg    },
  { id: 'seafood', icon: '🐟', label: 'Seafood',   color: colors.riderColor,   bg: colors.riderBg     },
  { id: 'rice',    icon: '🌾', label: 'Rice',      color: colors.primary,      bg: colors.primaryPale },
  { id: 'fruits',  icon: '🍌', label: 'Fruits',    color: colors.farmerColor,  bg: colors.farmerBg    },
  { id: 'haven',   icon: '🏨', label: 'Hotels',    color: colors.havenColor,   bg: colors.havenBg     },
];

const TRENDING = [
  '🔥 Lechon',
  '🔥 Fresh Seafood',
  '🔥 Local Rice',
  '🔥 Calamay',
  '🔥 Bohol BBQ',
];

const CATEGORY_EMOJI = {
  seafood:    '🐟',
  vegetables: '🥦',
  rice:       '🌾',
  fruits:     '🍌',
  livestock:  '🐄',
  other:      '🌿',
};

// ============================================
// RESTAURANT RESULT CARD
// ============================================
function RestaurantResult({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={onPress}
      activeOpacity={0.85}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.resultImagePlaceholder,
          { backgroundColor: colors.cuisineBg }]}>
          <Text style={{ fontSize: 28 }}>🍴</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <View style={styles.resultTopRow}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.resultTypeBadge}>
            <Text style={[styles.resultTypeBadgeText,
              { color: colors.cuisineColor }]}>
              🍴 Food
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.resultDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>
            📍 {item.address || 'Bohol'}
          </Text>
          <Text style={styles.resultMetaDot}>·</Text>
          <Text style={styles.resultMetaText}>
            ⭐ {item.rating || 'New'}
          </Text>
          <Text style={styles.resultMetaDot}>·</Text>
          <Text style={styles.resultMetaText}>
            🛵 ₱{item.delivery_fee || 50}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// PRODUCT RESULT CARD
// ============================================
function ProductResult({ item, onPress }) {
  const emoji =
    CATEGORY_EMOJI[item.category?.toLowerCase()] || '🌴';

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={onPress}
      activeOpacity={0.85}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.resultImagePlaceholder,
          { backgroundColor: colors.farmerBg }]}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <View style={styles.resultTopRow}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.resultTypeBadge,
            { backgroundColor: colors.farmerBg }]}>
            <Text style={[styles.resultTypeBadgeText,
              { color: colors.farmerColor }]}>
              🌾 Market
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.resultDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.resultMeta}>
          <Text style={[styles.resultMetaText,
            { color: colors.primary, fontWeight: '900' }]}>
            ₱{item.price}/{item.unit}
          </Text>
          <Text style={styles.resultMetaDot}>·</Text>
          <Text style={styles.resultMetaText}>
            📦 {item.quantity} left
          </Text>
          {item.rating > 0 && (
            <>
              <Text style={styles.resultMetaDot}>·</Text>
              <Text style={styles.resultMetaText}>
                ⭐ {Number(item.rating).toFixed(1)}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// MAIN SEARCH SCREEN
// ============================================
export default function SearchScreen({
  userId,
  onBack,
  onSelectRestaurant,
  onSelectProduct,
}) {
  const [searchText, setSearchText]       = useState('');
  const [searching, setSearching]         = useState(false);
  const [restaurants, setRestaurants]     = useState([]);
  const [products, setProducts]           = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [hasSearched, setHasSearched]     = useState(false);

  const searchInputRef = useRef(null);
  const debounceRef    = useRef(null);
  const fadeAnim       = useRef(new Animated.Value(0)).current;

  // ── LOAD RECENT SEARCHES ─────────────────────
  useEffect(() => {
    loadRecentSearches();
    // Auto focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveRecentSearch = useCallback(async (term) => {
    try {
      const trimmed = term.trim();
      if (!trimmed || trimmed.length < 2) return;

      let updated = [
        trimmed,
        ...recentSearches.filter(
          s => s.toLowerCase() !== trimmed.toLowerCase()
        ),
      ].slice(0, MAX_RECENT);

      setRecentSearches(updated);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch {}
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    showToast('info', 'Cleared',
      'Search history cleared');
  }, []);

  // ── SEARCH FUNCTION ──────────────────────────
  const performSearch = useCallback(async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRestaurants([]);
      setProducts([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      // Search restaurants and products in parallel
      const [restaurantRes, productRes] =
        await Promise.allSettled([
          axios.get(
            `${API_URL}/restaurants`,
            { timeout: 8000 }
          ),
          axios.get(
            `${API_URL}/products?user_id=${userId}`,
            { timeout: 8000 }
          ),
        ]);

      // Filter restaurants locally
      const allRestaurants =
        restaurantRes.status === 'fulfilled'
          ? restaurantRes.value.data || []
          : [];
      const filteredRestaurants =
        allRestaurants.filter(r =>
          r.name?.toLowerCase().includes(
            trimmed.toLowerCase()
          ) ||
          r.description?.toLowerCase().includes(
            trimmed.toLowerCase()
          ) ||
          r.category?.toLowerCase().includes(
            trimmed.toLowerCase()
          )
        );

      // Filter products locally
      const allProducts =
        productRes.status === 'fulfilled'
          ? productRes.value.data || []
          : [];
      const filteredProducts = allProducts.filter(p =>
        p.name?.toLowerCase().includes(
          trimmed.toLowerCase()
        ) ||
        p.description?.toLowerCase().includes(
          trimmed.toLowerCase()
        ) ||
        p.category?.toLowerCase().includes(
          trimmed.toLowerCase()
        )
      );

      setRestaurants(filteredRestaurants);
      setProducts(filteredProducts);

      // Save to recent
      saveRecentSearch(trimmed);

    } catch {
      setRestaurants([]);
      setProducts([]);
    } finally {
      setSearching(false);
    }
  }, [userId, saveRecentSearch]);

  // ── DEBOUNCED SEARCH ─────────────────────────
  const handleSearchChange = useCallback((text) => {
    setSearchText(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 2) {
      setRestaurants([]);
      setProducts([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(text);
    }, SEARCH_DELAY);
  }, [performSearch]);

  // ── QUICK CATEGORY SEARCH ────────────────────
  const handleCategorySearch = useCallback((category) => {
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    setSearchText(category.label);
    performSearch(category.label);
  }, [performSearch]);

  // ── TRENDING SEARCH ──────────────────────────
  const handleTrendingSearch = useCallback((term) => {
    const cleanTerm = term.replace('🔥 ', '');
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    setSearchText(cleanTerm);
    performSearch(cleanTerm);
  }, [performSearch]);

  // ── RECENT SEARCH TAP ───────────────────────
  const handleRecentSearch = useCallback((term) => {
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    setSearchText(term);
    performSearch(term);
  }, [performSearch]);

  // ── TOTAL RESULTS ────────────────────────────
  const totalResults = useMemo(() =>
    restaurants.length + products.length,
    [restaurants, products]
  );

  // ── BUILD RESULTS LIST ───────────────────────
  const results = useMemo(() => {
    const list = [];

    if (restaurants.length > 0) {
      list.push({
        type:  'section',
        id:    'restaurants_header',
        title: `🍴 Restaurants (${restaurants.length})`,
      });
      restaurants.forEach(r =>
        list.push({
          type: 'restaurant',
          id:   `r_${r.id}`,
          data: r,
        })
      );
    }

    if (products.length > 0) {
      list.push({
        type:  'section',
        id:    'products_header',
        title: `🌾 Products (${products.length})`,
      });
      products.forEach(p =>
        list.push({
          type: 'product',
          id:   `p_${p.id}`,
          data: p,
        })
      );
    }

    return list;
  }, [restaurants, products]);

  // ── RENDER RESULT ITEM ───────────────────────
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'section') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>
            {item.title}
          </Text>
        </View>
      );
    }

    if (item.type === 'restaurant') {
      return (
        <RestaurantResult
          item={item.data}
          onPress={() => {
            Keyboard.dismiss();
            Haptics.impactAsync(
              Haptics.ImpactFeedbackStyle.Medium
            ).catch(() => {});
            onSelectRestaurant?.(item.data);
          }}
        />
      );
    }

    if (item.type === 'product') {
      return (
        <ProductResult
          item={item.data}
          onPress={() => {
            Keyboard.dismiss();
            Haptics.impactAsync(
              Haptics.ImpactFeedbackStyle.Medium
            ).catch(() => {});
            onSelectProduct?.(item.data);
          }}
        />
      );
    }

    return null;
  }, [onSelectRestaurant, onSelectProduct]);

  const keyExtractor = useCallback(
    (item) => item.id, []
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <Animated.View style={[styles.container,
      { opacity: fadeAnim }]}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* SEARCH HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Keyboard.dismiss();
            onBack();
          }}
          activeOpacity={0.8}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search food, products, restaurants..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() =>
              performSearch(searchText)
            }
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setRestaurants([]);
                setProducts([]);
                setHasSearched(false);
                searchInputRef.current?.focus();
              }}
              style={styles.clearBtn}
              activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SEARCHING INDICATOR */}
      {searching && (
        <View style={styles.searchingBar}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
          <Text style={styles.searchingText}>
            Searching...
          </Text>
        </View>
      )}

      {/* CONTENT */}
      {!hasSearched && !searching ? (
        // ── DISCOVERY MODE ────────────────────────
        <FlatList
          data={[]}
          renderItem={null}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.discoveryContent}>

              {/* RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <View style={styles.discoverySection}>
                  <View style={styles.discoverySectionHeader}>
                    <Text style={styles.discoverySectionTitle}>
                      RECENT SEARCHES
                    </Text>
                    <TouchableOpacity
                      onPress={clearRecentSearches}
                      activeOpacity={0.8}>
                      <Text style={styles.discoveryClear}>
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipsWrap}>
                    {recentSearches.map((term, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.recentChip}
                        onPress={() =>
                          handleRecentSearch(term)
                        }
                        activeOpacity={0.85}>
                        <Text style={styles.recentChipIcon}>
                          🕐
                        </Text>
                        <Text style={styles.recentChipText}>
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* QUICK CATEGORIES */}
              <View style={styles.discoverySection}>
                <Text style={styles.discoverySectionTitle}>
                  BROWSE BY CATEGORY
                </Text>
                <View style={styles.categoriesGrid}>
                  {QUICK_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.categoryCard}
                      onPress={() =>
                        handleCategorySearch(cat)
                      }
                      activeOpacity={0.85}>
                      <View style={[styles.categoryIconWrap,
                        { backgroundColor: cat.bg }]}>
                        <Text style={styles.categoryIcon}>
                          {cat.icon}
                        </Text>
                      </View>
                      <Text style={[styles.categoryLabel,
                        { color: cat.color }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* TRENDING */}
              <View style={styles.discoverySection}>
                <Text style={styles.discoverySectionTitle}>
                  TRENDING IN BOHOL
                </Text>
                <View style={styles.chipsWrap}>
                  {TRENDING.map((term, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.trendingChip}
                      onPress={() =>
                        handleTrendingSearch(term)
                      }
                      activeOpacity={0.85}>
                      <Text style={styles.trendingChipText}>
                        {term}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ZAVARA FOOTER */}
              <View style={styles.discoveryFooter}>
                <Text style={styles.discoveryFooterBrand}>
                  ZAVARA
                </Text>
                <Text style={styles.discoveryFooterText}>
                  Search across all of Bohol 🌴
                </Text>
              </View>

            </View>
          }
        />
      ) : hasSearched && !searching && totalResults === 0 ? (
        // ── NO RESULTS ────────────────────────────
        <View style={styles.noResultsWrap}>
          <Text style={styles.noResultsEmoji}>🔍</Text>
          <Text style={styles.noResultsTitle}>
            No results found
          </Text>
          <Text style={styles.noResultsSub}>
            No matches for "{searchText}"{'\n'}
            Try a different keyword
          </Text>
          <TouchableOpacity
            style={styles.noResultsBtn}
            onPress={() => {
              setSearchText('');
              setHasSearched(false);
              searchInputRef.current?.focus();
            }}
            activeOpacity={0.85}>
            <Text style={styles.noResultsBtnText}>
              Clear Search
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── SEARCH RESULTS ────────────────────────
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            totalResults > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsHeaderText}>
                  {totalResults} result
                  {totalResults !== 1 ? 's' : ''}
                  {' '}for "{searchText}"
                </Text>
              </View>
            ) : null
          }
        />
      )}

    </Animated.View>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  backBtn: {
    width: 38, height: 38,
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
  searchBarWrap: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    padding: 0,
  },
  clearBtn: { padding: 4 },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── SEARCHING BAR ───────────────────────────
  searchingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    backgroundColor: colors.primaryPale,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGold,
  },
  searchingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── DISCOVERY ───────────────────────────────
  discoveryContent: {
    padding: 20,
    gap: 24,
  },
  discoverySection: {
    gap: 12,
  },
  discoverySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discoverySectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  discoveryClear: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  // ── RECENT CHIPS ────────────────────────────
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  recentChipIcon: { fontSize: 12 },
  recentChipText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── CATEGORIES GRID ─────────────────────────
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    ...shadow,
  },
  categoryIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon:  { fontSize: 22 },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── TRENDING CHIPS ──────────────────────────
  trendingChip: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  trendingChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── DISCOVERY FOOTER ────────────────────────
  discoveryFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  discoveryFooterBrand: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 5,
  },
  discoveryFooterText: {
    color: colors.textMuted,
    fontSize: 11,
  },

  // ── NO RESULTS ──────────────────────────────
  noResultsWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  noResultsEmoji: { fontSize: 60, marginBottom: 8 },
  noResultsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  noResultsBtn: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginTop: 8,
  },
  noResultsBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },

  // ── RESULTS ─────────────────────────────────
  resultsList: {
    padding: 16,
    paddingBottom: 40,
  },
  resultsHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsHeaderText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ── RESULT CARD ─────────────────────────────
  resultCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  resultImage: {
    width: 64, height: 64,
    borderRadius: 16,
  },
  resultImagePlaceholder: {
    width: 64, height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1 },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    flex: 1,
  },
  resultTypeBadge: {
    backgroundColor: colors.cuisineBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  resultTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  resultDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 6,
    lineHeight: 16,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resultMetaText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  resultMetaDot: {
    color: colors.border,
    fontSize: 8,
  },
});