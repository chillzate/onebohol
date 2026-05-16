// ============================================
// ZAVARA ONBOARDING - v3.0
// INSPIRED BY: Grab, Duolingo, Airbnb
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
  ScrollView,
} from 'react-native';
import {
  colors,
  borderRadius,
  shadowGold,
  shadow,
  shadowMd,
} from '../theme';

const { width, height } = Dimensions.get('window');

// ============================================
// SLIDE DATA - Reduced to 4 (Netflix/Grab style)
// Each slide has a UNIQUE layout, not cookie cutter
// ============================================
const SLIDES = [
  {
    id:       1,
    type:     'impact',      // ← BIG bold impact slide
    emoji:    '🌴',
    title:    "Bohol's\nSuper App",
    subtitle: 'THE ISLAND\'S PULSE',
    desc:     'Food · Market · Transport · Tourism · Jobs',
    bg:       colors.dark,  // ← Dark = premium feel
    accent:   colors.primary,
    iconBg:   colors.primaryGlow,
    tag:      'ZAVARA',
    stats: [               // ← Social proof like Grab
      { num: '500+',  label: 'Businesses'  },
      { num: '10k+',  label: 'Orders'      },
      { num: '4.8⭐', label: 'Rating'      },
    ],
  },
  {
    id:       2,
    type:     'features',   // ← Show what it does
    emoji:    '⚡',
    title:    'Everything\nIn One App',
    subtitle: 'ALL SERVICES',
    desc:     'No more switching between apps. ZAVARA does it all.',
    bg:       '#FFFBF2',
    accent:   colors.primary,
    iconBg:   colors.primaryPale,
    tag:      'ONE APP · ENDLESS POSSIBILITIES',
    features: [           // ← Feature grid like Airbnb
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
    type:     'role',       // ← Duolingo-style picker
    emoji:    '👋',
    title:    'What Brings\nYou Here?',
    subtitle: 'PERSONALIZE',
    desc:     'Tell us who you are and we\'ll set things up for you.',
    bg:       '#F5FBF7',
    accent:   colors.farmerColor,
    iconBg:   colors.farmerBg,
    tag:      'CHOOSE YOUR PATH',
    roles: [              // ← Interactive role selection
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
    type:     'cta',        // ← Final CTA slide
    emoji:    '🚀',
    title:    'Ready to\nExplore Bohol?',
    subtitle: 'JOIN ZAVARA TODAY',
    desc:     'Free to join. Local. Trusted. Built for Bohol.',
    bg:       colors.dark,  // ← Dark again = bookends
    accent:   colors.primary,
    iconBg:   colors.primaryGlow,
    tag:      'GET STARTED FREE',
    perks: [              // ← Benefits like GrabFood
      { icon: '✅', text: 'Free to download & use'       },
      { icon: '🔒', text: 'Safe & secure payments'       },
      { icon: '🌴', text: '100% local Bohol businesses'  },
      { icon: '⚡', text: 'Fast delivery & support'      },
    ],
  },
];

// ============================================
// SLIDE COMPONENTS - Each has unique layout
// ← This is what separates us from basic apps
// ============================================

// Slide 1: IMPACT (Dark, bold, social proof)
function ImpactSlide({ slide, emojiFloat, emojiScale }) {
  return (
    <View style={slideStyles.impactWrap}>
      {/* Glow circles for premium feel */}
      <View style={slideStyles.glowCircle1} />
      <View style={slideStyles.glowCircle2} />

      {/* Tag */}
      <View style={slideStyles.impactTag}>
        <Text style={[slideStyles.impactTagText,
          { color: slide.accent }]}>
          {slide.tag}
        </Text>
      </View>

      {/* Floating emoji */}
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

      {/* Title */}
      <Text style={slideStyles.impactTitle}>
        {slide.title}
      </Text>
      <Text style={slideStyles.impactSubtitle}>
        {slide.subtitle}
      </Text>
      <Text style={slideStyles.impactDesc}>
        {slide.desc}
      </Text>

      {/* Social proof stats */}
      <View style={slideStyles.statsRow}>
        {slide.stats.map((stat, i) => (
          <View key={i} style={slideStyles.statItem}>
            <Text style={[slideStyles.statNum,
              { color: slide.accent }]}>
              {stat.num}
            </Text>
            <Text style={slideStyles.statLabel}>
              {stat.label}
            </Text>
            {i < slide.stats.length - 1 && (
              <View style={slideStyles.statDivider} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// Slide 2: FEATURES GRID (Airbnb style)
function FeaturesSlide({ slide, emojiFloat, emojiScale }) {
  const itemAnims = useRef(
    slide.features.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Staggered entrance animation
    const animations = itemAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: i * 80,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={slideStyles.featuresWrap}>
      {/* Header */}
      <Animated.View style={[slideStyles.featuresHeader,
        {
          transform: [{ translateY: emojiFloat }],
        },
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

      {/* Feature grid - like Airbnb's category grid */}
      <View style={slideStyles.featuresGrid}>
        {slide.features.map((feature, i) => (
          <Animated.View
            key={feature.label}
            style={[slideStyles.featureItem, {
              opacity: itemAnims[i],
              transform: [{
                translateY: itemAnims[i].interpolate({
                  inputRange:  [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }]}>
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
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// Slide 3: ROLE PICKER (Duolingo style - interactive!)
function RoleSlide({ slide, selectedRole, onSelectRole }) {
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

      {/* Role options - Duolingo path selection */}
      <View style={slideStyles.roleGrid}>
        {slide.roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              style={[slideStyles.roleCard, {
                borderColor: isSelected
                  ? role.color : 'transparent',
                backgroundColor: isSelected
                  ? role.bg : colors.cardBackground,
              }]}
              onPress={() => onSelectRole(role.id)}
              activeOpacity={0.85}>
              <View style={[slideStyles.roleIconWrap, {
                backgroundColor: isSelected
                  ? role.color + '20' : colors.inputBackground,
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
          );
        })}
      </View>
    </View>
  );
}

// Slide 4: CTA (Dark, final push)
function CTASlide({ slide, emojiFloat, emojiScale }) {
  return (
    <View style={slideStyles.ctaWrap}>
      {/* Glow circles */}
      <View style={slideStyles.glowCircle1} />
      <View style={slideStyles.glowCircle2} />

      {/* Floating emoji */}
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

      {/* Perks list */}
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
// SLIDE STYLES
// ============================================
const slideStyles = StyleSheet.create({

  // ── IMPACT SLIDE ────────────────────────────
  impactWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glowCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryGlow2,
    top: -50,
    right: -80,
  },
  glowCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryGlow,
    bottom: 50,
    left: -60,
  },
  impactTag: {
    backgroundColor: colors.primaryGlow2,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  impactTagText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 5,
  },
  impactEmojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryGlow2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  impactEmoji: { fontSize: 68 },
  impactTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  impactSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 4,
    marginBottom: 10,
    fontWeight: '600',
  },
  impactDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: borderRadius.xlarge,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '600',
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // ── FEATURES SLIDE ──────────────────────────
  featuresWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  featuresHeader: {
    marginBottom: 16,
  },
  featuresEmoji: {
    fontSize: 52,
    textAlign: 'center',
  },
  featuresSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  featuresTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  featuresDesc: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  featureItem: {
    width: (width - 48 - 30) / 3,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureIcon:  { fontSize: 24 },
  featureLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── ROLE SLIDE ──────────────────────────────
  roleWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  roleTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  roleDesc: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  roleCard: {
    width: (width - 48 - 10) / 2,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
    ...shadow,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleIcon: { fontSize: 28 },
  roleCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleCardDesc: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 14,
  },
  roleCheck: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  roleCheckText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '900',
  },

  // ── CTA SLIDE ───────────────────────────────
  ctaWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  ctaEmojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryGlow2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  ctaEmoji: { fontSize: 58 },
  ctaTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  ctaDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  perksList: {
    width: '100%',
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: borderRadius.large,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  perkIcon: { fontSize: 18 },
  perkText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});

// ============================================
// MAIN ONBOARDING SCREEN
// ============================================
export default function OnboardingScreen({ onFinish }) {
  const [currentSlide, setCurrentSlide]   = useState(0);
  const [selectedRole, setSelectedRole]   = useState(null);

  // Animations
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(
    new Animated.Value(1 / SLIDES.length)
  ).current;
  const emojiScale   = useRef(new Animated.Value(1)).current;
  const emojiFloat   = useRef(new Animated.Value(0)).current;
  const floatLoop    = useRef(null);

  // ── SWIPE GESTURE ───────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) &&
        Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50)      handleNext();
        else if (g.dx > 50)  handlePrev();
      },
    })
  ).current;

  // ── FLOAT ANIMATION ─────────────────────────
  useEffect(() => {
    floatLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiFloat, {
          toValue: -14,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(emojiFloat, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.current.start();
    return () => floatLoop.current?.stop();
  }, []);

  // ── SLIDE CHANGE ANIMATION ──────────────────
  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    slideAnim.setValue(24);
    emojiScale.setValue(0.75);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: (currentSlide + 1) / SLIDES.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentSlide]);

  // ── NAVIGATION ──────────────────────────────
  const handleNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onFinish();
    }
  }, [currentSlide, onFinish]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // ── COMPUTED ────────────────────────────────
  const slide  = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isDark = slide.bg === colors.dark;

  // Role slide - skip allowed if no selection
  const canProceed = useMemo(() => {
    if (slide.type === 'role') {
      return true; // Can proceed without selecting
    }
    return true;
  }, [slide.type, selectedRole]);

  // Button text
  const btnText = useMemo(() => {
    if (isLast) return '🚀 GET STARTED FREE';
    if (slide.type === 'role' && !selectedRole) {
      return 'Skip for now →';
    }
    if (slide.type === 'role' && selectedRole) {
      return 'Continue →';
    }
    return 'NEXT →';
  }, [isLast, slide.type, selectedRole]);

  // ── RENDER SLIDE CONTENT ────────────────────
  const renderSlideContent = () => {
    switch (slide.type) {
      case 'impact':
        return (
          <ImpactSlide
            slide={slide}
            emojiFloat={emojiFloat}
            emojiScale={emojiScale}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[styles.container,
        { backgroundColor: slide.bg }]}
      {...panResponder.panHandlers}>

      <StatusBar
        backgroundColor={slide.bg}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={[styles.brand,
          { color: isDark
              ? colors.primary
              : slide.accent }]}>
          ZAVARA
        </Text>
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
            onPress={onFinish}>
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

      {/* PROGRESS BAR */}
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

      {/* SLIDE CONTENT - Animated */}
      <Animated.View style={[
        styles.slideWrap,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}>
        {renderSlideContent()}
      </Animated.View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomSection}>

        {/* DOT INDICATORS */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{ top: 10, bottom: 10,
                left: 6, right: 6 }}>
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

        {/* NAV BUTTONS */}
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

          {/* NEXT */}
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

        {/* LOGIN LINK on last slide */}
        {isLast && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={onFinish}>
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

        {/* SWIPE HINT on first slide */}
        {currentSlide === 0 && (
          <Text style={[styles.swipeHint, {
            color: 'rgba(255,255,255,0.30)',
          }]}>
            ← Swipe to explore →
          </Text>
        )}
      </View>

    </View>
  );
}

// ============================================
// MAIN STYLES
// ============================================
const styles = StyleSheet.create({

  container: { flex: 1 },

  // ── TOP BAR ─────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 8,
    zIndex: 10,
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 5,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── PROGRESS ────────────────────────────────
  progressBarWrap: {
    height: 3,
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── SLIDE ───────────────────────────────────
  slideWrap: {
    flex: 1,
  },

  // ── BOTTOM ──────────────────────────────────
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  navBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 14,
  },
  prevBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 22,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowGold,
  },
  nextBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  loginLink: {
    paddingVertical: 8,
    marginBottom: 6,
  },
  loginLinkText: {
    fontSize: 13,
    textAlign: 'center',
  },
  loginLinkBold: { fontWeight: '900' },
  swipeHint: {
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 4,
  },
});