// ============================================
// screens/HomeScreen.js
// ZAVARA v3.0 - World Class Home
// Inspired by: Grab, Gojek, Airbnb, Shopee
// Improvements:
// 1. Entrance fade + stagger animation
// 2. Auto-scroll promo cards with dots
// 3. Notification bell badge
// 4. Search bar pulse animation
// 5. Service tile scale press feedback
// 6. Pull to refresh
// 7. Section stagger on mount
// 8. Header elevation on scroll
// ============================================
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  StyleSheet,
  Animated,
  RefreshControl,
} from 'react-native';
import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useAppContext }  from '../context/AppContext';
import { useAuth }        from '../hooks/useAuth';
import BottomNav          from '../components/BottomNav';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';

// ============================================
// HELPERS
// ============================================
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '🌤️';
  if (h < 21) return '🌅';
  return '🌙';
}

// ============================================
// PROMO CARDS DATA
// ============================================
const PROMO_CARDS = [
  {
    bg:     colors.coralPale,
    border: colors.coral + '20',
    tag:    { text: '✦ LIMITED',     color: colors.coral        },
    title:  { text: 'FIRST ORDER',   color: colors.textDark     },
    desc:   '50% off your first\nmeal delivery',
    emoji:  '🍔',
    cta:    { text: 'Order →',  bg: colors.coral                },
    screen: 'restaurants',
  },
  {
    bg:     colors.farmerBg,
    border: colors.farmerColor + '20',
    tag:    { text: '✦ FRESH DAILY', color: colors.farmerColor  },
    title:  { text: 'FARM TO TABLE', color: colors.textDark     },
    desc:   'Direct from local\nBohol producers',
    emoji:  '🌾',
    cta:    { text: 'Shop →',   bg: colors.farmerColor          },
    screen: 'market',
  },
  {
    bg:     colors.riderBg,
    border: colors.riderColor + '20',
    tag:    { text: '✦ COMING SOON', color: colors.riderColor   },
    title:  { text: 'SWIFT RIDES',   color: colors.textDark     },
    desc:   'Book a ride\nanywhere in Bohol',
    emoji:  '🏍️',
    cta:    { text: 'Soon →',   bg: colors.riderColor           },
    screen: null,
  },
];

// ============================================
// SUB COMPONENT: Pressable Service Tile Large
// ============================================
function ServiceTileLarge({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue:         0.95,
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
      styles.serviceTileLarge,
      { transform: [{ scale: scaleAnim }] },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}>
        <View style={[styles.serviceIconWrap,
          { backgroundColor: item.iconBg }]}>
          <Text style={styles.serviceIcon}>
            {item.icon}
          </Text>
        </View>
        <Text style={styles.serviceTitle}>
          {item.title}
        </Text>
        <Text style={styles.serviceDesc}>
          {item.desc}
        </Text>
        {item.live && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>
              ● LIVE
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Pressable Service Tile Small
// ============================================
function ServiceTileSmall({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue:         0.95,
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
      styles.serviceTileSmall,
      { transform: [{ scale: scaleAnim }] },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.serviceTileSmallInner}>
        <Text style={styles.serviceTileSmIcon}>
          {item.icon}
        </Text>
        <View>
          <Text style={styles.serviceTileSmTitle}>
            {item.title}
          </Text>
          <Text style={styles.serviceTileSmDesc}>
            {item.desc}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SUB COMPONENT: Animated Section
// ============================================
function AnimatedSection({ children, delay = 0 }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      opacity:   fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}>
      {children}
    </Animated.View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomeScreen() {
  const {
    setScreen,
    loggedInUser,
    userRole,
    profileImage,
    cartCount,
    roleData,
  } = useAppContext();

  // ── STATE ──────────────────────────────────
  const [activePromo,   setActivePromo]   = useState(0);
  const [refreshing,    setRefreshing]    = useState(false);
  const [notifCount,    setNotifCount]    = useState(2);
  const [headerElevated, setHeaderElevated] = useState(false);

  // ── ANIMATION REFS ────────────────────────
  const headerFade    = useRef(new Animated.Value(0)).current;
  const greetingSlide = useRef(new Animated.Value(-20)).current;
  const searchPulse   = useRef(new Animated.Value(1)).current;
  const promoScrollRef = useRef(null);
  const autoScrollRef  = useRef(null);

  // ── ENTRANCE ANIMATION ────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue:         1,
        duration:        500,
        useNativeDriver: true,
      }),
      Animated.spring(greetingSlide, {
        toValue:         0,
        friction:        8,
        tension:         50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── SEARCH PULSE ──────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulse, {
          toValue:         1.01,
          duration:        1500,
          useNativeDriver: true,
        }),
        Animated.timing(searchPulse, {
          toValue:         1,
          duration:        1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── AUTO SCROLL PROMO ─────────────────────
  useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      setActivePromo(prev => {
        const next = (prev + 1) % PROMO_CARDS.length;
        promoScrollRef.current?.scrollTo({
          x:        next * 274,
          animated: true,
        });
        return next;
      });
    }, 3000);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, []);

  // ── PULL TO REFRESH ───────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // ── SCROLL HANDLER ────────────────────────
  const onScroll = useCallback((e) => {
    const y = e.nativeEvent.contentOffset.y;
    setHeaderElevated(y > 10);
  }, []);

  // ── PROMO SCROLL SYNC ─────────────────────
  const onPromoScroll = useCallback((e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / 274
    );
    setActivePromo(index);
    // Reset timer on manual swipe
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    autoScrollRef.current = setInterval(() => {
      setActivePromo(prev => {
        const next = (prev + 1) % PROMO_CARDS.length;
        promoScrollRef.current?.scrollTo({
          x:        next * 274,
          animated: true,
        });
        return next;
      });
    }, 3000);
  }, []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* ══ HEADER ════════════════════════════ */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerFade,
          elevation: headerElevated ? 8 : 2,
          shadowOpacity: headerElevated ? 0.12 : 0.04,
        },
      ]}>
        {/* Brand + Greeting */}
        <Animated.View style={{
          transform: [{ translateY: greetingSlide }],
        }}>
          <Text style={styles.brand}>ZAVARA</Text>
          <Text style={styles.welcome}>
            {getGreeting()}, {loggedInUser}{' '}
            {getGreetingEmoji()}
          </Text>
        </Animated.View>

        {/* Header Right */}
        <View style={styles.headerRight}>
          {/* Cart */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => setScreen('cart')}>
              <Text style={styles.notifIcon}>🛒</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Notification Bell with Badge */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              setScreen('orders');
              setNotifCount(0);
            }}>
            <Text style={styles.notifIcon}>🔔</Text>
            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {notifCount > 9 ? '9+' : notifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => setScreen('profile')}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarText}>
                {loggedInUser?.charAt(0)?.toUpperCase()
                  || '?'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ══ SEARCH BAR ════════════════════════ */}
      <Animated.View style={[
        styles.searchWrap,
        { transform: [{ scale: searchPulse }] },
      ]}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => setScreen('search')}
          activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search food, products, services...
          </Text>
          <View style={styles.searchFilter}>
            <Text style={styles.searchFilterText}>
              Filter
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ══ SCROLL CONTENT ════════════════════ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>

        {/* Role banner */}
        {userRole !== 'regular' && (
          <AnimatedSection delay={100}>
            <View style={[styles.roleBanner, {
              borderColor:     roleData.color + '20',
              backgroundColor: roleData.bg,
            }]}>
              <Text style={[styles.roleBannerText,
                { color: roleData.color }]}>
                {roleData.banner}
              </Text>
            </View>
          </AnimatedSection>
        )}

        {/* ── FEATURED ────────────────────── */}
        <AnimatedSection delay={150}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              FEATURED
            </Text>
            <Text style={styles.sectionSub}>
              Exclusive deals
            </Text>
          </View>

          <ScrollView
            ref={promoScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            decelerationRate="fast"
            snapToInterval={274}
            onMomentumScrollEnd={onPromoScroll}>
            {PROMO_CARDS.map((card, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.promoCard, {
                  backgroundColor: card.bg,
                  borderColor:     card.border,
                }]}
                onPress={card.screen
                  ? () => setScreen(card.screen)
                  : undefined}
                activeOpacity={0.9}>
                <View style={styles.promoCardInner}>
                  <Text style={[styles.promoTag,
                    { color: card.tag.color }]}>
                    {card.tag.text}
                  </Text>
                  <Text style={[styles.promoTitle,
                    { color: card.title.color }]}>
                    {card.title.text}
                  </Text>
                  <Text style={styles.promoDesc}>
                    {card.desc}
                  </Text>
                </View>
                <View style={styles.promoCardRight}>
                  <Text style={styles.promoEmoji}>
                    {card.emoji}
                  </Text>
                  <View style={[styles.promoCTA,
                    { backgroundColor: card.cta.bg }]}>
                    <Text style={styles.promoCTAText}>
                      {card.cta.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Promo Dot Indicators */}
          <View style={styles.promoDots}>
            {PROMO_CARDS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  promoScrollRef.current?.scrollTo({
                    x:        i * 274,
                    animated: true,
                  });
                  setActivePromo(i);
                }}>
                <View style={[
                  styles.promoDot,
                  i === activePromo && styles.promoDotActive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedSection>

        {/* ── SERVICES ────────────────────── */}
        <AnimatedSection delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              SERVICES
            </Text>
            <Text style={styles.sectionSub}>
              What do you need today?
            </Text>
          </View>

          <View style={styles.servicesRow}>
            {[
              {
                screen: 'restaurants',
                iconBg: colors.cuisineBg,
                icon:   '🍴',
                title:  'Cuisine',
                desc:   'Order & Delivery',
                live:   true,
              },
              {
                screen: 'market',
                iconBg: colors.farmerBg,
                icon:   '🛒',
                title:  'Market',
                desc:   'Fresh products',
                live:   true,
              },
            ].map((item) => (
              <ServiceTileLarge
                key={item.screen}
                item={item}
                onPress={() => setScreen(item.screen)}
              />
            ))}
          </View>

          {[
            [
              { screen: 'ride', icon: '🚐', title: 'Transport', desc: 'Book a ride' },
              { screen: 'jobs', icon: '💼', title: 'Careers',   desc: 'Find work'   },
            ],
            [
              { screen: 'sos',        icon: '🛡️', title: 'Safety', desc: 'SOS & Help'     },
              { screen: 'haven_dash', icon: '🏨', title: 'Haven',  desc: 'Hotels & Stays' },
            ],
          ].map((row, ri) => (
            <View key={ri} style={styles.servicesRow}>
              {row.map((item) => (
                <ServiceTileSmall
                  key={item.screen}
                  item={item}
                  onPress={() => setScreen(item.screen)}
                />
              ))}
            </View>
          ))}
        </AnimatedSection>

        {/* ── LIFESTYLE ───────────────────── */}
        <AnimatedSection delay={250}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              LIFESTYLE
            </Text>
            <Text style={styles.sectionSub}>
              More coming soon 🔥
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lifestyleScroll}>
            {[
              { icon: '📦', label: 'Padala'  },
              { icon: '🏥', label: 'Health'  },
              { icon: '🏖️', label: 'Tourism' },
              { icon: '💡', label: 'Bills'   },
              { icon: '⛽', label: 'Fuel'    },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.lifestyleChip}
                activeOpacity={0.8}>
                <Text style={styles.lifestyleIcon}>
                  {item.icon}
                </Text>
                <Text style={styles.lifestyleLabel}>
                  {item.label}
                </Text>
                <View style={styles.lifestyleSoon}>
                  <Text style={styles.lifestyleSoonText}>
                    Soon
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AnimatedSection>

        {/* ── PRODUCER BANNER ─────────────── */}
        {['producer', 'admin'].includes(userRole) && (
          <AnimatedSection delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel,
                { color: colors.farmerColor }]}>
                🌾 HARVEST DASHBOARD
              </Text>
              <Text style={styles.sectionSub}>
                Manage your products & orders
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dashBanner, {
                borderLeftColor: colors.farmerColor,
                backgroundColor: colors.farmerBg,
              }]}
              onPress={() => setScreen('producer_dash')}
              activeOpacity={0.85}>
              <Text style={styles.dashBannerIcon}>🌾</Text>
              <View style={styles.dashBannerContent}>
                <Text style={[styles.dashBannerTitle,
                  { color: colors.farmerColor }]}>
                  Open Producer Dashboard
                </Text>
                <Text style={styles.dashBannerSub}>
                  Products · Orders · Sales
                </Text>
              </View>
              <Text style={[styles.dashBannerArrow,
                { color: colors.farmerColor }]}>→</Text>
            </TouchableOpacity>
          </AnimatedSection>
        )}

        {/* ── CUISINE BANNER ──────────────── */}
        {['cuisine', 'admin'].includes(userRole) && (
          <AnimatedSection delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel,
                { color: colors.cuisineColor }]}>
                🍴 CUISINE DASHBOARD
              </Text>
              <Text style={styles.sectionSub}>
                Manage your restaurant
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dashBanner, {
                borderLeftColor: colors.cuisineColor,
                backgroundColor: colors.cuisineBg,
              }]}
              onPress={() => setScreen('cuisine_dash')}
              activeOpacity={0.85}>
              <Text style={styles.dashBannerIcon}>🍴</Text>
              <View style={styles.dashBannerContent}>
                <Text style={[styles.dashBannerTitle,
                  { color: colors.cuisineColor }]}>
                  Open Cuisine Dashboard
                </Text>
                <Text style={styles.dashBannerSub}>
                  Menu · Orders · Revenue
                </Text>
              </View>
              <Text style={[styles.dashBannerArrow,
                { color: colors.cuisineColor }]}>→</Text>
            </TouchableOpacity>
          </AnimatedSection>
        )}

        {/* ── ADMIN BANNER ────────────────── */}
        {userRole === 'admin' && (
          <AnimatedSection delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel,
                { color: colors.adminColor }]}>
                ⚙️ ADMIN DASHBOARD
              </Text>
              <Text style={styles.sectionSub}>
                Manage the entire platform
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dashBanner, {
                borderLeftColor: colors.adminColor,
                backgroundColor: colors.adminBg,
              }]}
              onPress={() => setScreen('admin_dash')}
              activeOpacity={0.85}>
              <Text style={styles.dashBannerIcon}>⚙️</Text>
              <View style={styles.dashBannerContent}>
                <Text style={[styles.dashBannerTitle,
                  { color: colors.adminColor }]}>
                  Open Admin Dashboard
                </Text>
                <Text style={styles.dashBannerSub}>
                  Users · Verify · Products · Stats
                </Text>
              </View>
              <Text style={[styles.dashBannerArrow,
                { color: colors.adminColor }]}>→</Text>
            </TouchableOpacity>
          </AnimatedSection>
        )}

        {/* ── SELLER BANNER ───────────────── */}
        {['seller', 'admin'].includes(userRole) && (
          <AnimatedSection delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel,
                { color: colors.vendorColor }]}>
                🏪 SELLER DASHBOARD
              </Text>
            </View>
            <View style={styles.dashRow}>
              {[
                {
                  s:     'wholesale',
                  icon:  '🛒',
                  title: 'Wholesale',
                  sub:   'Buy from producers',
                },
                {
                  s:     'my_store',
                  icon:  '🏪',
                  title: 'My Store',
                  sub:   'Manage products',
                },
              ].map((d) => (
                <TouchableOpacity
                  key={d.s}
                  style={[styles.dashCard,
                    { borderTopColor: colors.vendorColor }]}
                  onPress={() => setScreen(d.s)}
                  activeOpacity={0.85}>
                  <Text style={styles.dashIcon}>
                    {d.icon}
                  </Text>
                  <Text style={styles.dashTitle}>
                    {d.title}
                  </Text>
                  <Text style={styles.dashSub}>
                    {d.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedSection>
        )}

        {/* ── PARTNER BANNER ──────────────── */}
        {userRole === 'regular' && (
          <AnimatedSection delay={350}>
            <TouchableOpacity
              style={styles.partnerBanner}
              onPress={() => setScreen('verify')}
              activeOpacity={0.85}>
              <View style={styles.partnerLeft}>
                <Text style={styles.partnerIcon}>🌴</Text>
                <View>
                  <Text style={styles.partnerTitle}>
                    BECOME A PARTNER
                  </Text>
                  <Text style={styles.partnerSub}>
                    Harvest · Seller · Swift · Haven
                  </Text>
                </View>
              </View>
              <View style={styles.partnerArrowWrap}>
                <Text style={styles.partnerArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </AnimatedSection>
        )}

        {/* ── FOOTER ──────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>ZAVARA</Text>
          <Text style={styles.footerSub}>
            Built with pride in Bohol 🌴
          </Text>
          <Text style={styles.footerVersion}>v5.0.0</Text>
        </View>

      </ScrollView>

      <BottomNav />
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

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor:   colors.headerBg,
    paddingTop:        50,
    paddingBottom:     14,
    paddingHorizontal: 22,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  brand: {
    fontSize:      24,
    fontWeight:    '900',
    color:         colors.primary,
    letterSpacing: 6,
  },
  welcome: {
    color:    colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  notifBtn: {
    width:           42,
    height:          42,
    borderRadius:    14,
    backgroundColor: colors.primaryPale,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.borderGold,
    position:        'relative',
  },
  notifIcon: { fontSize: 18 },

  // ── BADGES ──────────────────────────────────
  cartBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    minWidth:        18,
    height:          18,
    borderRadius:    9,
    backgroundColor: colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     colors.cardBackground,
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },
  notifBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    minWidth:        18,
    height:          18,
    borderRadius:    9,
    backgroundColor: colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     colors.cardBackground,
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color:      colors.textWhite,
    fontSize:   9,
    fontWeight: '900',
  },

  // ── AVATAR ──────────────────────────────────
  avatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    backgroundColor: colors.primary,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    ...shadowGold,
  },
  avatarImg: {
    width:        44,
    height:       44,
    borderRadius: 22,
  },
  avatarText: {
    color:      colors.textWhite,
    fontWeight: '900',
    fontSize:   18,
  },

  // ── SEARCH ──────────────────────────────────
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    backgroundColor:   colors.headerBg,
  },
  searchBar: {
    backgroundColor:   colors.inputBackground,
    borderRadius:      borderRadius.large,
    paddingHorizontal: 16,
    paddingVertical:   13,
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       colors.border,
    gap:               10,
  },
  searchIcon:        { fontSize: 16 },
  searchPlaceholder: {
    color:    colors.textMuted,
    fontSize: 13,
    flex:     1,
  },
  searchFilter: {
    backgroundColor:  colors.primaryPale,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:     borderRadius.round,
    borderWidth:      1,
    borderColor:      colors.borderGold,
  },
  searchFilterText: {
    color:      colors.primary,
    fontSize:   10,
    fontWeight: '800',
  },

  // ── ROLE BANNER ─────────────────────────────
  roleBanner: {
    marginHorizontal: 20,
    marginTop:        16,
    marginBottom:     8,
    padding:          12,
    borderRadius:     borderRadius.large,
    borderWidth:      1,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              8,
    justifyContent:   'center',
  },
  roleBannerText: {
    fontSize:      11,
    fontWeight:    '800',
    letterSpacing: 1,
  },

  // ── SECTION HEADER ──────────────────────────
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom:      14,
    marginTop:         12,
  },
  sectionLabel: {
    color:         colors.textDark,
    fontSize:      11,
    fontWeight:    '900',
    letterSpacing: 2,
  },
  sectionSub: {
    color:    colors.textLight,
    fontSize: 11,
    marginTop: 3,
  },

  // ── PROMO CARDS ─────────────────────────────
  carouselContent: {
    paddingHorizontal: 20,
    paddingVertical:   10,
  },
  promoCard: {
    width:         260,
    height:        148,
    borderRadius:  borderRadius.xxlarge,
    padding:       18,
    marginRight:   14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth:   1,
    ...shadowMd,
  },
  promoCardInner: {
    flex:           1,
    justifyContent: 'space-between',
  },
  promoCardRight: {
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingLeft:    10,
  },
  promoEmoji:  { fontSize: 40, marginBottom: 8 },
  promoTag: {
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 2,
  },
  promoTitle: {
    fontSize:      16,
    fontWeight:    '900',
    letterSpacing: 1,
  },
  promoDesc: {
    color:      colors.textLight,
    fontSize:   11,
    lineHeight: 16,
  },
  promoCTA: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      borderRadius.round,
    ...shadow,
  },
  promoCTAText: {
    fontSize:   10,
    fontWeight: '900',
    color:      '#FFF',
  },

  // ── PROMO DOTS ──────────────────────────────
  promoDots: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            6,
    marginTop:      4,
    marginBottom:   8,
  },
  promoDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.border,
  },
  promoDotActive: {
    width:           18,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.primary,
  },

  // ── SERVICES ────────────────────────────────
  servicesRow: {
    flexDirection:    'row',
    paddingHorizontal: 16,
    gap:              12,
    marginBottom:     12,
  },
  serviceTileLarge: {
    flex:            1,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         20,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadowMd,
  },
  serviceIconWrap: {
    width:          54,
    height:         54,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   14,
  },
  serviceIcon:  { fontSize: 28 },
  serviceTitle: {
    color:        colors.textDark,
    fontSize:     16,
    fontWeight:   '900',
    marginBottom: 3,
  },
  serviceDesc: {
    color:        colors.textLight,
    fontSize:     11,
    marginBottom: 12,
  },
  liveBadge: {
    backgroundColor: colors.successPale,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      borderRadius.round,
    alignSelf:         'flex-start',
    borderWidth:       1,
    borderColor:       colors.success + '25',
  },
  liveBadgeText: {
    color:         colors.success,
    fontSize:      8,
    fontWeight:    '900',
    letterSpacing: 1,
  },
  serviceTileSmall: {
    flex:            1,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  serviceTileSmallInner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  serviceTileSmIcon:  { fontSize: 26 },
  serviceTileSmTitle: {
    color:        colors.textDark,
    fontSize:     13,
    fontWeight:   '800',
    marginBottom: 2,
  },
  serviceTileSmDesc: {
    color:    colors.textLight,
    fontSize: 10,
  },

  // ── LIFESTYLE ───────────────────────────────
  lifestyleScroll: {
    paddingHorizontal: 20,
    paddingBottom:     16,
  },
  lifestyleChip: {
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.large,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight:     10,
    alignItems:      'center',
    minWidth:        72,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  lifestyleIcon:  { fontSize: 24, marginBottom: 6 },
  lifestyleLabel: {
    color:      colors.textMedium,
    fontSize:   10,
    fontWeight: '700',
  },
  lifestyleSoon: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      6,
    marginTop:         4,
    borderWidth:       1,
    borderColor:       colors.borderGold,
  },
  lifestyleSoonText: {
    color:      colors.primary,
    fontSize:   8,
    fontWeight: '900',
  },

  // ── DASH BANNERS ────────────────────────────
  dashBanner: {
    marginHorizontal: 16,
    marginBottom:     16,
    padding:          18,
    borderRadius:     borderRadius.xlarge,
    flexDirection:    'row',
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      colors.border,
    borderLeftWidth:  4,
    ...shadowMd,
  },
  dashBannerIcon:    { fontSize: 32, marginRight: 14 },
  dashBannerContent: { flex: 1 },
  dashBannerTitle: {
    fontSize:     14,
    fontWeight:   '900',
    marginBottom: 3,
  },
  dashBannerSub: {
    color:    colors.textLight,
    fontSize: 11,
  },
  dashBannerArrow: {
    fontSize:   20,
    fontWeight: '900',
  },
  dashRow: {
    flexDirection:    'row',
    paddingHorizontal: 16,
    marginBottom:     22,
    gap:              12,
  },
  dashCard: {
    flex:            1,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         20,
    borderWidth:     1,
    borderColor:     colors.border,
    borderTopWidth:  3,
    ...shadowMd,
  },
  dashIcon:  { fontSize: 30, marginBottom: 12 },
  dashTitle: {
    color:        colors.textDark,
    fontSize:     14,
    fontWeight:   '800',
    marginBottom: 4,
  },
  dashSub: {
    color:    colors.textLight,
    fontSize: 11,
  },

  // ── PARTNER BANNER ──────────────────────────
  partnerBanner: {
    backgroundColor:  colors.primaryPale,
    marginHorizontal: 20,
    borderRadius:     borderRadius.xlarge,
    padding:          20,
    marginBottom:     20,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      colors.borderGold,
    ...shadow,
  },
  partnerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    flex:          1,
  },
  partnerIcon:  { fontSize: 30 },
  partnerTitle: {
    color:         colors.primary,
    fontWeight:    '900',
    fontSize:      12,
    letterSpacing: 1,
    marginBottom:  3,
  },
  partnerSub: {
    color:    colors.textLight,
    fontSize: 10,
  },
  partnerArrowWrap: {
    width:          34,
    height:         34,
    borderRadius:   17,
    backgroundColor: colors.primary,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  partnerArrow: {
    color:      colors.textWhite,
    fontSize:   16,
    fontWeight: '900',
  },

  // ── FOOTER ──────────────────────────────────
  footer: {
    alignItems:     'center',
    paddingVertical: 28,
  },
  footerLine: {
    width:           40,
    height:          1,
    backgroundColor: colors.border,
    marginBottom:    16,
  },
  footerBrand: {
    color:         colors.textMuted,
    fontSize:      12,
    fontWeight:    '900',
    letterSpacing: 5,
  },
  footerSub: {
    color:     colors.textMuted,
    fontSize:  11,
    marginTop: 6,
  },
  footerVersion: {
    color:         colors.borderMedium,
    fontSize:      9,
    marginTop:     4,
    letterSpacing: 2,
  },
});