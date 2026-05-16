// ============================================
// ZAVARA TOAST.JS - v3.1 + HAPTICS
// ============================================
import {
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics'; // ✅ ADD THIS
import { borderRadius } from '../theme';

// ============================================
// CONSTANTS
// ============================================
const TOP_OFFSET   = Platform.OS === 'ios' ? 60 : 55;
const HIDE_DISTANCE = -160;

const CONFIGS = {
  success: {
    bg:         '#0D2010',
    border:     '#2ECC71',
    iconBg:     'rgba(46,204,113,0.18)',
    icon:       '✅',
    titleColor: '#2ECC71',
    msgColor:   'rgba(255,255,255,0.65)',
    progress:   '#2ECC71',
    // ✅ Haptic type for each toast
    haptic:     'success',
  },
  error: {
    bg:         '#200D0D',
    border:     '#E74C3C',
    iconBg:     'rgba(231,76,60,0.18)',
    icon:       '❌',
    titleColor: '#E74C3C',
    msgColor:   'rgba(255,255,255,0.65)',
    progress:   '#E74C3C',
    haptic:     'error',
  },
  warning: {
    bg:         '#201A0D',
    border:     '#F39C12',
    iconBg:     'rgba(243,156,18,0.18)',
    icon:       '⚠️',
    titleColor: '#F39C12',
    msgColor:   'rgba(255,255,255,0.65)',
    progress:   '#F39C12',
    haptic:     'warning',
  },
  info: {
    bg:         '#0D1520',
    border:     '#3498DB',
    iconBg:     'rgba(52,152,219,0.18)',
    icon:       'ℹ️',
    titleColor: '#3498DB',
    msgColor:   'rgba(255,255,255,0.65)',
    progress:   '#3498DB',
    haptic:     'light',
  },
};

// ============================================
// HAPTIC TRIGGER FUNCTION
// Called when toast appears
// ============================================
async function triggerHaptic(type) {
  try {
    switch (type) {
      case 'success':
        // ✅ Double tap feeling = success
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        break;

      case 'error':
        // ❌ Strong vibration = error
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
        break;

      case 'warning':
        // ⚠️ Medium warning vibration
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        break;

      case 'light':
        // ℹ️ Soft tap = info
        await Haptics.impactAsync(
          Haptics.ImpactFeedbackStyle.Light
        );
        break;

      default:
        await Haptics.impactAsync(
          Haptics.ImpactFeedbackStyle.Light
        );
    }
  } catch {
    // Haptics not available on this device
    // Silently fail - never crash for haptics
  }
}

// ============================================
// TOAST COMPONENT
// ============================================
export default function Toast({
  visible,
  type     = 'success',
  title,
  message,
  duration = 3000,
  onHide,
}) {
  const translateY   = useRef(new Animated.Value(HIDE_DISTANCE)).current;
  const opacity      = useRef(new Animated.Value(0)).current;
  const scale        = useRef(new Animated.Value(0.92)).current;
  const progress     = useRef(new Animated.Value(1)).current;
  const dragY        = useRef(new Animated.Value(0)).current;

  const showAnim     = useRef(null);
  const hideAnim     = useRef(null);
  const progressAnim = useRef(null);
  const timer        = useRef(null);

  const config = CONFIGS[type] || CONFIGS.info;

  // ── HIDE ────────────────────────────────────
  const hideToast = useCallback(() => {
    showAnim.current?.stop();
    progressAnim.current?.stop();
    clearTimeout(timer.current);

    hideAnim.current = Animated.parallel([
      Animated.timing(translateY, {
        toValue:  HIDE_DISTANCE,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:  0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue:  0.92,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

    hideAnim.current.start(({ finished }) => {
      if (finished) {
        dragY.setValue(0);
        onHide?.();
      }
    });
  }, [onHide]);

  // ── SWIPE TO DISMISS ────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) =>
        Math.abs(g.dy) > 5 && g.dy < 0,

      onPanResponderMove: (_, g) => {
        if (g.dy < 0) dragY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy < -40 || g.vy < -0.5) {
          // ✅ Haptic on swipe dismiss
          Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium
          ).catch(() => {});
          hideToast();
        } else {
          Animated.spring(dragY, {
            toValue:  0,
            friction: 8,
            tension:  80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ── SHOW / HIDE EFFECT ──────────────────────
  useEffect(() => {
    if (visible) {
      hideAnim.current?.stop();

      translateY.setValue(HIDE_DISTANCE);
      opacity.setValue(0);
      scale.setValue(0.88);
      progress.setValue(1);
      dragY.setValue(0);

      // ✅ HAPTIC FIRES HERE when toast appears
      triggerHaptic(config.haptic);

      // Entrance animation
      showAnim.current = Animated.parallel([
        Animated.spring(translateY, {
          toValue:  0,
          friction: 10,
          tension:  70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:  1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue:  1,
          friction: 8,
          tension:  60,
          useNativeDriver: true,
        }),
      ]);
      showAnim.current.start();

      // Progress bar
      progressAnim.current = Animated.timing(progress, {
        toValue:  0,
        duration: duration,
        useNativeDriver: false,
      });
      progressAnim.current.start();

      // Auto hide
      timer.current = setTimeout(hideToast, duration);
    }

    return () => {
      clearTimeout(timer.current);
      showAnim.current?.stop();
      hideAnim.current?.stop();
      progressAnim.current?.stop();
    };
  }, [visible, duration, hideToast, config.haptic]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, {
        top:             TOP_OFFSET,
        backgroundColor: config.bg,
        borderColor:     config.border,
        transform: [
          { translateY: Animated.add(translateY, dragY) },
          { scale },
        ],
        opacity,
      }]}
      {...panResponder.panHandlers}>

      {/* Left accent bar */}
      <View style={[styles.accentLine,
        { backgroundColor: config.border }]} />

      {/* Icon */}
      <View style={[styles.iconWrap,
        { backgroundColor: config.iconBg }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.content}>
        <Text
          style={[styles.title,
            { color: config.titleColor }]}
          numberOfLines={1}>
          {title}
        </Text>
        {!!message && (
          <Text
            style={[styles.message,
              { color: config.msgColor }]}
            numberOfLines={2}>
            {message}
          </Text>
        )}
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => {
          // ✅ Haptic on manual close too
          Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light
          ).catch(() => {});
          hideToast();
        }}
        hitSlop={{ top: 10, bottom: 10,
          left: 10, right: 10 }}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <Animated.View style={[styles.progressBar, {
        backgroundColor: config.progress,
        width: progress.interpolate({
          inputRange:  [0, 1],
          outputRange: ['0%', '100%'],
        }),
      }]} />

      {/* Swipe pill */}
      <View style={styles.swipePill} />

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:      'absolute',
    left:          14,
    right:         14,
    zIndex:        9999,
    borderRadius:  borderRadius.xlarge,
    borderWidth:   1,
    padding:       14,
    paddingBottom: 18,
    paddingLeft:   10,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.40,
    shadowRadius:  24,
    elevation:     18,
    overflow:      'hidden',
  },
  accentLine: {
    position:                   'absolute',
    left:                       0,
    top:                        0,
    bottom:                     0,
    width:                      4,
    borderTopLeftRadius:        borderRadius.xlarge,
    borderBottomLeftRadius:     borderRadius.xlarge,
  },
  iconWrap: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginLeft:     4,
  },
  icon:    { fontSize: 20 },
  content: { flex: 1 },
  title: {
    fontSize:      14,
    fontWeight:    '900',
    marginBottom:  2,
    letterSpacing: 0.2,
  },
  message: {
    fontSize:   12,
    lineHeight: 17,
  },
  closeBtn: {
    width:          28,
    height:         28,
    borderRadius:   9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  closeBtnText: {
    color:      'rgba(255,255,255,0.50)',
    fontSize:   11,
    fontWeight: '900',
  },
  progressBar: {
    position:     'absolute',
    bottom:       0,
    left:         0,
    height:       3,
    borderRadius: 2,
    opacity:      0.85,
  },
  swipePill: {
    position:        'absolute',
    top:             6,
    width:           36,
    height:          3,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf:       'center',
    left:            '50%',
    marginLeft:      -18,
  },
});