// ============================================
// ZAVARA REVIEW SCREEN - COMPLETE FIXED v2.1
// ============================================
import { useState, useRef, useEffect } from 'react';
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
  Image,
  Alert,
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
import { API_URL } from '../config'; // 🔧 FIX

export default function ReviewScreen({
  userId,
  restaurantId,   // optional - for food orders
  productId,      // 🆕 optional - for market orders
  orderId,
  restaurantName,
  productName,    // 🆕 for market orders
  orderType = 'food', // 🆕 'food' | 'market'
  onBack,
  onSuccess,
}) {
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // 🆕 Star animation
  const starAnims = useRef(
    [1, 2, 3, 4, 5].map(() => new Animated.Value(1))
  ).current;

  // ── ANIMATE STAR ON TAP ─────────────────────
  const animateStar = (starIndex) => {
    const anim = starAnims[starIndex];
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1.4,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStarPress = (star) => {
    setRating(star);
    // Animate all stars up to selected
    for (let i = 0; i < star; i++) {
      setTimeout(() => animateStar(i), i * 60);
    }
  };

  // ── SUBMIT REVIEW ───────────────────────────
  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('warning', 'Select Rating',
        'Please select a star rating!');
      return;
    }
    if (comment.length > 0 && comment.length < 5) {
      showToast('warning', 'Review Too Short',
        'Please write at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      // 🔧 FIX: Build params properly
      const params = {
        user_id: userId,
        rating: rating,
        order_id: orderId,
      };

      if (comment.trim()) {
        params.comment = comment.trim();
      }

      // 🔧 FIX: Add correct ID based on order type
      if (orderType === 'food' && restaurantId) {
        params.restaurant_id = restaurantId;
      } else if (orderType === 'market' && productId) {
        params.product_id = productId;
      }

      // Build query string
      const queryString = new URLSearchParams(
        params
      ).toString();

      await axios.post(
        `${API_URL}/reviews?${queryString}`
      );

      setSubmitted(true);
      showToast('success', 'Review Submitted! ⭐',
        'Thank you for your feedback!');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onBack?.();
      }, 1500);

    } catch (error) {
      const status = error.response?.status;
      if (status === 400) {
        showToast('warning', 'Already Reviewed!',
          'You already reviewed this order.');
        // Still go back since they already reviewed
        setTimeout(() => onBack?.(), 1500);
      } else {
        showToast('error', 'Error',
          'Could not submit review. Try again.');
      }
    }
    setSubmitting(false);
  };

  // ── RATING LABEL ────────────────────────────
  const getRatingLabel = () => {
    const labels = {
      1: '😞 Poor',
      2: '😐 Fair',
      3: '🙂 Good',
      4: '😊 Great',
      5: '🤩 Excellent!',
    };
    return labels[rating] || 'Tap to rate';
  };

  // ── QUICK TAGS (context-aware) ───────────────
  const getQuickTags = () => {
    if (orderType === 'market') {
      return [
        '🌾 Very Fresh',
        '💰 Good Value',
        '📦 Well Packed',
        '🚀 Fast',
        '😊 Friendly Seller',
        '🥗 Great Quality',
      ];
    }
    return [
      '😋 Delicious',
      '🚀 Fast Delivery',
      '📦 Good Packaging',
      '💰 Worth it',
      '🌶️ Authentic',
      '🥗 Fresh',
    ];
  };

  // ── SUCCESS STATE ───────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.successEmoji}>⭐</Text>
          </View>
          <Text style={styles.successTitle}>
            Review Submitted!
          </Text>
          <Text style={styles.successSub}>
            Thank you for your feedback!{'\n'}
            It helps the community.
          </Text>
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingDisplayStars}>
              {'⭐'.repeat(rating)}
            </Text>
            <Text style={styles.ratingDisplayLabel}>
              {getRatingLabel()}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.headerBg}
        barStyle="dark-content"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={onBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Rate & Review
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        {/* SUBJECT CARD */}
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
                Order #{String(orderId).padStart(4, '0')}
              </Text>
            )}
          </View>
          <View style={[styles.orderTypeBadge, {
            backgroundColor: orderType === 'market'
              ? colors.farmerBg : colors.cuisineBg,
          }]}>
            <Text style={[styles.orderTypeBadgeText, {
              color: orderType === 'market'
                ? colors.farmerColor
                : colors.cuisineColor,
            }]}>
              {orderType === 'market'
                ? 'Market' : 'Food'}
            </Text>
          </View>
        </View>

        {/* STAR RATING */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingCardTitle}>
            How was your experience?
          </Text>

          {/* STARS */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starBtn}
                hitSlop={{
                  top: 8, bottom: 8,
                  left: 4, right: 4,
                }}>
                <Animated.Text style={[
                  styles.starIcon,
                  star <= rating && styles.starActive,
                  {
                    transform: [{
                      scale: starAnims[star - 1],
                    }],
                  },
                ]}>
                  {star <= rating ? '⭐' : '☆'}
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* RATING LABEL */}
          <View style={[styles.ratingLabelWrap, {
            backgroundColor: rating > 0
              ? colors.primaryPale
              : colors.inputBackground,
            borderColor: rating > 0
              ? colors.borderGold
              : colors.border,
          }]}>
            <Text style={[styles.ratingLabel, {
              color: rating > 0
                ? colors.primary
                : colors.textMuted,
            }]}>
              {getRatingLabel()}
            </Text>
          </View>
        </View>

        {/* QUICK TAGS */}
        <Text style={styles.sectionLabel}>
          QUICK TAGS
        </Text>
        <View style={styles.tagsRow}>
          {getQuickTags().map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                comment.includes(tag) && styles.tagActive,
              ]}
              onPress={() => {
                if (comment.includes(tag)) {
                  setComment(
                    comment.replace(tag, '').trim()
                  );
                } else {
                  setComment(
                    comment
                      ? `${comment} ${tag}`
                      : tag
                  );
                }
              }}>
              <Text style={[
                styles.tagText,
                comment.includes(tag) &&
                styles.tagTextActive,
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* COMMENT INPUT */}
        <Text style={styles.sectionLabel}>
          YOUR REVIEW
        </Text>
        <View style={styles.commentCard}>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience with others..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {comment.length}/500
          </Text>
        </View>

        {/* SUBMIT BUTTON */}
        {submitting ? (
          <View style={styles.submittingWrap}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={styles.submittingText}>
              Submitting review...
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              rating === 0 && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0}>
            <Text style={styles.submitBtnText}>
              ⭐ SUBMIT REVIEW
            </Text>
          </TouchableOpacity>
        )}

        {/* SKIP */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            Alert.alert(
              'Skip Review',
              'Are you sure? Your feedback helps others!',
              [
                { text: 'Write Review', style: 'cancel' },
                {
                  text: 'Skip',
                  onPress: () => onBack?.(),
                },
              ]
            );
          }}>
          <Text style={styles.skipBtnText}>
            Skip for now
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
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

  // ── HEADER ──────────────────────────────────
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
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBackText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },

  // ── CONTENT ─────────────────────────────────
  content: {
    padding: 20,
    paddingBottom: 50,
  },

  // ── SUBJECT CARD ────────────────────────────
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
  subjectInfo: { flex: 1 },
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
  orderTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  orderTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── RATING CARD ─────────────────────────────
  ratingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowMd,
  },
  ratingCardTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  starBtn: { padding: 4 },
  starIcon: {
    fontSize: 38,
    color: colors.border,
  },
  starActive: { color: colors.primary },
  ratingLabelWrap: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '800',
  },

  // ── SECTION LABEL ───────────────────────────
  sectionLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // ── TAGS ────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // ── COMMENT ─────────────────────────────────
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
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
  },

  // ── SUBMIT ──────────────────────────────────
  submittingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  submittingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginBottom: 14,
    ...shadowGold,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    color: colors.textWhite,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  skipBtn: {
    alignItems: 'center',
    padding: 12,
  },
  skipBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── SUCCESS STATE ───────────────────────────
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderGold,
    ...shadowGold,
  },
  successEmoji: { fontSize: 55 },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
  },
  successSub: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  ratingDisplayStars: { fontSize: 28 },
  ratingDisplayLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});