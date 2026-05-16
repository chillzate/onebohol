// ============================================
// ZAVARA TOAST - COMPLETE FIXED v2.1
// ============================================
import { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { borderRadius } from '../theme';

// 🔧 FIX: Moved outside component - stable reference
const CONFIGS = {
  success: {
    bg:         '#0D2010',
    border:     '#2ECC71',
    iconBg:     'rgba(46,204,113,0.20)',
    icon:       '✅',
    titleColor: '#2ECC71',
    msgColor:   'rgba(255,255,255,0.70)',
  },
  error: {
    bg:         '#200D0D',
    border:     '#E74C3C',
    iconBg:     'rgba(231,76,60,0.20)',
    icon:       '❌',
    titleColor: '#E74C3C',
    msgColor:   'rgba(255,255,255,0.70)',
  },
  warning: {
    bg:         '#201A0D',
    border:     '#F39C12',
    iconBg:     'rgba(243,156,18,0.20)',
    icon:       '⚠️',
    titleColor: '#F39C12',
    msgColor:   'rgba(255,255,255,0.70)',
  },
  info: {
    bg:         '#0D1520',
    border:     '#3498DB',
    iconBg:     'rgba(52,152,219,0.20)',
    icon:       'ℹ️',
    titleColor: '#3498DB',
    msgColor:   'rgba(255,255,255,0.70)',
  },
};

// 🆕 Safe top offset for notch/status bar
const TOP_OFFSET = Platform.OS === 'ios' ? 60 : 55;

export default function Toast({
  visible,
  type     = 'success',
  title,
  message,
  duration = 3000,
  onHide,
}) {
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const progress   = useRef(new Animated.Value(1)).current;

  // Track running animations for cleanup
  const showAnim   = useRef(null);
  const hideAnim   = useRef(null);
  const progressAnim = useRef(null);
  const timer      = useRef(null);

  const config = CONFIGS[type] || CONFIGS.success;

  // 🔧 FIX: hideToast defined with useCallback
  // so it's stable and can be called from useEffect
  const hideToast = useCallback(() => {
    // Stop any running animations
    showAnim.current?.stop();
    progressAnim.current?.stop();
    clearTimeout(timer.current);

    hideAnim.current = Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);

    hideAnim.current.start(({ finished }) => {
      if (finished && onHide) onHide();
    });
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      // 🔧 FIX: Always reset values before animating
      hideAnim.current?.stop();
      translateY.setValue(-140);
      opacity.setValue(0);
      progress.setValue(1);

      // Slide in
      showAnim.current = Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 60,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]);

      showAnim.current.start();

      // Progress bar shrink
      progressAnim.current = Animated.timing(progress, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      });

      progressAnim.current.start();

      // Auto hide after duration
      timer.current = setTimeout(hideToast, duration);
    }

    // Cleanup on unmount or when visible changes
    return () => {
      clearTimeout(timer.current);
      showAnim.current?.stop();
      hideAnim.current?.stop();
      progressAnim.current?.stop();
    };
  }, [visible, duration, hideToast]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        top: TOP_OFFSET, // 🔧 FIX: dynamic top
        transform: [{ translateY }],
        opacity,
        backgroundColor: config.bg,
        borderColor: config.border,
      },
    ]}>

      {/* ICON */}
      <View style={[styles.iconWrap,
        { backgroundColor: config.iconBg }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text
          style={[styles.title,
            { color: config.titleColor }]}
          numberOfLines={1}>
          {title}
        </Text>
        {message ? (
          <Text
            style={[styles.message,
              { color: config.msgColor }]}
            numberOfLines={2}>
            {message}
          </Text>
        ) : null}
      </View>

      {/* CLOSE BUTTON */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={hideToast}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* PROGRESS BAR */}
      <Animated.View style={[
        styles.progressBar,
        {
          backgroundColor: config.border,
          width: progress.interpolate({
            inputRange:  [0, 1],
            outputRange: ['0%', '100%'],
          }),
        },
      ]} />

    </Animated.View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // top is set dynamically above
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    paddingBottom: 20, // extra space for progress bar
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '900',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
});