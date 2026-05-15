import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { colors, borderRadius, shadowStrong, shadowDark } from '../theme';

// ============================================
// BASE MODAL COMPONENT (reusable)
// ============================================
function BaseModal({ visible, onClose, children }) {
  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
      translateY.setValue(30);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={modalStyles.overlay}>
        <Animated.View style={[
          modalStyles.card,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}>
          {/* CLOSE BUTTON */}
          <TouchableOpacity
            style={modalStyles.closeBtn}
            onPress={onClose}>
            <Text style={modalStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// SUCCESS MODAL
// ============================================
export function SuccessModal({ visible, onClose, title, message }) {
  return (
    <BaseModal visible={visible} onClose={onClose}>

      <View style={[modalStyles.iconCircle,
        { backgroundColor: colors.successLight,
          borderColor: colors.success + '40' }]}>
        <Text style={modalStyles.iconEmoji}>🎉</Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <TouchableOpacity
        style={[modalStyles.primaryBtn,
          { backgroundColor: colors.success }]}
        onPress={onClose}>
        <Text style={modalStyles.primaryBtnText}>Got It! ✓</Text>
      </TouchableOpacity>

    </BaseModal>
  );
}

// ============================================
// ERROR MODAL
// ============================================
export function ErrorModal({
  visible, onClose, title, message
}) {
  return (
    <BaseModal visible={visible} onClose={onClose}>

      <View style={[modalStyles.iconCircle,
        { backgroundColor: colors.dangerLight,
          borderColor: colors.danger + '40' }]}>
        <Text style={modalStyles.iconEmoji}>⚠️</Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <TouchableOpacity
        style={[modalStyles.primaryBtn,
          { backgroundColor: colors.danger }]}
        onPress={onClose}>
        <Text style={modalStyles.primaryBtnText}>
          Try Again
        </Text>
      </TouchableOpacity>

    </BaseModal>
  );
}

// ============================================
// ORDER SUCCESS MODAL
// ============================================
export function OrderSuccessModal({
  visible, onClose, total, onTrack,
}) {
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounce.setValue(1);
    }
  }, [visible]);

  return (
    <BaseModal visible={visible} onClose={onClose}>

      {/* BOUNCING EMOJI */}
      <Animated.View style={[
        modalStyles.celebrationCircle,
        { transform: [{ scale: bounce }] },
      ]}>
        <Text style={modalStyles.celebrationEmoji}>🎉</Text>
      </Animated.View>

      {/* TITLES */}
      <Text style={modalStyles.orderSuccessTitle}>
        Order Placed!
      </Text>
      <Text style={modalStyles.orderSuccessSubtitle}>
        ₱{total} • Cash on Delivery
      </Text>

      {/* DIVIDER */}
      <View style={modalStyles.divider} />

      {/* RIDER CARD */}
      <View style={modalStyles.riderCard}>
        <View style={modalStyles.riderIconWrap}>
          <Text style={modalStyles.riderIconText}>🛵</Text>
        </View>
        <View style={modalStyles.riderInfo}>
          <Text style={modalStyles.riderTitle}>
            Rider is on the way!
          </Text>
          <Text style={modalStyles.riderEta}>
            ⏱️ Est. 30-45 minutes
          </Text>
        </View>
        <View style={modalStyles.riderStatusDot} />
      </View>

      {/* STEPS */}
      <View style={modalStyles.stepsRow}>
        {[
          { icon: '📝', label: 'Ordered'  },
          { icon: '👨‍🍳', label: 'Cooking'  },
          { icon: '🛵', label: 'Delivery' },
          { icon: '✅', label: 'Done'     },
        ].map((step, i) => (
          <View key={i} style={modalStyles.stepItem}>
            <View style={[
              modalStyles.stepDot,
              i === 0 && modalStyles.stepDotActive,
            ]}>
              <Text style={modalStyles.stepIcon}>
                {step.icon}
              </Text>
            </View>
            <Text style={modalStyles.stepLabel}>
              {step.label}
            </Text>
            {i < 3 && (
              <View style={modalStyles.stepLine} />
            )}
          </View>
        ))}
      </View>

      {/* BUTTONS */}
      <TouchableOpacity
        style={modalStyles.primaryBtn}
        onPress={onTrack || onClose}>
        <Text style={modalStyles.primaryBtnText}>
          📦 Track My Order
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={modalStyles.secondaryBtn}
        onPress={onClose}>
        <Text style={modalStyles.secondaryBtnText}>
          Back to Home
        </Text>
      </TouchableOpacity>

    </BaseModal>
  );
}

// ============================================
// STYLES
// ============================================
const modalStyles = StyleSheet.create({

  // ── OVERLAY ───────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // ── CARD ──────────────────────────────────
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.huge,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowStrong,
  },

  // ── CLOSE BUTTON ──────────────────────────
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: '900',
  },

  // ── ICON CIRCLE ───────────────────────────
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 8,
    borderWidth: 2,
  },
  iconEmoji: { fontSize: 40 },

  // ── TEXT ──────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // ── PRIMARY BUTTON ────────────────────────
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: borderRadius.large,
    width: '100%',
    alignItems: 'center',
    ...shadowStrong,
  },
  primaryBtnText: {
    color: colors.dark,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // ── SECONDARY BUTTON ──────────────────────
  secondaryBtn: {
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryBtnText: {
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── ORDER SUCCESS SPECIFIC ─────────────────
  celebrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.borderGold2,
    ...shadowStrong,
  },
  celebrationEmoji: { fontSize: 50 },

  orderSuccessTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 6,
  },
  orderSuccessSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    fontWeight: '600',
    marginBottom: 20,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
    opacity: 0.6,
  },

  // ── RIDER CARD ────────────────────────────
  riderCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 12,
    ...shadowDark,
  },
  riderIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  riderIconText: { fontSize: 24 },
  riderInfo: { flex: 1 },
  riderTitle: {
    color: colors.textCream,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  riderEta: {
    color: colors.textLight,
    fontSize: 11,
  },
  riderStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },

  // ── ORDER STEPS ───────────────────────────
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
    position: 'relative',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  stepIcon: { fontSize: 16 },
  stepLabel: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 18,
    left: '50%',
    right: '-50%',
    height: 1,
    backgroundColor: colors.border,
    zIndex: 0,
  },
});