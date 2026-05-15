import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StatusBar,
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

const API_URL = 'https://onebohol-production.up.railway.app';

export default function ReviewScreen({
  userId,
  restaurantId,
  orderId,
  restaurantName,
  onBack,
  onSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('warning', 'Select Rating',
        'Please select a star rating!');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/reviews`,
        null,
        {
          params: {
            user_id: userId,
            rating: rating,
            comment: comment,
            restaurant_id: restaurantId,
            order_id: orderId,
          }
        }
      );
      showToast('success', 'Review Submitted! ⭐',
        'Thank you for your feedback!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onBack();
      }, 1000);
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('warning', 'Already Reviewed!',
          'You already reviewed this order.');
      } else {
        showToast('error', 'Error',
          'Could not submit review. Try again.');
      }
    }
    setSubmitting(false);
  };

  const StarRow = () => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starBtn}>
          <Text style={[
            styles.starIcon,
            star <= rating && styles.starActive,
          ]}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getRatingLabel = () => {
    const labels = {
      1: 'Poor 😞',
      2: 'Fair 😐',
      3: 'Good 🙂',
      4: 'Great 😊',
      5: 'Excellent! 🤩',
    };
    return labels[rating] || 'Tap to rate';
  };

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
        contentContainerStyle={styles.content}>

        {/* RESTAURANT NAME */}
        <View style={styles.restaurantCard}>
          <Text style={styles.restaurantEmoji}>🍴</Text>
          <View>
            <Text style={styles.restaurantLabel}>
              REVIEWING
            </Text>
            <Text style={styles.restaurantName}>
              {restaurantName || 'Restaurant'}
            </Text>
          </View>
        </View>

        {/* STAR RATING */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>
            How was your experience?
          </Text>
          <StarRow />
          <Text style={styles.ratingLabel}>
            {getRatingLabel()}
          </Text>
        </View>

        {/* COMMENT */}
        <View style={styles.commentCard}>
          <Text style={styles.commentLabel}>
            YOUR REVIEW
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell others about your experience..."
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

        {/* QUICK TAGS */}
        <View style={styles.tagsWrap}>
          <Text style={styles.tagsLabel}>
            QUICK TAGS
          </Text>
          <View style={styles.tagsRow}>
            {[
              '😋 Delicious',
              '🚀 Fast Delivery',
              '📦 Good Packaging',
              '💰 Worth it',
              '🌶️ Authentic',
              '🥗 Fresh',
            ].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  comment.includes(tag) &&
                  styles.tagActive,
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
        </View>

        {/* SUBMIT */}
        {submitting ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 20 }}
          />
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

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onBack}>
          <Text style={styles.skipBtnText}>
            Skip for now
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── HEADER ────────────────────────────────
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

  // ── CONTENT ───────────────────────────────
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── RESTAURANT CARD ───────────────────────
  restaurantCard: {
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
  restaurantEmoji: { fontSize: 36 },
  restaurantLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  restaurantName: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '900',
  },

  // ── RATING ────────────────────────────────
  ratingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowMd,
  },
  ratingTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 40,
    color: colors.border,
  },
  starActive: {
    color: colors.primary,
  },
  ratingLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },

  // ── COMMENT ───────────────────────────────
  commentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  commentLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
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

  // ── TAGS ──────────────────────────────────
  tagsWrap: {
    marginBottom: 24,
  },
  tagsLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
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

  // ── SUBMIT ────────────────────────────────
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginBottom: 12,
    ...shadowGold,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
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
});