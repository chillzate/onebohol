// ============================================
// ZAVARA REVIEWSCREEN.JS - v3.0
// Compare to: Grab's review flow, Airbnb reviews
// Big improvements: better animations, no Alert,
// animated success, better tag UX
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
  TextInput,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  borderRadius,
} from '../theme';
import { showToast } from './ToastManager';
import { API_URL }   from '../config';

// ============================================
// CONSTANTS
// ============================================
const RATING_DATA = [
  { label: 'Poor',      emoji: '😞', color: colors.danger       },
  { label: 'Fair',      emoji: '😐', color: colors.warning      },
  { label: 'Good',      emoji: '🙂', color: colors.primary      },
  { label: 'Great',     emoji: '😊', color: colors.farmerColor  },
  { label: 'Excellent', emoji: '🤩', color: colors.success      },
];

const FOOD_TAGS = [
  '😋 Delicious',
  '🚀 Fast Delivery',
  '📦 Good Packaging',
  '💰 Worth the Price',
  '🌶️ Authentic Taste',
  '🥗 Fresh Ingredients',
  '🤝 Great Service',
  '🌟 Will Order Again',
];

const MARKET_TAGS = [
  '🌾 Very Fresh',
  '💰 Good Value',
  '📦 Well Packed',
  '🚀 Fast Delivery',
  '😊 Friendly Seller',
  '🥗 Great Quality',
  '🤝 Trustworthy',
  '🌟 Will Buy Again',
];

// ============================================
// STAR COMPONENT - own component for clean code
// ============================================
function StarRating({ rating, onRate }) {
  const anims = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(1))
  ).current;

  const handlePress = useCallback((star) => {
    onRate(star);
    // Cascade animation like Grab reviews
    for (let i = 0; i < star; i++) {
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(anims[i], {
            toValue: 1.5,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(anims[i], {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }),
        ]).start();
      }, i * 50);
    }
    // Also shrink stars above selection
    for (let i = star; i < 5; i++) {
      setTimeout(() => {
        Animated.spring(anims[i], {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, i * 30);
    }
  }, [anims, onRate]);

  const ratingInfo = rating > 0
    ? RATING_DATA[rating - 1]
    : null;

  return (
    <View style={starStyles.wrap}>
      {/* Stars row */}
      <View style={starStyles.row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            style={starStyles.btn}
            hitSlop={{ top: 8, bottom: 8,
              left: 4, right: 4 }}
            activeOpacity={0.8}>
            <Animated.Text style={[
              starStyles.star,
              { transform: [{ scale: anims[star - 1] }] },
            ]}>
              {star <= rating ? '⭐' : '☆'}
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rating label */}
      <Animated.View style={[starStyles.labelWrap, {
        backgroundColor: ratingInfo
          ? ratingInfo.color + '15'
          : colors.inputBackground,
        borderColor: ratingInfo
          ? ratingInfo.color + '40'
          : colors.border,
      }]}>
        <Text style={starStyles.labelEmoji}>
          {ratingInfo?.emoji || '✨'}
        </Text>
        <Text style={[starStyles.labelText, {
          color: ratingInfo?.color || colors.textMuted,
        }]}>
          {ratingInfo
            ? `${ratingInfo.label}!`
            : 'Tap a star to rate'}
        </Text>
      </Animated.View>
    </View>
  );
}

const starStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: { padding: 4 },
  star: {
    fontSize: 40,
    color: colors.border,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.round,
    borderWidth: 1.5,
  },
  labelEmoji: { fontSize: 20 },
  labelText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

// ============================================
// SUCCESS SCREEN - separate component
// ============================================
function SuccessScreen({ rating, onDone }) {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starsAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(starsAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const ratingInfo = RATING_DATA[rating - 1];

  return (
    <View style={successStyles.wrap}>
      <Animated.View style={[successStyles.circle, {
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
        backgroundColor: ratingInfo?.color + '18' ||
          colors.primaryPale,
        borderColor: ratingInfo?.color + '40' ||
          colors.borderGold,
      }]}>
        <Text style={successStyles.emoji}>
          {ratingInfo?.emoji || '⭐'}
        </Text>
      </Animated.View>

      <Animated.View style={{
        opacity: opacityAnim,
        transform: [{ scale: starsAnim }],
        alignItems: 'center',
      }}>
        <Text style={successStyles.title}>
          Review Submitted!
        </Text>
        <Text style={successStyles.sub}>
          Thank you! Your feedback{'\n'}
          helps the community 🌴
        </Text>

        <View style={[successStyles.ratingBadge, {
          backgroundColor: ratingInfo?.color + '15',
          borderColor:     ratingInfo?.color + '40',
        }]}>
          <Text style={successStyles.ratingStars}>
            {'⭐'.repeat(rating)}
          </Text>
          <Text style={[successStyles.ratingLabel, {
            color: ratingInfo?.color || colors.primary,
          }]}>
            {ratingInfo?.label}!
          </Text>
        </View>

        <TouchableOpacity
          style={[successStyles.doneBtn, {
            backgroundColor: ratingInfo?.color ||
              colors.primary,
          }]}
          onPress={onDone}
          activeOpacity={0.85}>
          <Text style={successStyles.doneBtnText}>
            Done ✓
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const successStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 20,
  },
  circle: {
    width: 120, height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...shadowGold,
  },
  emoji:  { fontSize: 58 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingBadge: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.xlarge,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  ratingStars: { fontSize: 24 },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: borderRadius.large,
    marginTop: 8,
    ...shadowGold,
  },
  doneBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

// ============================================
// MAIN REVIEW SCREEN
// ============================================
export default function ReviewScreen({
  userId,
  restaurantId,
  productId,
  orderId,
  restaurantName,
  productName,
  orderType = 'food',
  onBack,
  onSuccess,
}) {
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const tags = orderType === 'market'
    ? MARKET_TAGS : FOOD_TAGS;

  // ── TOGGLE TAG ───────────────────────────────
  const toggleTag = useCallback((tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // ── BUILD COMMENT FROM TAGS + TEXT ───────────
  const buildFinalComment = useCallback(() => {
    const tagStr = selectedTags.join(' · ');
    if (tagStr && comment.trim()) {
      return `${tagStr}\n${comment.trim()}`;
    }
    return tagStr || comment.trim();
  }, [selectedTags, comment]);

  // ── SUBMIT ───────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      showToast('warning', 'Select Rating',
        'Please tap a star to rate!');
      return;
    }

    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        user_id:  userId,
        rating:   rating,
        order_id: orderId,
      });

      const finalComment = buildFinalComment();
      if (finalComment) {
        params.append('comment', finalComment);
      }

      if (orderType === 'food' && restaurantId) {
        params.append('restaurant_id', restaurantId);
      } else if (orderType === 'market' && productId) {
        params.append('product_id', productId);
      }

      await axios.post(
        `${API_URL}/reviews?${params.toString()}`
      );

      setSubmitted(true);
      showToast('success', 'Review Submitted! ⭐',
        'Thank you for your feedback!');

    } catch (error) {
      const status = error.response?.status;
      if (status === 400) {
        showToast('warning', 'Already Reviewed! ⚠️',
          'You already reviewed this order.');
        setTimeout(() => onBack?.(), 1500);
      } else {
        showToast('error', 'Error',
          'Could not submit. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [rating, userId, orderId, orderType,
    restaurantId, productId, buildFinalComment, onBack]);

  // ── SUCCESS STATE ────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <SuccessScreen
          rating={rating}
          onDone={() => {
            onSuccess?.();
            onBack?.();
          }}
        />
      </View>
    );
  }

  // ── MAIN RENDER ──────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Rate & Review
        </Text>
        {/* Skip button in header - like Grab */}
        <TouchableOpacity
          style={styles.skipHeaderBtn}
          onPress={onBack}>
          <Text style={styles.skipHeaderText}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Subject card */}
        <View style={styles.subjectCard}>
          <Text style={styles.subjectEmoji}>
            {orderType === 'market' ? '🌾' : '🍴'}
          </Text>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectLabel}>
              REVIEWING
            </Text>
            <Text style={styles.subjectName}>
              {orderType === 'market'
                ? (productName || 'Market Product')
                : (restaurantName || 'Restaurant')}
            </Text>
            {orderId && (
              <Text style={styles.subjectOrder}>
                Order #
                {String(orderId).padStart(4, '0')}
              </Text>
            )}
          </View>
          <View style={[styles.typeBadge, {
            backgroundColor: orderType === 'market'
              ? colors.farmerBg : colors.cuisineBg,
          }]}>
            <Text style={[styles.typeBadgeText, {
              color: orderType === 'market'
                ? colors.farmerColor
                : colors.cuisineColor,
            }]}>
              {orderType === 'market'
                ? '🌾 Market' : '🍴 Food'}
            </Text>
          </View>
        </View>

        {/* Star rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingCardTitle}>
            How was your experience?
          </Text>
          <StarRating
            rating={rating}
            onRate={setRating}
          />
        </View>

        {/* Quick tags */}
        <Text style={styles.sectionLabel}>
          QUICK FEEDBACK
        </Text>
        <View style={styles.tagsGrid}>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag,
                  isSelected && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}>
                <Text style={[styles.tagText,
                  isSelected && styles.tagTextSelected]}>
                  {tag}
                </Text>
                {isSelected && (
                  <Text style={styles.tagCheck}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comment input */}
        <Text style={styles.sectionLabel}>
          YOUR REVIEW (OPTIONAL)
        </Text>
        <View style={styles.commentCard}>
          <TextInput
            style={styles.commentInput}
            placeholder="Share more about your experience..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {comment.length}/500
          </Text>
        </View>

        {/* Submit */}
        {submitting ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={styles.loadingText}>
              Submitting...
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              rating === 0 && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0}
            activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>
              ⭐ SUBMIT REVIEW
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 52,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  // Skip in header (like Grab) - no Alert blocking!
  skipHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipHeaderText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  subjectCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  subjectEmoji: { fontSize: 36 },
  subjectInfo:  { flex: 1 },
  subjectLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subjectName: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  subjectOrder: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ratingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 16,
    ...shadowMd,
  },
  ratingCardTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  tagSelected: {
    backgroundColor: colors.primaryPale,
    borderColor:     colors.primary,
  },
  tagText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSelected: {
    color:      colors.primary,
    fontWeight: '800',
  },
  tagCheck: {
    color:      colors.primary,
    fontSize:   11,
    fontWeight: '900',
  },
  commentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  commentInput: {
    fontSize:   14,
    color:      colors.textDark,
    lineHeight: 22,
    minHeight:  100,
  },
  charCount: {
    color:      colors.textMuted,
    fontSize:   11,
    textAlign:  'right',
    marginTop:  8,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    color:      colors.textLight,
    fontSize:   13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding:         17,
    borderRadius:    borderRadius.large,
    alignItems:      'center',
    ...shadowGold,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    color:         colors.textWhite,
    fontWeight:    '900',
    fontSize:      14,
    letterSpacing: 1,
  },
});