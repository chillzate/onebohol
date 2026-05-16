// ============================================
// ZAVARA IMAGEPICKERHELPER.JS - v3.0
// Compare to: Shopee's image upload
// Improvements: compression, progress, deduplication
// ============================================
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { API_URL } from '../config';

// ============================================
// CONSTANTS
// ============================================
const MAX_IMAGE_SIZE = 5  * 1024 * 1024; // 5MB
const MAX_DOC_SIZE   = 10 * 1024 * 1024; // 10MB
const COMPRESS_QUALITY = 0.75;            // 75% quality
const MAX_DIMENSION    = 1200;            // px

const MIME_MAP = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  gif:  'image/gif',
};

// ============================================
// PERMISSION HELPERS
// ============================================
async function requestPermission(type) {
  try {
    const fn = type === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await fn();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        type === 'camera'
          ? 'Please allow camera access in Settings.'
          : 'Please allow photo library access in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (err) {
    console.log(`${type} permission error:`, err?.message);
    return false;
  }
}

export const requestImagePermission  = () =>
  requestPermission('gallery');
export const requestCameraPermission = () =>
  requestPermission('camera');

// ============================================
// IMAGE COMPRESSION
// Shopee compresses images before upload
// Reduces upload time + storage costs
// ============================================
async function compressImage(uri, quality = COMPRESS_QUALITY) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch {
    // If compression fails, use original
    return uri;
  }
}

// ============================================
// BUILD FORM DATA - Single source of truth
// ============================================
function buildFormData(uri, fieldName = 'file') {
  const formData = new FormData();
  const ext      = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = MIME_MAP[ext] || 'image/jpeg';
  const cleanUri = Platform.OS === 'android'
    ? uri
    : uri.replace('file://', '');

  formData.append(fieldName, {
    uri:  cleanUri,
    type: mimeType,
    name: `upload_${Date.now()}.${ext}`,
  });

  return formData;
}

// ============================================
// PICK FROM GALLERY
// ============================================
export async function pickImageFromGallery(options = {}) {
  if (!await requestPermission('gallery')) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:              ImagePicker.MediaTypeOptions.Images,
      allowsEditing:           options.allowsEditing ?? true,
      aspect:                  options.aspect ?? [1, 1],
      quality:                 1, // Get full quality, compress ourselves
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert('File Too Large',
        'Please select an image under 5MB');
      return null;
    }

    // Compress before returning
    const compressedUri = await compressImage(asset.uri);
    return { ...asset, uri: compressedUri };

  } catch (err) {
    console.log('Gallery error:', err?.message);
    Alert.alert('Error', 'Could not open photo library');
    return null;
  }
}

// ============================================
// TAKE PHOTO
// ============================================
export async function takePhoto(options = {}) {
  if (!await requestPermission('camera')) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect:        options.aspect ?? [1, 1],
      quality:       1,
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert('File Too Large',
        'Please take a photo under 5MB');
      return null;
    }

    const compressedUri = await compressImage(asset.uri);
    return { ...asset, uri: compressedUri };

  } catch (err) {
    console.log('Camera error:', err?.message);
    Alert.alert('Error', 'Could not open camera');
    return null;
  }
}

// ============================================
// PICK DOCUMENT
// ============================================
export async function pickDocument(options = {}) {
  if (!await requestPermission('gallery')) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? false,
      quality:       1,
      aspect:        options.aspect ?? [4, 3],
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_DOC_SIZE) {
      Alert.alert('File Too Large',
        'Please select a document under 10MB');
      return null;
    }

    return asset; // No compression for docs
  } catch (err) {
    console.log('Document picker error:', err?.message);
    return null;
  }
}

// ============================================
// CORE UPLOAD FUNCTION
// Single upload function - no more duplication!
// Like Shopee's unified upload service
// ============================================
async function uploadImage(
  endpoint,
  imageAsset,
  extraData = {},
  onProgress = null
) {
  if (!imageAsset?.uri) {
    return { success: false, error: 'No image provided' };
  }

  try {
    const formData = buildFormData(imageAsset.uri);

    // Append any extra fields
    Object.entries(extraData).forEach(([key, val]) => {
      formData.append(key, val);
    });

    const response = await axios.post(
      `${API_URL}${endpoint}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
        // Upload progress (like Shopee's progress bar)
        onUploadProgress: onProgress
          ? (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) /
                (progressEvent.total || 1)
              );
              onProgress(percent);
            }
          : undefined,
      }
    );

    return {
      success:   true,
      url:       response.data.image_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    console.log(`Upload error [${endpoint}]:`,
      error?.response?.status, error?.message);
    return {
      success: false,
      error:   error?.response?.data?.detail
               || error.message
               || 'Upload failed',
    };
  }
}

// ============================================
// SPECIFIC UPLOAD FUNCTIONS
// Now just thin wrappers around uploadImage()
// ============================================
export const uploadProfilePhoto = (userId, imageAsset, onProgress) =>
  uploadImage(`/upload/profile/${userId}`, imageAsset, {}, onProgress);

export const uploadProductPhoto = (productId, imageAsset, onProgress) =>
  uploadImage(`/upload/product/${productId}`, imageAsset, {}, onProgress);

export const uploadRestaurantPhoto = (restaurantId, imageAsset, onProgress) =>
  uploadImage(`/upload/restaurant/${restaurantId}`, imageAsset, {}, onProgress);

export const uploadDocument = (userId, docType, imageAsset, onProgress) =>
  uploadImage(
    `/upload/document/${userId}`,
    imageAsset,
    { doc_type: docType },
    onProgress
  );

export const uploadGeneralImage = (imageAsset, onProgress) =>
  uploadImage('/upload/general', imageAsset, {}, onProgress);

// ============================================
// COMBINED PICK + UPLOAD
// ============================================
export async function pickAndUploadProfilePhoto(
  userId,
  source = 'gallery',
  onProgress = null
) {
  const imageAsset = source === 'camera'
    ? await takePhoto()
    : await pickImageFromGallery();

  if (!imageAsset) return { success: false, cancelled: true };

  return uploadProfilePhoto(userId, imageAsset, onProgress);
}