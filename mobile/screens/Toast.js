import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { borderRadius } from '../theme';

const CONFIGS = {
  success: {
    bg:          '#0D2010',
    border:      '#2ECC71',
    iconBg:      'rgba(46,204,113,0.2)',
    icon:        '✅',
    titleColor:  '#2ECC71',
    msgColor:    'rgba(255,255,255,0.65)',
  },
  error: {
    bg:          '#200D0D',
    border:      '#E74C3C',
    iconBg:      'rgba(231,76,60,0.2)',
    icon:        '❌',
    titleColor:  '#E74C3C',
    msgColor:    'rgba(255,255,255,0.65)',
  },
  warning: {
    bg:          '#201A0D',
    border:      '#F39C12',
    iconBg:      'rgba(243,156,18,0.2)',
    icon:        '⚠️',
    titleColor:  '#F39C12',
    msgColor:    'rgba(255,255,255,0.65)',
  },
  info: {
    bg:          '#0D1520',
    border:      '#3498DB',
    iconBg:      'rgba(52,152,219,0.2)',
    icon:        'ℹ️',
    titleColor:  '#3498DB',
    msgColor:    'rgba(255,255,255,0.65)',
  },
};

export default function Toast({
  visible,
  type = 'success',
  title,
  message,
  duration = 3000,
  onHide,
}) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const progress   = useRef(new Animated.Value(1)).current;

  const config = CONFIGS[type] || CONFIGS.success;

  useEffect(() => {
    if (visible) {
      progress.setValue(1);

      Animated.parallel([
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
      ]).start();

      // Progress bar shrink
      Animated.timing(progress, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(hideToast, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => { if (onHide) onHide(); });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
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
        <Text style={[styles.title,
          { color: config.titleColor }]}>
          {title}
        </Text>
        {message ? (
          <Text style={[styles.message,
            { color: config.msgColor }]}>
            {message}
          </Text>
        ) : null}
      </View>

      {/* CLOSE */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={hideToast}>
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    paddingBottom: 18,
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
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '900',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
});