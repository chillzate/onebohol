// ============================================
// screens/ProfileScreen.js
// Extracted from App.js
// Uses context instead of props
// ============================================
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAppContext }  from '../context/AppContext';
import { useAuth }        from '../hooks/useAuth';
import BottomNav          from '../components/BottomNav';
import { showToast }      from './ToastManager';
import {
  pickImageFromGallery,
  takePhoto,
  uploadProfilePhoto,
} from './ImagePickerHelper';
import {
  colors,
  shadow,
  shadowGold,
  shadowDark,
  borderRadius,
} from '../theme';

export default function ProfileScreen() {
  const {
    setScreen,
    loggedInUser,
    userId,
    userRole,
    email,
    profileImage,
    setProfileImage,
    roleData,
  } = useAppContext();

  const { handleLogout } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const onPhotoUpload = useCallback(async (source) => {
    let imageAsset = null;
    if (source === 'gallery') {
      imageAsset = await pickImageFromGallery();
    } else {
      imageAsset = await takePhoto();
    }
    if (!imageAsset) return;
    setUploadingPhoto(true);
    const result = await uploadProfilePhoto(
      userId, imageAsset
    );
    if (result.success) {
      setProfileImage(result.url);
      await SecureStore.setItemAsync(
        'profileImage', result.url
      );
      showToast('success', 'Photo Updated! ✅',
        'Profile photo updated!');
    } else {
      showToast('error', 'Upload Failed',
        'Could not upload photo. Try again.');
    }
    setUploadingPhoto(false);
  }, [userId, setProfileImage]);

  const onLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  }, [handleLogout]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      {/* Dark header */}
      <View style={styles.darkHeader}>
        <View style={styles.darkHeaderTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setScreen('home')}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.darkHeaderTitle}>
            My Profile
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Alert.alert('Update Photo', 'Choose source', [
              {
                text: '📷 Camera',
                onPress: () => onPhotoUpload('camera'),
              },
              {
                text: '🖼️ Gallery',
                onPress: () => onPhotoUpload('gallery'),
              },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}>
          <View style={styles.avatarWrap}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                {uploadingPhoto ? (
                  <ActivityIndicator
                    color={colors.primary}
                    size="large"
                  />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {loggedInUser?.charAt(0)
                      ?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Text style={{ fontSize: 13 }}>📷</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{loggedInUser}</Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={[styles.rolePill, {
          borderColor:     roleData.color + '60',
          backgroundColor: roleData.color + '18',
        }]}>
          <Text style={[styles.rolePillText,
            { color: roleData.color }]}>
            {roleData.badge}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setScreen('orders')}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLbl}>Orders</Text>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLbl}>Reviews</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🌴</Text>
            <Text style={styles.statNum}>2025</Text>
            <Text style={styles.statLbl}>Member</Text>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.secLabel}>ACCOUNT</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setScreen('orders')}>
          <View style={[styles.menuIcon,
            { backgroundColor: colors.primaryPale }]}>
            <Text style={{ fontSize: 18 }}>📦</Text>
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>
              Order History
            </Text>
            <Text style={styles.menuSub}>
              Track all your orders
            </Text>
          </View>
          <Text style={styles.menuChev}>›</Text>
        </TouchableOpacity>

        {userRole === 'producer' && (
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setScreen('producer_dash')}>
            <View style={[styles.menuIcon,
              { backgroundColor: colors.farmerBg }]}>
              <Text style={{ fontSize: 18 }}>🌾</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                Producer Dashboard
              </Text>
              <Text style={styles.menuSub}>
                Manage products & orders
              </Text>
            </View>
            <Text style={styles.menuChev}>›</Text>
          </TouchableOpacity>
        )}

        {userRole === 'cuisine' && (
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setScreen('cuisine_dash')}>
            <View style={[styles.menuIcon,
              { backgroundColor: colors.cuisineBg }]}>
              <Text style={{ fontSize: 18 }}>🍴</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                Cuisine Dashboard
              </Text>
              <Text style={styles.menuSub}>
                Manage restaurant
              </Text>
            </View>
            <Text style={styles.menuChev}>›</Text>
          </TouchableOpacity>
        )}

        {userRole === 'regular' && (
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowHighlight]}
            onPress={() => setScreen('verify')}>
            <View style={[styles.menuIcon,
              { backgroundColor: colors.primaryPale }]}>
              <Text style={{ fontSize: 18 }}>✦</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle,
                { color: colors.primary }]}>
                Become a Partner
              </Text>
              <Text style={styles.menuSub}>
                Harvest · Seller · Swift · Haven
              </Text>
            </View>
            <Text style={[styles.menuChev,
              { color: colors.primary }]}>›</Text>
          </TouchableOpacity>
        )}

        {/* Support */}
        <Text style={[styles.secLabel, { marginTop: 20 }]}>
          SUPPORT
        </Text>

        <TouchableOpacity style={styles.menuRow}>
          <View style={[styles.menuIcon,
            { backgroundColor: colors.infoPale }]}>
            <Text style={{ fontSize: 18 }}>💬</Text>
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>
              Help & Support
            </Text>
            <Text style={styles.menuSub}>
              FAQ and contact us
            </Text>
          </View>
          <Text style={styles.menuChev}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow}>
          <View style={[styles.menuIcon,
            { backgroundColor: colors.warningPale }]}>
            <Text style={{ fontSize: 18 }}>📋</Text>
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>
              Terms & Privacy
            </Text>
            <Text style={styles.menuSub}>
              Legal information
            </Text>
          </View>
          <Text style={styles.menuChev}>›</Text>
        </TouchableOpacity>

        {/* App footer */}
        <View style={styles.appFooter}>
          <Text style={styles.appBrand}>ZAVARA</Text>
          <Text style={styles.appVersion}>
            Version 5.0.0 · Bohol, Philippines
          </Text>
          <Text style={styles.appTagline}>
            The Island's Pulse 🌴
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.75}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  darkHeader: {
    backgroundColor: colors.dark,
    paddingTop: 52,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...shadowDark,
  },
  darkHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  darkHeaderTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  avatarLetter: {
    fontSize: 40,
    color: colors.primary,
    fontWeight: '900',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0, right: -4,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.dark,
    ...shadowGold,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textCream,
    marginBottom: 5,
  },
  emailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  rolePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  rolePillText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  body: {
    padding: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    marginTop: -14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statNum: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuRow: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  menuRowHighlight: {
    borderColor:     colors.borderGold,
    backgroundColor: colors.primaryPale,
  },
  menuIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 14,
  },
  menuText: { flex: 1 },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  menuSub: { fontSize: 11, color: colors.textLight },
  menuChev: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 8,
  },
  appBrand: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 5,
  },
  appVersion: {
    color: colors.borderMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTagline: { color: colors.textMuted, fontSize: 11 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.danger + '35',
    backgroundColor: colors.danger + '08',
    marginBottom: 10,
  },
  logoutIcon: { fontSize: 16 },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});