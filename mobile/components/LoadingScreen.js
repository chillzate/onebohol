// ============================================
// components/LoadingScreen.js - v2.0
// ✅ Animation cleanup on unmount (memory leak fixed)
// ✅ Retry button improved
// ============================================
import {
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { colors, borderRadius } from '../theme';

export default function LoadingScreen({
  onRetry,
  showRetry,
}) {
  const logoScale     = useRef(new Animated.Value(0.5)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const lineWidth     = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const shimmer       = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;
  const retryOpacity  = useRef(new Animated.Value(0)).current;
  const retrySlide    = useRef(new Animated.Value(30)).current;

  // ✅ Store animation references for cleanup
  const shimmerAnimRef = useRef(null);
  const pulseAnimRef   = useRef(null);

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue:         1,
          friction:        6,
          tension:         35,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue:         1,
          duration:        900,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue:         60,
        duration:        500,
        useNativeDriver: false,
      }),
      Animated.timing(tagOpacity, {
        toValue:         1,
        duration:        450,
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue:         1,
        duration:        350,
        useNativeDriver: true,
      }),
    ]).start();

    // ✅ Store loop animations for cleanup
    shimmerAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue:         1,
          duration:        2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue:         0,
          duration:        2500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimRef.current.start();

    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue:         1.4,
          duration:        600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue:         1,
          duration:        600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimRef.current.start();

    // ✅ CLEANUP - stops memory leak!
    return () => {
      shimmerAnimRef.current?.stop();
      pulseAnimRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (showRetry) {
      Animated.parallel([
        Animated.timing(retryOpacity, {
          toValue:         1,
          duration:        500,
          useNativeDriver: true,
        }),
        Animated.spring(retrySlide, {
          toValue:         0,
          friction:        8,
          tension:         40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      retryOpacity.setValue(0);
      retrySlide.setValue(30);
    }
  }, [showRetry]);

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      <Animated.View style={[styles.logoSection, {
        opacity:   logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <View style={styles.glowCircle}>
          <View style={styles.glowCircleInner} />
        </View>
        <Animated.Text style={[styles.brand, {
          opacity: shimmer.interpolate({
            inputRange:  [0, 0.5, 1],
            outputRange: [1, 0.65, 1],
          }),
        }]}>
          ZAVARA
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[
        styles.line,
        { width: lineWidth },
      ]} />

      <Animated.Text style={[
        styles.tagline,
        { opacity: tagOpacity },
      ]}>
        THE ISLAND'S PULSE
      </Animated.Text>

      <Animated.View style={[
        styles.dotsWrap,
        { opacity: bottomOpacity },
      ]}>
        <Animated.View style={[
          styles.dot,
          { transform: [{ scale: pulseAnim }] },
        ]} />
        <View style={[styles.dot, styles.dotFade2]} />
        <View style={[styles.dot, styles.dotFade3]} />
      </Animated.View>

      <Animated.View style={[
        styles.bottomWrap,
        { opacity: bottomOpacity },
      ]}>
        <Text style={styles.bottomText}>
          Bohol, Philippines 🌴
        </Text>
      </Animated.View>

      {showRetry && (
        <Animated.View style={[styles.retryWrap, {
          opacity:   retryOpacity,
          transform: [{ translateY: retrySlide }],
        }]}>
          <Text style={styles.retryWifiIcon}>📵</Text>
          <Text style={styles.retryOfflineTitle}>
            No Internet Connection
          </Text>
          <Text style={styles.retryOfflineText}>
            Check your load or WiFi then retry
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            activeOpacity={0.75}>
            <Text style={styles.retryBtnText}>
              ↻  TAP TO RETRY
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    backgroundColor: colors.dark,
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems:   'center',
    marginBottom: 28,
    position:     'relative',
  },
  glowCircle: {
    position:        'absolute',
    width:           220,
    height:          220,
    borderRadius:    110,
    backgroundColor: colors.primaryGlow2,
    alignItems:      'center',
    justifyContent:  'center',
  },
  glowCircleInner: {
    width:           150,
    height:          150,
    borderRadius:    75,
    backgroundColor: colors.primaryGlow,
  },
  brand: {
    fontSize:        52,
    fontWeight:      '900',
    color:           colors.primary,
    letterSpacing:   14,
    textShadowColor: 'rgba(196,149,30,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  line: {
    height:          2,
    backgroundColor: colors.primary,
    marginBottom:    18,
    borderRadius:    2,
    opacity:         0.65,
  },
  tagline: {
    fontSize:     10,
    color:        'rgba(255,255,255,0.38)',
    letterSpacing: 6,
    marginBottom: 64,
    fontWeight:   '600',
  },
  dotsWrap: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  64,
  },
  dot: {
    width:           9,
    height:          9,
    borderRadius:    5,
    backgroundColor: colors.primary,
  },
  dotFade2: { opacity: 0.45 },
  dotFade3: { opacity: 0.18 },
  bottomWrap: {
    position: 'absolute',
    bottom:   52,
  },
  bottomText: {
    color:         'rgba(255,255,255,0.20)',
    fontSize:      11,
    letterSpacing: 1.8,
    fontWeight:    '500',
  },
  retryWrap: {
    position:          'absolute',
    bottom:            100,
    alignItems:        'center',
    paddingHorizontal: 32,
    width:             '100%',
  },
  retryWifiIcon: {
    fontSize:     36,
    marginBottom: 10,
  },
  retryOfflineTitle: {
    color:        'rgba(255,255,255,0.75)',
    fontSize:     15,
    fontWeight:   '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  retryOfflineText: {
    color:         'rgba(255,255,255,0.35)',
    fontSize:      11,
    marginBottom:  20,
    letterSpacing: 0.3,
    textAlign:     'center',
  },
  retryBtn: {
    paddingHorizontal: 32,
    paddingVertical:   14,
    borderRadius:      28,
    borderWidth:       1.5,
    borderColor:       colors.primary + '80',
    backgroundColor:   colors.primary + '15',
  },
  retryBtnText: {
    color:         colors.primary,
    fontSize:      13,
    fontWeight:    '900',
    letterSpacing: 2.5,
  },
});