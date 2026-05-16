// ============================================
// screens/VerifyScreen.js
// Extracted from App.js
// ============================================
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { showToast }     from './ToastManager';
import { API_URL }       from '../config';
import {
  colors,
  shadow,
  borderRadius,
} from '../theme';

const PARTNER_OPTIONS = [
  {
    role: 'producer', icon: '🌾',
    title: 'Harvest Partner',
    subtitle: 'Farmer · Fisherman · Livestock',
    desc: 'Sell your harvest directly to buyers across Bohol',
    color: colors.farmerColor,
    bg: colors.farmerBg,
    docs: 'Valid ID + Barangay Clearance',
    partner_type: 'farmer',
  },
  {
    role: 'seller', icon: '🏪',
    title: 'Market Seller',
    subtitle: 'Palengke · Sari-sari · Cooperative',
    desc: 'Buy wholesale from producers and sell to customers',
    color: colors.vendorColor,
    bg: colors.vendorBg,
    docs: 'Valid ID + DTI/Business Permit',
    partner_type: 'market_vendor',
  },
  {
    role: 'transport', icon: '🚐',
    title: 'Swift Partner',
    subtitle: 'Motorcycle · Van · Truck · Courier',
    desc: 'Deliver orders across Bohol',
    color: colors.riderColor,
    bg: colors.riderBg,
    docs: "Valid ID + Driver's License + OR/CR",
    partner_type: 'motorcycle_rider',
  },
  {
    role: 'haven', icon: '🏨',
    title: 'Haven Partner',
    subtitle: 'Hotel · Resort · Pension · Homestay',
    desc: 'List your property and attract tourists',
    color: colors.havenColor,
    bg: colors.havenBg,
    docs: 'Valid ID + Business Permit',
    partner_type: 'hotel',
  },
  {
    role: 'cuisine', icon: '🍴',
    title: 'Cuisine Partner',
    subtitle: 'Restaurant · Carinderia · Food Stall',
    desc: 'Reach more customers with food delivery',
    color: colors.cuisineColor,
    bg: colors.cuisineBg,
    docs: 'Valid ID + Business Permit + Sanitary Permit',
    partner_type: 'restaurant',
  },
];

export default function VerifyScreen() {
  const { setScreen, userId } = useAppContext();

  const handleApply = async (item) => {
    try {
      await axios.post(
        `${API_URL}/verify/apply` +
        `?user_id=${userId}` +
        `&requested_role=${item.role}` +
        `&partner_type=${item.partner_type}` +
        `&business_name=Pending` +
        `&description=Application via ZAVARA`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      showToast('success',
        'Application Submitted! ✅',
        `${item.title} application under review.`
      );
      setTimeout(() => setScreen('home'), 1500);
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('warning',
          'Already Applied ⚠️',
          'You have a pending application.'
        );
      } else {
        showToast('error', 'Error',
          'Could not apply. Try again.');
      }
    }
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
          onPress={() => setScreen('profile')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Become a Partner
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.subtitle}>
          Join the ZAVARA ecosystem and unlock exclusive
          features for your business in Bohol 🌴
        </Text>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>📋</Text>
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              REQUIREMENTS
            </Text>
            <Text style={styles.noteText}>
              Valid ID + Business Documents required.
              Review takes 1-4 hours.
            </Text>
          </View>
        </View>

        {PARTNER_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.role}
            style={[styles.option, {
              borderLeftWidth:  4,
              borderLeftColor: item.color,
            }]}
            activeOpacity={0.8}
            onPress={() => handleApply(item)}>
            <View style={[styles.optionIcon,
              { backgroundColor: item.bg }]}>
              <Text style={styles.optionIconText}>
                {item.icon}
              </Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle,
                { color: item.color }]}>
                {item.title}
              </Text>
              <Text style={styles.optionSubtitle}>
                {item.subtitle}
              </Text>
              <Text style={styles.optionDesc}>
                {item.desc}
              </Text>
              <View style={[styles.docsBadge,
                { backgroundColor: item.bg }]}>
                <Text style={[styles.docsText,
                  { color: item.color }]}>
                  📎 {item.docs}
                </Text>
              </View>
            </View>
            <Text style={[styles.arrow,
              { color: item.color }]}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            🔒 All applications are manually reviewed
            by ZAVARA Overseers for safety and integrity.
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: 24 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.large,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  noteIcon:    { fontSize: 26 },
  noteContent: { flex: 1 },
  noteTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  noteText: {
    color: colors.textMedium,
    fontSize: 11,
    lineHeight: 16,
  },
  option: {
    backgroundColor: colors.cardBackground,
    padding: 18,
    borderRadius: borderRadius.xlarge,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  optionIcon: {
    width: 50, height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIconText:  { fontSize: 24 },
  optionContent:   { flex: 1 },
  optionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  optionSubtitle: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
    marginBottom: 8,
  },
  docsBadge: {
    borderRadius: borderRadius.small,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  docsText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footerNote: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.large,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerNoteText: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
});  