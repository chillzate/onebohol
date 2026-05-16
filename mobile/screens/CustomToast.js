// ============================================
// ZAVARA CUSTOM TOAST - COMPLETE FIXED v2.1
// ============================================
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import {
  colors,
  borderRadius,
  shadowStrong,
  shadowGold,
  shadowDark,
} from '../theme';

// ============================================
// BASE MODAL COMPONENT (reusable)
// ============================================
function BaseModal({ visible, onClose, children }) {
  const scale      = useRef(new Animated.Value(0.85)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      // Reset first
      scale.setValue(0.85);
      opacity.setValue(0);
      translateY.setValue(30);

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
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
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
export function SuccessModal({
  visible,
  onClose,
  title,
  message,
}) {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={[modalStyles.iconCircle, {
        backgroundColor: colors.successLight,
        borderColor: colors.success + '40',
      }]}>
        <Text style={modalStyles.iconEmoji}>✅</Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <TouchableOpacity
        style={[modalStyles.primaryBtn, {
          backgroundColor: colors.success,
        }]}
        onPress={onClose}>
        <Text style={modalStyles.primaryBtnText}>
          Got It! ✓
        </Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

// ============================================
// ERROR MODAL
// ============================================
export function ErrorModal({
  visible,
  onClose,
  title,
  message,
}) {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={[modalStyles.iconCircle, {
        backgroundColor: colors.dangerLight,
        borderColor: colors.danger + '40',
      }]}>
        <Text style={modalStyles.iconEmoji}>⚠️</Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <TouchableOpacity
        style={[modalStyles.primaryBtn, {
          backgroundColor: colors.danger,
        }]}
        onPress={onClose}>
        <Text style={modalStyles.primaryBtnText}>
          Try Again
        </Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

// ============================================
// 🆕 CONFIRM MODAL (for destructive actions)
// ============================================
export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  dangerous   = false,
}) {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={[modalStyles.iconCircle, {
        backgroundColor: dangerous
          ? colors.dangerLight
          : colors.primaryGlow,
        borderColor: dangerous
          ? colors.danger + '40'
          : colors.borderGold,
      }]}>
        <Text style={modalStyles.iconEmoji}>
          {dangerous ? '⚠️' : '❓'}
        </Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <View style={modalStyles.confirmBtns}>
        <TouchableOpacity
          style={modalStyles.cancelBtn}
          onPress={onClose}>
          <Text style={modalStyles.cancelBtnText}>
            {cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.confirmBtn, {
            backgroundColor: dangerous
              ? colors.danger
              : colors.primary,
          }]}
          onPress={() => {
            onConfirm?.();
            onClose?.();
          }}>
          <Text style={modalStyles.primaryBtnText}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

// ============================================
// 🆕 INFO MODAL
// ============================================
export function InfoModal({
  visible,
  onClose,
  title,
  message,
}) {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={[modalStyles.iconCircle, {
        backgroundColor: colors.infoPale,
        borderColor: colors.info + '40',
      }]}>
        <Text style={modalStyles.iconEmoji}>ℹ️</Text>
      </View>

      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.message}>{message}</Text>

      <TouchableOpacity
        style={[modalStyles.primaryBtn, {
          backgroundColor: colors.info,
        }]}
        onPress={onClose}>
        <Text style={modalStyles.primaryBtnText}>
          OK
        </Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

// ============================================
// ORDER SUCCESS MODAL (FIXED)
// ============================================
export function OrderSuccessModal({
  visible,
  onClose,
  total,
  onTrack,
  paymentMethod = 'cod', // 🔧 FIX: actual payment method
  orderType = 'food',    // 🆕 food or market
}) {
  const bounce = useRef(new Animated.Value(1)).current;
  const loop   = useRef(null);

  useEffect(() => {
    if (visible) {
      // Reset
      bounce.setValue(1);
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: 1.12,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      bounce.setValue(1);
    }
    // Cleanup on unmount
    return () => loop.current?.stop();
  }, [visible]);

  // 🔧 FIX: Dynamic payment display
  const getPaymentLabel = () => {
    if (paymentMethod === 'gcash') return '📱 GCash';
    return '💵 Cash on Delivery';
  };

  // 🆕 Dynamic steps for food vs market
  const getSteps = () => {
    if (orderType === 'market') {
      return [
        { icon: '📝', label: 'Ordered'  },
        { icon: '✅', label: 'Confirmed' },
        { icon: '🌾', label: 'Ready'    },
        { icon: '🛵', label: 'Delivery' },
        { icon: '✅', label: 'Done'     },
      ];
    }
    return [
      { icon: '📝', label: 'Ordered'  },
      { icon: '👨‍🍳', label: 'Cooking'  },
      { icon: '🛵', label: 'Delivery' },
      { icon: '✅', label: 'Done'     },
    ];
  };

  const steps = getSteps();

  return (
    <BaseModal visible={visible} onClose={onClose}>

      {/* BOUNCING EMOJI */}
      <Animated.View style={[
        modalStyles.celebrationCircle,
        { transform: [{ scale: bounce }] },
      ]}>
        <Text style={modalStyles.celebrationEmoji}>
          🎉
        </Text>
      </Animated.View>

      {/* TITLE */}
      <Text style={modalStyles.orderSuccessTitle}>
        Order Placed!
      </Text>
      <Text style={modalStyles.orderSuccessSubtitle}>
        ₱{total} • {getPaymentLabel()}
      </Text>

      <View style={modalStyles.divider} />

      {/* RIDER / DELIVERY CARD */}
      <View style={modalStyles.riderCard}>
        <View style={modalStyles.riderIconWrap}>
          <Text style={modalStyles.riderIconText}>
            {orderType === 'market' ? '🌾' : '🛵'}
          </Text>
        </View>
        <View style={modalStyles.riderInfo}>
          <Text style={modalStyles.riderTitle}>
            {orderType === 'market'
              ? 'Seller will prepare your order!'
              : 'Rider is on the way!'}
          </Text>
          <Text style={modalStyles.riderEta}>
            ⏱️ Est.{' '}
            {orderType === 'market'
              ? '1-2 hours' : '30-45 minutes'}
          </Text>
        </View>
        <View style={modalStyles.riderStatusDot} />
      </View>

      {/* STEPS TRACKER */}
      <View style={modalStyles.stepsRow}>
        {steps.map((step, i) => (
          <View key={i} style={modalStyles.stepItem}>
            {/* CONNECTOR LINE (before dot) */}
            {i > 0 && (
              <View style={modalStyles.stepLineLeft} />
            )}
            {/* DOT */}
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
          </View>
        ))}
      </View>

      {/* GCash note */}
      {paymentMethod === 'gcash' && (
        <View style={modalStyles.gcashNote}>
          <Text style={modalStyles.gcashNoteText}>
            📱 Please upload your GCash receipt
            in order details
          </Text>
        </View>
      )}

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
          Continue Shopping
        </Text>
      </TouchableOpacity>

    </BaseModal>
  );
}

// ============================================
// 🆕 LOADING MODAL
// ============================================
export function LoadingModal({ visible, message = 'Loading...' }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spin.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.loadingCard}>
          <Animated.Text style={[
            modalStyles.loadingSpinner,
            {
              transform: [{
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              }],
            },
          ]}>
            ⚙️
          </Animated.Text>
          <Text style={modalStyles.loadingMessage}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const modalStyles = StyleSheet.create({

  // ── OVERLAY ─────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // ── CARD ────────────────────────────────────
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

  // ── CLOSE BUTTON ────────────────────────────
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

  // ── ICON CIRCLE ─────────────────────────────
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

  // ── TEXT ────────────────────────────────────
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

  // ── PRIMARY BUTTON ──────────────────────────
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: borderRadius.large,
    width: '100%',
    alignItems: 'center',
    ...shadowGold,
  },
  // 🔧 FIX: was colors.dark, now textWhite
  primaryBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // ── SECONDARY BUTTON ────────────────────────
  secondaryBtn: {
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryBtnText: {
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 13,
  },

  // 🆕 CONFIRM BUTTONS ────────────────────────
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textMedium,
    fontWeight: '800',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: borderRadius.large,
    alignItems: 'center',
  },

  // ── ORDER SUCCESS ───────────────────────────
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
    ...shadowGold,
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

  // ── RIDER CARD ──────────────────────────────
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
    fontSize: 13,
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

  // ── STEPS TRACKER (FIXED) ───────────────────
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  // 🔧 FIX: Line goes left of dot (not right)
  stepLineLeft: {
    position: 'absolute',
    top: 17,
    left: 0,
    right: '50%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 6,
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  stepIcon: { fontSize: 15 },
  stepLabel: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },

  // 🆕 GCASH NOTE ──────────────────────────────
  gcashNote: {
    backgroundColor: colors.infoPale,
    borderRadius: borderRadius.large,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.info + '25',
  },
  gcashNoteText: {
    color: colors.info,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  // 🆕 LOADING MODAL ───────────────────────────
  loadingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowStrong,
  },
  loadingSpinner: { fontSize: 40 },
  loadingMessage: {
    color: colors.textMedium,
    fontSize: 14,
    fontWeight: '600',
  },
});
