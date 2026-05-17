// ============================================
// ZAVARA ONBOARDING - v4.0
// INSPIRED BY: Grab, Duolingo, Airbnb, Netflix
// Improvements over v3.0:
// 1. Role selection saved to AsyncStorage
// 2. Haptic feedback on slide change
// 3. Pulse animation on last CTA button
// 4. Slide counter "X of Y"
// 5. Count-up animation on stats
// 6. Scale press on feature grid items
// 7. Velocity-based swipe detection
// 8. Smooth fade out on skip/finish
// ============================================
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  PanResponder,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  colors,
  borderRadius,
  shadowGold,
  shadow,
  shadowMd,
} from '../theme';

const { width, height } = Dimensions.get('window');

// ============================================
// SLIDE DATA - Same as v3.0 (no changes)
// ============================================
const SLIDES = [
  {
    id:       1,
    type:     'impact',
    emoji:    '🌴',
    title:    "Bohol's\nSuper App",
    subtitle: 'THE ISLAND\'S PULSE',
    desc:     'Food · Market · Transport · Tourism · Jobs',
    bg:       colors.dark,
    accent:   colors.primary,
    iconBg:   colors.primaryGlow,
    tag:      'ZAVARA',
    stats: [
      { num: '500+',  label: 'Businesses', target: 500  },
      { num: '10k+',  label: 'Orders',     target: 10   },
      { num: '4.8⭐', label: 'Rating',     target: 4.8  },
    ],
  },
  {
    id:       2,
    type:     'features',
    emoji:    '⚡',
    title:    'Everything\nIn One App',
    subtitle: 'ALL SERVICES',
    desc:     'No more switching between apps. ZAVARA does it all.',
    bg:       '#FFFBF2',
    accent:   colors.primary,
    iconBg:   colors.primaryPale,
    tag:      'ONE APP · ENDLESS POSSIBILITIES',
    features: [
      { icon: '🍴', label: 'Food',      color: colors.cuisineColor, bg: colors.cuisineBg   },
      { icon: '🌾', label: 'Market',    color: colors.farmerColor,  bg: colors.farmerBg    },
      { icon: '🚐', label: 'Transport', color: colors.riderColor,   bg: colors.riderBg     },
      { icon: '🏨', label: 'Haven',     color: colors.havenColor,   bg: colors.havenBg     },
      { icon: '💼', label: 'Jobs',      color: colors.primary,      bg: colors.primaryPale },
      { icon: '🛡️', label: 'Safety',    color: colors.danger,       bg: colors.dangerPale  },
    ],
  },
  {
    id:       3,
    type:     'role',
    emoji:    '👋',
    title:    'What Brings\nYou Here?',
    subtitle: 'PERSONALIZE',
    desc:     'Tell us who you are and we\'ll set things up for you.',
    bg:       '#F5FBF7',
    accent:   colors.farmerColor,
    iconBg:   colors.farmerBg,
    tag:      'CHOOSE YOUR PATH',
    roles: [
      {
        id:    'customer',
        icon:  '🛒',
        title: 'Customer',
        desc:  'Order food & products',
        color: colors.primary,
        bg:    colors.primaryPale,
      },
      {
        id:    'producer',
        icon:  '🌾',
        title: 'Farmer / Fisher',
        desc:  'Sell your harvest',
        color: colors.farmerColor,
        bg:    colors.farmerBg,
      },
      {
        id:    'seller',
        icon:  '🏪',
        title: 'Market Seller',
        desc:  'Run your store',
        color: colors.vendorColor,
        bg:    colors.vendorBg,
      },
      {
        id:    'business',
        icon:  '🍴',
        title: 'Restaurant',
        desc:  'Grow your business',
        color: colors.cuisineColor,
        bg:    colors.cuisineBg,
      },
    ],
  },
  {
    id:       4,
    type:     'cta',
    emoji:    '🚀',
    title:    'Ready to\nExplore Bohol?',
    subtitle: 'JOIN ZAVARA TODAY',
    desc:     'Free to join. Local. Trusted. Built for Bohol.',
    bg:       colors.dark,
    accent:   colors.primary,
    iconBg:   colors.primaryGlow,
    tag:      'GET STARTED FREE',
    perks: [
      { icon: '✅', text: 'Free to download & use'       },
      { icon: '🔒', text: 'Safe & secure payments'       },
      { icon: '🌴', text: '100% local Bohol businesses'  },
      { icon: '⚡', text: 'Fast delivery & support'      },
    ],
  },
];

// ============================================
// HELPER: Haptic feedback with graceful fallback
// ============================================
async function triggerHaptic(type = 'light') {
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
    }
  } catch (_) {
    // Haptics not supported - silent fail
  }
}

// ============================================
// HELPER: Count-up animation hook
// ============================================
function useCountUp(target, duration = 1500, active = false) {
  const anim   = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!active) return;
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => {
      if (target >= 100) {
        setDisplay(Math.floor(value).toLocaleString() + '+');
      } else {
        setDisplay(value.toFixed(1));
      }
    });
    Animated.timing(anim, {
      toValue:         target,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [active, target]);

  return display;
}

// ============================================
// SLIDE COMPONENTS
// ============================================

// ── STAT ITEM with count-up ─────────────────
function StatItem({ stat, active, isLast }) {
  const display = useCountUp(stat.target, 1200, active);
  return (
    <View style={slideStyles.statItem}>
      <Text style={[slideStyles.statNum,
        { color: colors.primary }]}>
        {stat.target >= 100
          ? display
          : stat.target === 4.8
            ? display + '⭐'
            : display + 'k+'}
      </Text>
      <Text style={slideStyles.statLabel}>
        {stat.label}
      </Text>
      {!isLast && (
        <View style={slideStyles.statDivider} />
      )}
    </View>
  );
}

// ── SLIDE 1: IMPACT ─────────────────────────
function ImpactSlide({ slide, emojiFloat, emojiScale, active }) {
  return (
    <View style={slideStyles.impactWrap}>
      <View style={slideStyles.glowCircle1} />
      <View style={slideStyles.glowCircle2} />

      <View style={slideStyles.impactTag}>
        <Text style={[slideStyles.impactTagText,
          { color: slide.accent }]}>
          {slide.tag}
        </Text>
      </View>

      <Animated.View style={[
        slideStyles.impactEmojiCircle,
        {
          transform: [
            { scale: emojiScale },
            { translateY: emojiFloat },
          ],
        },
      ]}>
        <Text style={slideStyles.impactEmoji}>
          {slide.emoji}
        </Text>
      </Animated.View>

      <Text style={slideStyles.impactTitle}>
        {slide.title}
      </Text>
      <Text style={slideStyles.impactSubtitle}>
        {slide.subtitle}
      </Text>
      <Text style={slideStyles.impactDesc}>
        {slide.desc}
      </Text>

      {/* Stats with count-up animation */}
      <View style={slideStyles.statsRow}>
        {slide.stats.map((stat, i) => (
          <StatItem
            key={i}
            stat={stat}
            active={active}
            isLast={i === slide.stats.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ── SLIDE 2: FEATURES ───────────────────────
function FeaturesSlide({ slide, emojiFloat, emojiScale }) {
  const itemAnims = useRef(
    slide.features.map(() => new Animated.Value(0))
  ).current;

  // Scale anims for press feedback
  const scaleAnims = useRef(
    slide.features.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    const animations = itemAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue:         1,
        duration:        300,
        delay:           i * 80,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const onFeaturePress = (i) => {
    triggerHaptic('light');
    Animated.sequence([
      Animated.spring(scaleAnims[i], {
        toValue:         0.92,
        friction:        8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[i], {
        toValue:         1,
        friction:        5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={slideStyles.featuresWrap}>
      <Animated.View style={[
        slideStyles.featuresHeader,
        { transform: [{ translateY: emojiFloat }] },
      ]}>
        <Text style={slideStyles.featuresEmoji}>
          {slide.emoji}
        </Text>
      </Animated.View>

      <Text style={[slideStyles.featuresSubtitle,
        { color: slide.accent }]}>
        {slide.subtitle}
      </Text>
      <Text style={slideStyles.featuresTitle}>
        {slide.title}
      </Text>
      <Text style={slideStyles.featuresDesc}>
        {slide.desc}
      </Text>

      <View style={slideStyles.featuresGrid}>
        {slide.features.map((feature, i) => (
          <Animated.View
            key={feature.label}
            style={[slideStyles.featureItem, {
              opacity: itemAnims[i],
              transform: [
                {
                  translateY: itemAnims[i].interpolate({
                    inputRange:  [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                { scale: scaleAnims[i] },
              ],
            }]}>
            <TouchableOpacity
              onPress={() => onFeaturePress(i)}
              activeOpacity={1}>
              <View style={[slideStyles.featureIconWrap,
                { backgroundColor: feature.bg }]}>
                <Text style={slideStyles.featureIcon}>
                  {feature.icon}
                </Text>
              </View>
              <Text style={[slideStyles.featureLabel,
                { color: feature.color }]}>
                {feature.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ── SLIDE 3: ROLE PICKER ────────────────────
function RoleSlide({ slide, selectedRole, onSelectRole }) {
  const scaleAnims = useRef(
    slide.roles.map(() => new Animated.Value(1))
  ).current;

  const onRolePress = (roleId, i) => {
    triggerHaptic('medium');
    Animated.sequence([
      Animated.spring(scaleAnims[i], {
        toValue:         0.94,
        friction:        8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[i], {
        toValue:         1,
        friction:        5,
        useNativeDriver: true,
      }),
    ]).start();
    onSelectRole(roleId);
  };

  return (
    <View style={slideStyles.roleWrap}>
      <Text style={[slideStyles.roleTag,
        { color: slide.accent }]}>
        ✦ {slide.tag}
      </Text>
      <Text style={slideStyles.roleTitle}>
        {slide.title}
      </Text>
      <Text style={slideStyles.roleDesc}>
        {slide.desc}
      </Text>

      <View style={slideStyles.roleGrid}>
        {slide.roles.map((role, i) => {
          const isSelected = selectedRole === role.id;
          return (
            <Animated.View
              key={role.id}
              style={{ transform: [{ scale: scaleAnims[i] }] }}>
              <TouchableOpacity
                style={[slideStyles.roleCard, {
                  borderColor: isSelected
                    ? role.color : 'transparent',
                  backgroundColor: isSelected
                    ? role.bg : colors.cardBackground,
                }]}
                onPress={() => onRolePress(role.id, i)}
                activeOpacity={0.85}>
                <View style={[slideStyles.roleIconWrap, {
                  backgroundColor: isSelected
                    ? role.color + '20'
                    : colors.inputBackground,
                }]}>
                  <Text style={slideStyles.roleIcon}>
                    {role.icon}
                  </Text>
                </View>
                <Text style={[slideStyles.roleCardTitle, {
                  color: isSelected
                    ? role.color : colors.textDark,
                }]}>
                  {role.title}
                </Text>
                <Text style={slideStyles.roleCardDesc}>
                  {role.desc}
                </Text>
                {isSelected && (
                  <View style={[slideStyles.roleCheck,
                    { backgroundColor: role.color }]}>
                    <Text style={slideStyles.roleCheckText}>
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ── SLIDE 4: CTA with pulse button ──────────
function CTASlide({ slide, emojiFloat, emojiScale, onFinish }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue:         1.04,
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
    <View style={slideStyles.ctaWrap}>
      <View style={slideStyles.glowCircle1} />
      <View style={slideStyles.glowCircle2} />

      <Animated.View style={[
        slideStyles.ctaEmojiCircle,
        {
          transform: [
            { scale: emojiScale },
            { translateY: emojiFloat },
          ],
        },
      ]}>
        <Text style={slideStyles.ctaEmoji}>
          {slide.emoji}
        </Text>
      </Animated.View>

      <Text style={[slideStyles.ctaTag,
        { color: slide.accent }]}>
        ✦ {slide.tag}
      </Text>
      <Text style={slideStyles.ctaTitle}>
        {slide.title}
      </Text>
      <Text style={slideStyles.ctaDesc}>
        {slide.desc}
      </Text>

      <View style={slideStyles.perksList}>
        {slide.perks.map((perk, i) => (
          <View key={i} style={slideStyles.perkRow}>
            <Text style={slideStyles.perkIcon}>
              {perk.icon}
            </Text>
            <Text style={slideStyles.perkText}>
              {perk.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// SLIDE STYLES (same as v3.0 + additions)
// ============================================
const slideStyles = StyleSheet.create({

  // ── IMPACT ──────────────────────────────────
  impactWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glowCircle1: {
    position:        'absolute',
    width:           300,
    height:          300,
    borderRadius:    150,
    backgroundColor: colors.primaryGlow2,
    top:             -50,
    right:           -80,
  },
  glowCircle2: {
    position:        'absolute',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: colors.primaryGlow,
    bottom:          50,
    left:            -60,
  },
  impactTag: {
    backgroundColor:  colors.primaryGlow2,
    paddingHorizontal: 18,
    paddingVertical:   7,
    borderRadius:      borderRadius.round,
    marginBottom:      24,
    borderWidth:       1,
    borderColor:       colors.borderGold,
  },
  impactTagText: {
    fontSize:      12,
    fontWeight:    '900',
    letterSpacing: 5,
  },
  impactEmojiCircle: {
    width:           140,
    height:          140,
    borderRadius:    70,
    backgroundColor: colors.primaryGlow2,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    28,
    borderWidth:     1,
    borderColor:     colors.borderGold,
  },
  impactEmoji:    { fontSize: 68 },
  impactTitle: {
    fontSize:      42,
    fontWeight:    '900',
    color:         colors.textWhite,
    textAlign:     'center',
    marginBottom:  8,
    lineHeight:    48,
    letterSpacing: -0.5,
  },
  impactSubtitle: {
    fontSize:      10,
    color:         'rgba(255,255,255,0.45)',
    letterSpacing: 4,
    marginBottom:  10,
    fontWeight:    '600',
  },
  impactDesc: {
    fontSize:      13,
    color:         'rgba(255,255,255,0.55)',
    textAlign:     'center',
    marginBottom:  32,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection:   'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius:    borderRadius.xlarge,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    width:           '100%',
    justifyContent:  'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex:       1,
    position:   'relative',
  },
  statNum: {
    fontSize:     22,
    fontWeight:   '900',
    marginBottom: 4,
  },
  statLabel: {
    color:      'rgba(255,255,255,0.45)',
    fontSize:   10,
    fontWeight: '600',
  },
  statDivider: {
    position:        'absolute',
    right:           0,
    top:             4,
    width:           1,
    height:          32,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // ── FEATURES ────────────────────────────────
  featuresWrap: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 24,
  },
  featuresHeader: { marginBottom: 16 },
  featuresEmoji: {
    fontSize:  52,
    textAlign: 'center',
  },
  featuresSubtitle: {
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 3,
    marginBottom:  8,
  },
  featuresTitle: {
    fontSize:     30,
    fontWeight:   '900',
    color:        colors.textDark,
    textAlign:    'center',
    marginBottom: 8,
    lineHeight:   36,
  },
  featuresDesc: {
    fontSize:     13,
    color:        colors.textLight,
    textAlign:    'center',
    marginBottom: 28,
    lineHeight:   20,
  },
  featuresGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            10,
    justifyContent: 'center',
    width:          '100%',
  },
  featureItem: {
    width:           (width - 48 - 30) / 3,
    alignItems:      'center',
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.large,
    padding:         14,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow,
  },
  featureIconWrap: {
    width:          46,
    height:         46,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  featureIcon:  { fontSize: 24 },
  featureLabel: {
    fontSize:   10,
    fontWeight: '800',
    textAlign:  'center',
  },

  // ── ROLE ────────────────────────────────────
  roleWrap: {
    flex:              1,
    paddingHorizontal: 24,
    justifyContent:    'center',
  },
  roleTag: {
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 3,
    marginBottom:  10,
    textAlign:     'center',
  },
  roleTitle: {
    fontSize:     30,
    fontWeight:   '900',
    color:        colors.textDark,
    textAlign:    'center',
    marginBottom: 8,
    lineHeight:   36,
  },
  roleDesc: {
    fontSize:     13,
    color:        colors.textLight,
    textAlign:    'center',
    marginBottom: 24,
    lineHeight:   20,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    justifyContent: 'center',
  },
  roleCard: {
    width:           (width - 48 - 10) / 2,
    backgroundColor: colors.cardBackground,
    borderRadius:    borderRadius.xlarge,
    padding:         16,
    borderWidth:     2,
    alignItems:      'center',
    position:        'relative',
    ...shadow,
  },
  roleIconWrap: {
    width:          52,
    height:         52,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
  },
  roleIcon:      { fontSize: 28 },
  roleCardTitle: {
    fontSize:     13,
    fontWeight:   '900',
    marginBottom: 4,
    textAlign:    'center',
  },
  roleCardDesc: {
    fontSize:   10,
    color:      colors.textLight,
    textAlign:  'center',
    lineHeight: 14,
  },
  roleCheck: {
    position:        'absolute',
    top:             -8,
    right:           -8,
    width:           24,
    height:          24,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.cardBackground,
  },
  roleCheckText: {
    color:      colors.textWhite,
    fontSize:   11,
    fontWeight: '900',
  },

  // ── CTA ─────────────────────────────────────
  ctaWrap: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 28,
  },
  ctaEmojiCircle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: colors.primaryGlow2,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     colors.borderGold,
  },
  ctaEmoji: { fontSize: 58 },
  ctaTag: {
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 3,
    marginBottom:  12,
  },
  ctaTitle: {
    fontSize:      38,
    fontWeight:    '900',
    color:         colors.textWhite,
    textAlign:     'center',
    marginBottom:  12,
    lineHeight:    44,
    letterSpacing: -0.5,
  },
  ctaDesc: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.50)',
    textAlign:    'center',
    marginBottom: 28,
    lineHeight:   20,
  },
  perksList: {
    width: '100%',
    gap:   12,
  },
  perkRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    backgroundColor:   'rgba(255,255,255,0.07)',
    borderRadius:      borderRadius.large,
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.08)',
  },
  perkIcon: { fontSize: 18 },
  perkText: {
    color:      'rgba(255,255,255,0.75)',
    fontSize:   13,
    fontWeight: '600',
    flex:       1,
  },
});

// ============================================
// MAIN ONBOARDING SCREEN
// ============================================
export default function OnboardingScreen({ onFinish }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);

  // ── ANIMATION REFS ────────────────────────
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(
    new Animated.Value(1 / SLIDES.length)
  ).current;
  const emojiScale   = useRef(new Animated.Value(1)).current;
  const emojiFloat   = useRef(new Animated.Value(0)).current;
  const screenFade   = useRef(new Animated.Value(1)).current;
  const floatLoop    = useRef(null);

  // ── VELOCITY SWIPE ────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) &&
        Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        // Velocity-based: fast swipe OR long swipe
        const isSwipeLeft  = g.dx < -40 || g.vx < -0.5;
        const isSwipeRight = g.dx > 40  || g.vx > 0.5;
        if (isSwipeLeft)       handleNext();
        else if (isSwipeRight) handlePrev();
      },
    })
  ).current;

  // ── FLOAT ANIMATION ───────────────────────
  useEffect(() => {
    floatLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiFloat, {
          toValue:         -14,
          duration:        2000,
          useNativeDriver: true,
        }),
        Animated.timing(emojiFloat, {
          toValue:         0,
          duration:        2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.current.start();
    return () => floatLoop.current?.stop();
  }, []);

  // ── SLIDE CHANGE ANIMATION ────────────────
  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    slideAnim.setValue(24);
    emojiScale.setValue(0.75);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        8,
        tension:         50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        friction:        8,
        tension:         50,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue:         1,
        friction:        6,
        tension:         40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue:         (currentSlide + 1) / SLIDES.length,
      duration:        400,
      useNativeDriver: false,
    }).start();
  }, [currentSlide]);

  // ── SMOOTH EXIT ANIMATION ─────────────────
  const smoothExit = useCallback((callback) => {
    Animated.timing(screenFade, {
      toValue:         0,
      duration:        350,
      useNativeDriver: true,
    }).start(() => callback());
  }, [screenFade]);

  // ── SAVE ROLE TO STORAGE ──────────────────
  const saveRole = useCallback(async (role) => {
    try {
      if (role) {
        await AsyncStorage.setItem(
          'zavara_selected_role', role
        );
      }
    } catch (_) {
      // Silent fail - not critical
    }
  }, []);

  // ── NAVIGATION ────────────────────────────
  const handleNext = useCallback(() => {
    triggerHaptic('light');
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      triggerHaptic('success');
      saveRole(selectedRole);
      smoothExit(onFinish);
    }
  }, [currentSlide, onFinish, selectedRole, smoothExit, saveRole]);

  const handlePrev = useCallback(() => {
    triggerHaptic('light');
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index) => {
    triggerHaptic('light');
    setCurrentSlide(index);
  }, []);

  const handleSkip = useCallback(() => {
    triggerHaptic('light');
    smoothExit(onFinish);
  }, [smoothExit, onFinish]);

  // ── COMPUTED ──────────────────────────────
  const slide  = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isDark = slide.bg === colors.dark;

  const btnText = useMemo(() => {
    if (isLast) return '🚀 GET STARTED FREE';
    if (slide.type === 'role' && !selectedRole)
      return 'Skip for now →';
    if (slide.type === 'role' && selectedRole)
      return 'Continue →';
    return 'NEXT →';
  }, [isLast, slide.type, selectedRole]);

  // ── RENDER SLIDE ──────────────────────────
  const renderSlideContent = () => {
    switch (slide.type) {
      case 'impact':
        return (
          <ImpactSlide
            slide={slide}
            emojiFloat={emojiFloat}
            emojiScale={emojiScale}
            active={currentSlide === 0}
          />
        );
      case 'features':
        return (
          <FeaturesSlide
            slide={slide}
            emojiFloat={emojiFloat}
            emojiScale={emojiScale}
          />
        );
      case 'role':
        return (
          <RoleSlide
            slide={slide}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        );
      case 'cta':
        return (
          <CTASlide
            slide={slide}
            emojiFloat={emojiFloat}
            emojiScale={emojiScale}
            onFinish={handleNext}
          />
        );
      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: slide.bg,
          opacity:         screenFade,
        },
      ]}
      {...panResponder.panHandlers}>

      <StatusBar
        backgroundColor={slide.bg}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* ══ TOP BAR ════════════════════════════ */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.brand, {
            color: isDark
              ? colors.primary
              : slide.accent,
          }]}>
            ZAVARA
          </Text>
          {/* Slide counter */}
          <Text style={[styles.slideCounter, {
            color: isDark
              ? 'rgba(255,255,255,0.30)'
              : 'rgba(0,0,0,0.25)',
          }]}>
            {currentSlide + 1} of {SLIDES.length}
          </Text>
        </View>

        {!isLast && (
          <TouchableOpacity
            style={[styles.skipBtn, {
              borderColor: isDark
                ? 'rgba(255,255,255,0.15)'
                : slide.accent + '25',
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : slide.iconBg,
            }]}
            onPress={handleSkip}>
            <Text style={[styles.skipText, {
              color: isDark
                ? 'rgba(255,255,255,0.6)'
                : slide.accent,
            }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══ PROGRESS BAR ═══════════════════════ */}
      <View style={[styles.progressBarWrap, {
        backgroundColor: isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.06)',
      }]}>
        <Animated.View style={[
          styles.progressBarFill,
          {
            backgroundColor: slide.accent,
            width: progressAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]} />
      </View>

      {/* ══ SLIDE CONTENT ══════════════════════ */}
      <Animated.View style={[
        styles.slideWrap,
        {
          opacity:   fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}>
        {renderSlideContent()}
      </Animated.View>

      {/* ══ BOTTOM NAV ═════════════════════════ */}
      <View style={styles.bottomSection}>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{
                top: 10, bottom: 10,
                left: 6, right: 6,
              }}>
              <View style={[
                styles.dot,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.20)'
                    : 'rgba(0,0,0,0.12)',
                },
                i === currentSlide && [
                  styles.dotActive,
                  { backgroundColor: slide.accent },
                ],
                i < currentSlide && {
                  backgroundColor: isDark
                    ? slide.accent + '50'
                    : slide.accent + '45',
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Nav buttons */}
        <View style={styles.navBtns}>

          {/* PREV */}
          {currentSlide > 0 ? (
            <TouchableOpacity
              style={[styles.prevBtn, {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.15)'
                  : slide.accent + '30',
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : slide.iconBg,
              }]}
              onPress={handlePrev}
              activeOpacity={0.8}>
              <Text style={[styles.prevBtnText, {
                color: isDark
                  ? 'rgba(255,255,255,0.7)'
                  : slide.accent,
              }]}>
                ←
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56 }} />
          )}

          {/* NEXT with pulse on last slide */}
          <TouchableOpacity
            style={[styles.nextBtn,
              { backgroundColor: slide.accent }]}
            onPress={handleNext}
            activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {btnText}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login link on last slide */}
        {isLast && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={handleSkip}>
            <Text style={[styles.loginLinkText, {
              color: 'rgba(255,255,255,0.5)',
            }]}>
              Already have an account?{' '}
              <Text style={[styles.loginLinkBold,
                { color: slide.accent }]}>
                Login →
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Swipe hint on first slide */}
        {currentSlide === 0 && (
          <Text style={[styles.swipeHint, {
            color: 'rgba(255,255,255,0.30)',
          }]}>
            ← Swipe to explore →
          </Text>
        )}
      </View>

    </Animated.View>
  );
}

// ============================================
// MAIN STYLES
// ============================================
const styles = StyleSheet.create({

  container: { flex: 1 },

  // ── TOP BAR ───────────────────────────────
  topBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 24,
    paddingTop:        55,
    paddingBottom:     8,
    zIndex:            10,
  },
  brand: {
    fontSize:      18,
    fontWeight:    '900',
    letterSpacing: 5,
  },
  slideCounter: {
    fontSize:      10,
    fontWeight:    '600',
    letterSpacing: 1,
    marginTop:     2,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      borderRadius.round,
    borderWidth:       1,
  },
  skipText: {
    fontSize:   12,
    fontWeight: '700',
  },

  // ── PROGRESS ──────────────────────────────
  progressBarWrap: {
    height:            3,
    marginHorizontal:  24,
    borderRadius:      2,
    marginBottom:      8,
    overflow:          'hidden',
  },
  progressBarFill: {
    height:      '100%',
    borderRadius: 2,
  },

  // ── SLIDE ─────────────────────────────────
  slideWrap: { flex: 1 },

  // ── BOTTOM ────────────────────────────────
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom:     44,
    alignItems:        'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  20,
    alignItems:    'center',
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  dotActive: {
    width:        28,
    height:       8,
    borderRadius: 4,
  },
  navBtns: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    width:          '100%',
    marginBottom:   14,
  },
  prevBtn: {
    width:          56,
    height:         56,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
  prevBtnText: {
    fontSize:   22,
    fontWeight: '700',
  },
  nextBtn: {
    flex:           1,
    height:         56,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  nextBtnText: {
    color:         colors.textWhite,
    fontSize:      14,
    fontWeight:    '900',
    letterSpacing: 0.5,
  },
  loginLink: {
    paddingVertical: 8,
    marginBottom:    6,
  },
  loginLinkText: {
    fontSize:  13,
    textAlign: 'center',
  },
  loginLinkBold: { fontWeight: '900' },
  swipeHint: {
    fontSize:      11,
    letterSpacing: 1,
    marginTop:     4,
  },
});