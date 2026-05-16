// ============================================
// ZAVARA ONBOARDING - COMPLETE FIXED v2.1
// ============================================
import {
  useState,
  useRef,
  useEffect,
  useCallback,
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
} from 'react-native';
import {
  colors,
  borderRadius,
  shadowGold,
} from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id:       1,
    emoji:    '🌴',
    title:    'Welcome to ZAVARA',
    subtitle: "BOHOL'S SUPER APP",
    desc:     "Everything you need in Bohol — food, transport, market, tourism and more. All in one app.",
    bg:       '#FFFBF2',
    accent:   colors.primary,
    iconBg:   colors.primaryPale,
    tag:      "THE ISLAND'S PULSE",
  },
  {
    id:       2,
    emoji:    '🍴',
    title:    'Order Delicious Food',
    subtitle: 'CUISINE PARTNER',
    desc:     'From local carinderias to premium restaurants — hot food delivered straight to your door.',
    bg:       '#FFF8F5',
    accent:   colors.cuisineColor,
    iconBg:   colors.cuisineBg,
    tag:      'FOOD DELIVERY',
  },
  {
    id:       3,
    emoji:    '🌾',
    title:    'Support Local Farmers',
    subtitle: 'HARVEST MARKET',
    desc:     "Buy fresh produce directly from Bohol's farmers and fishermen. Farm to table, the ZAVARA way.",
    bg:       '#F5FBF7',
    accent:   colors.farmerColor,
    iconBg:   colors.farmerBg,
    tag:      'FRESH & LOCAL',
  },
  {
    id:       4,
    emoji:    '🚐',
    title:    'Swift Transport',
    subtitle: 'SWIFT PARTNER',
    desc:     'Book a ride or delivery anywhere in Bohol. Fast, safe, and reliable transport partners.',
    bg:       '#F5F8FD',
    accent:   colors.riderColor,
    iconBg:   colors.riderBg,
    tag:      'GO ANYWHERE',
  },
  {
    id:       5,
    emoji:    '🏨',
    title:    'Explore Bohol',
    subtitle: 'HAVEN & TOURISM',
    desc:     'Discover hotels, resorts, and hidden gems. Experience Bohol like never before with ZAVARA.',
    bg:       '#F8F5FD',
    accent:   colors.havenColor,
    iconBg:   colors.havenBg,
    tag:      'DISCOVER BOHOL',
  },
  {
    id:       6,
    emoji:    '🚀',
    title:    'Ready to Start?',
    subtitle: 'JOIN ZAVARA TODAY',
    desc:     "Create your free account and be part of Bohol's fastest growing super app community.",
    bg:       '#FFFBF2',
    accent:   colors.primary,
    iconBg:   colors.primaryPale,
    tag:      'GET STARTED FREE',
  },
];

export default function OnboardingScreen({ onFinish }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── ANIMATIONS ──────────────────────────────
  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(
    1 / SLIDES.length
  )).current;
  const emojiScale  = useRef(new Animated.Value(1)).current;
  const emojiFloat  = useRef(new Animated.Value(0)).current;
  const floatLoop   = useRef(null); // 🔧 Track loop for cleanup

  // ── SWIPE GESTURE ───────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // 🔧 FIX: Only claim responder for horizontal swipes
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) &&
        Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) handleNext();
        else if (g.dx > 50) handlePrev();
      },
    })
  ).current;

  // ── FLOAT ANIMATION (runs once) ─────────────
  useEffect(() => {
    floatLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiFloat, {
          toValue: -12,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(emojiFloat, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.current.start();

    // 🔧 FIX: Cleanup on unmount
    return () => {
      floatLoop.current?.stop();
    };
  }, []);

  // ── SLIDE CHANGE ANIMATION ──────────────────
  useEffect(() => {
    startAnimations();
  }, [currentSlide]);

  const startAnimations = useCallback(() => {
    // Reset values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    slideAnim.setValue(30);
    emojiScale.setValue(0.7);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
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

    // Progress bar
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

  // ── RENDER ──────────────────────────────────
  const slide  = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View
      style={[styles.container, { backgroundColor: slide.bg }]}
      {...panResponder.panHandlers}>

      <StatusBar
        backgroundColor={slide.bg}
        barStyle="dark-content"
      />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={[styles.brand,
          { color: slide.accent }]}>
          ZAVARA
        </Text>
        {!isLast && (
          <TouchableOpacity
            style={[styles.skipBtn, {
              borderColor: slide.accent + '30',
              backgroundColor: slide.iconBg,
            }]}
            onPress={onFinish}>
            <Text style={[styles.skipText,
              { color: slide.accent }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressBarWrap}>
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

      {/* SLIDE CONTENT */}
      <Animated.View style={[
        styles.slideContent,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}>

        {/* TAG */}
        <View style={[styles.tagWrap, {
          backgroundColor: slide.iconBg,
          borderColor: slide.accent + '25',
        }]}>
          <Text style={[styles.tagText,
            { color: slide.accent }]}>
            ✦ {slide.tag}
          </Text>
        </View>

        {/* EMOJI CIRCLE */}
        <Animated.View style={[
          styles.emojiCircle,
          {
            backgroundColor: slide.iconBg,
            borderColor: slide.accent + '20',
            transform: [
              { scale: emojiScale },
              { translateY: emojiFloat },
            ],
          },
        ]}>
          {/* OUTER RING */}
          <View style={[styles.emojiRing,
            { borderColor: slide.accent + '15' }]} />
          <Text style={styles.emojiText}>
            {slide.emoji}
          </Text>
        </Animated.View>

        {/* SUBTITLE */}
        <Text style={[styles.slideSubtitle,
          { color: slide.accent }]}>
          {slide.subtitle}
        </Text>

        {/* TITLE */}
        <Text style={styles.slideTitle}>
          {slide.title}
        </Text>

        {/* DESCRIPTION */}
        <Text style={styles.slideDesc}>
          {slide.desc}
        </Text>

      </Animated.View>

      {/* BOTTOM SECTION */}
      <View style={styles.bottomSection}>

        {/* DOT INDICATORS */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{
                top: 8, bottom: 8,
                left: 4, right: 4,
              }}>
              <View style={[
                styles.dot,
                i === currentSlide && [
                  styles.dotActive,
                  { backgroundColor: slide.accent },
                ],
                i < currentSlide && [
                  styles.dotDone,
                  { backgroundColor: slide.accent + '45' },
                ],
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* NAVIGATION BUTTONS */}
        <View style={styles.navBtns}>

          {/* PREV */}
          {currentSlide > 0 ? (
            <TouchableOpacity
              style={[styles.prevBtn, {
                borderColor: slide.accent + '30',
                backgroundColor: slide.iconBg,
              }]}
              onPress={handlePrev}>
              <Text style={[styles.prevBtnText,
                { color: slide.accent }]}>
                ←
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56 }} />
          )}

          {/* NEXT / GET STARTED */}
          <TouchableOpacity
            style={[styles.nextBtn,
              { backgroundColor: slide.accent }]}
            onPress={handleNext}
            activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {isLast ? '🚀 GET STARTED' : 'NEXT →'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* LOGIN LINK (last slide only) */}
        {isLast && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={onFinish}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={[styles.loginLinkBold,
                { color: slide.accent }]}>
                Login here
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* SWIPE HINT (first slide only) */}
        {currentSlide === 0 && (
          <Text style={styles.swipeHint}>
            ← Swipe to explore →
          </Text>
        )}

      </View>

    </View>
  );
}

// ============================================
// STYLES
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

  // ── PROGRESS BAR ────────────────────────────
  progressBarWrap: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── SLIDE CONTENT ───────────────────────────
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // ── TAG ─────────────────────────────────────
  tagWrap: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginBottom: 28,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // ── EMOJI ───────────────────────────────────
  emojiCircle: {
    width: 155,
    height: 155,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    position: 'relative',
  },
  emojiRing: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 1,
  },
  emojiText: { fontSize: 70 },

  // ── TEXT ────────────────────────────────────
  slideSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
  },
  slideTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  slideDesc: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 4,
  },

  // ── BOTTOM ──────────────────────────────────
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },

  // ── DOTS ────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  dotDone: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── NAV BUTTONS ─────────────────────────────
  navBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginBottom: 16,
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
    letterSpacing: 0.8,
  },

  // ── LOGIN LINK ──────────────────────────────
  loginLink: {
    paddingVertical: 8,
    marginBottom: 6,
  },
  loginLinkText: {
    color: colors.textLight,
    fontSize: 13,
    textAlign: 'center',
  },
  loginLinkBold: { fontWeight: '900' },

  // ── SWIPE HINT ──────────────────────────────
  swipeHint: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 4,
  },
});
