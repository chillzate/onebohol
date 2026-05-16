// ============================================
// screens/HomeScreen.js
// Extracted from App.js
// Now uses useAppContext instead of props
// ============================================
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  StyleSheet,
} from 'react-native';
import { useAppContext }  from '../context/AppContext';
import { useAuth }        from '../hooks/useAuth';
import BottomNav          from '../components/BottomNav';
import { showToast }      from './ToastManager';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';

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

export default function HomeScreen() {
  const {
    screen,
    setScreen,
    loggedInUser,
    userRole,
    profileImage,
    cartCount,
    roleData,
  } = useAppContext();

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>ZAVARA</Text>
          <Text style={styles.welcome}>
            {getGreeting()}, {loggedInUser}{' '}
            {getGreetingEmoji()}
          </Text>
        </View>
        <View style={styles.headerRight}>
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
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => setScreen('orders')}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
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
                {loggedInUser?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setScreen('search')}
          activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search food, products, services...
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}>

        {/* Role banner */}
        {userRole !== 'regular' && (
          <View style={[styles.roleBanner, {
            borderColor:     roleData.color + '20',
            backgroundColor: roleData.bg,
          }]}>
            <Text style={[styles.roleBannerText,
              { color: roleData.color }]}>
              {roleData.banner}
            </Text>
          </View>
        )}

        {/* FEATURED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FEATURED</Text>
          <Text style={styles.sectionSub}>
            Exclusive deals
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          decelerationRate="fast"
          snapToInterval={274}>
          {[
            {
              bg:    colors.coralPale,
              border: colors.coral + '20',
              tag:   { text: '✦ LIMITED',    color: colors.coral       },
              title: { text: 'FIRST ORDER',  color: colors.textDark    },
              desc:  '50% off your first\nmeal delivery',
              emoji: '🍔',
              cta:   { text: 'Order →', bg: colors.coral               },
              screen: 'restaurants',
            },
            {
              bg:    colors.farmerBg,
              border: colors.farmerColor + '20',
              tag:   { text: '✦ FRESH DAILY', color: colors.farmerColor },
              title: { text: 'FARM TO TABLE', color: colors.textDark   },
              desc:  'Direct from local\nBohol producers',
              emoji: '🌾',
              cta:   { text: 'Shop →', bg: colors.farmerColor          },
              screen: 'market',
            },
            {
              bg:    colors.riderBg,
              border: colors.riderColor + '20',
              tag:   { text: '✦ COMING SOON', color: colors.riderColor },
              title: { text: 'SWIFT RIDES',   color: colors.textDark   },
              desc:  'Book a ride\nanywhere in Bohol',
              emoji: '🏍️',
              cta:   { text: 'Soon →', bg: colors.riderColor           },
              screen: null,
            },
          ].map((card, i) => (
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

        {/* SERVICES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SERVICES</Text>
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
          ].map((s) => (
            <TouchableOpacity
              key={s.screen}
              style={styles.serviceTileLarge}
              onPress={() => setScreen(s.screen)}
              activeOpacity={0.85}>
              <View style={[styles.serviceIconWrap,
                { backgroundColor: s.iconBg }]}>
                <Text style={styles.serviceIcon}>
                  {s.icon}
                </Text>
              </View>
              <Text style={styles.serviceTitle}>
                {s.title}
              </Text>
              <Text style={styles.serviceDesc}>
                {s.desc}
              </Text>
              {s.live && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>
                    ● LIVE
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
            {row.map((s) => (
              <TouchableOpacity
                key={s.screen}
                style={styles.serviceTileSmall}
                onPress={() => setScreen(s.screen)}
                activeOpacity={0.85}>
                <Text style={styles.serviceTileSmIcon}>
                  {s.icon}
                </Text>
                <View>
                  <Text style={styles.serviceTileSmTitle}>
                    {s.title}
                  </Text>
                  <Text style={styles.serviceTileSmDesc}>
                    {s.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* LIFESTYLE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>LIFESTYLE</Text>
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

        {/* PRODUCER BANNER */}
        {['producer', 'admin'].includes(userRole) && (
          <>
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
          </>
        )}

        {/* CUISINE BANNER */}
        {['cuisine', 'admin'].includes(userRole) && (
          <>
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
          </>
        )}

        {/* ADMIN DASHBOARD BANNER */}
{userRole === 'admin' && (
  <>
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
  </>
)}

        {/* SELLER */}
        {['seller', 'admin'].includes(userRole) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel,
                { color: colors.vendorColor }]}>
                🏪 SELLER DASHBOARD
              </Text>
            </View>
            <View style={styles.dashRow}>
              {[
                { s: 'wholesale', icon: '🛒',
                  title: 'Wholesale', sub: 'Buy from producers' },
                { s: 'my_store',  icon: '🏪',
                  title: 'My Store',  sub: 'Manage products'   },
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
          </>
        )}

        {/* PARTNER BANNER */}
        {userRole === 'regular' && (
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
        )}

        {/* Footer */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    ...shadow,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 6,
  },
  welcome: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 42, height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    position: 'relative',
  },
  notifIcon: { fontSize: 18 },
  cartBadge: {
    position: 'absolute',
    top: -4, right: -4,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBackground,
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
  },
  avatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadowGold,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 18,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.headerBg,
  },
  searchBar: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchIcon:        { fontSize: 16 },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  roleBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  roleBannerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 12,
  },
  sectionLabel: {
    color: colors.textDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionSub: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 3,
  },
  carouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoCard: {
    width: 260,
    height: 148,
    borderRadius: borderRadius.xxlarge,
    padding: 18,
    marginRight: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    ...shadowMd,
  },
  promoCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  promoCardRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  promoEmoji:  { fontSize: 40, marginBottom: 8 },
  promoTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  promoDesc: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
  },
  promoCTA: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    ...shadow,
  },
  promoCTAText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
  servicesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  serviceTileLarge: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowMd,
  },
  serviceIconWrap: {
    width: 54, height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  serviceIcon:  { fontSize: 28 },
  serviceTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  serviceDesc: {
    color: colors.textLight,
    fontSize: 11,
    marginBottom: 12,
  },
  liveBadge: {
    backgroundColor: colors.successPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.success + '25',
  },
  liveBadgeText: {
    color: colors.success,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  serviceTileSmall: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  serviceTileSmIcon:  { fontSize: 26 },
  serviceTileSmTitle: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  serviceTileSmDesc: {
    color: colors.textLight,
    fontSize: 10,
  },
  lifestyleScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  lifestyleChip: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  lifestyleIcon:  { fontSize: 24, marginBottom: 6 },
  lifestyleLabel: {
    color: colors.textMedium,
    fontSize: 10,
    fontWeight: '700',
  },
  lifestyleSoon: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  lifestyleSoonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '900',
  },
  dashBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: borderRadius.xlarge,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    ...shadowMd,
  },
  dashBannerIcon:    { fontSize: 32, marginRight: 14 },
  dashBannerContent: { flex: 1 },
  dashBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  dashBannerSub: { color: colors.textLight, fontSize: 11 },
  dashBannerArrow: { fontSize: 20, fontWeight: '900' },
  dashRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 12,
  },
  dashCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    ...shadowMd,
  },
  dashIcon:  { fontSize: 30, marginBottom: 12 },
  dashTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  dashSub: { color: colors.textLight, fontSize: 11 },
  partnerBanner: {
    backgroundColor: colors.primaryPale,
    marginHorizontal: 20,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadow,
  },
  partnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  partnerIcon:  { fontSize: 30 },
  partnerTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 3,
  },
  partnerSub: { color: colors.textLight, fontSize: 10 },
  partnerArrowWrap: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  partnerArrow: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerLine: {
    width: 40, height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  footerBrand: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 5,
  },
  footerSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  footerVersion: {
    color: colors.borderMedium,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 2,
  },
});