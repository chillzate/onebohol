// ============================================
// screens/ComingSoonScreen.js
// Reusable coming soon screen
// One file replaces the big if/else block
// ============================================
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import {
  colors,
  shadow,
  shadowMd,
  borderRadius,
} from '../theme';

const SCREEN_CONFIG = {
  ride:         { icon: '🏎️', title: 'Transport',        color: colors.riderColor   },
  jobs:         { icon: '💼', title: 'Careers',           color: colors.primary      },
  sos:          { icon: '🛡️', title: 'Safety & SOS',      color: colors.danger       },
  my_products:  { icon: '🌾', title: 'My Products',       color: colors.farmerColor  },
  add_product:  { icon: '➕', title: 'Add Product',        color: colors.farmerColor  },
  wholesale:    { icon: '🛒', title: 'Wholesale Market',  color: colors.primary      },
  my_store:     { icon: '🏪', title: 'My Store',          color: colors.vendorColor  },
  cuisine_dash: { icon: '🍴', title: 'Cuisine Dashboard', color: colors.cuisineColor },
  haven_dash:   { icon: '🏨', title: 'Haven Dashboard',   color: colors.havenColor   },
};

export default function ComingSoonScreen() {
  const { screen, setScreen } = useAppContext();
  const cfg = SCREEN_CONFIG[screen] || {
    icon:  '🚀',
    title: 'Coming Soon',
    color: colors.primary,
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setScreen('home')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {cfg.title}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconCircle,
          { backgroundColor: cfg.color + '14' }]}>
          <Text style={styles.icon}>{cfg.icon}</Text>
        </View>
        <Text style={styles.title}>{cfg.title}</Text>
        <Text style={styles.sub}>COMING SOON</Text>
        <View style={[styles.badge, {
          borderColor:     cfg.color + '40',
          backgroundColor: cfg.color + '10',
        }]}>
          <Text style={[styles.badgeText,
            { color: cfg.color }]}>
            We're working on it 🔥
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => setScreen('home')}>
          <Text style={styles.backLinkText}>
            ← Back to Home
          </Text>
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  iconCircle: {
    width: 120, height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...shadowMd,
  },
  icon:  { fontSize: 52 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 6,
  },
  sub: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 4,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});