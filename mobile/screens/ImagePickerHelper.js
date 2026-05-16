// ============================================
// ZAVARA IMAGE PICKER HELPER - FIXED v2.1
// ============================================
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { API_URL } from '../config'; // 🔧 FIX

// 🔧 FIX: Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE   = 10 * 1024 * 1024; // 10MB

// ============================================
// PERMISSION HELPERS
// ============================================
export async function requestImagePermission() {
  try {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (err) {
    console.log('Image permission error:', err?.message);
    return false;
  }
}

export async function requestCameraPermission() {
  try {
    const { status } =
      await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (err) {
    console.log('Camera permission error:', err?.message);
    return false;
  }
}

// ============================================
// PICK FROM GALLERY
// ============================================
export async function pickImageFromGallery(
  options = {}
) {
  const hasPermission = await requestImagePermission();
  if (!hasPermission) return null;

  try {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        // 🔧 FIX: Updated for newer SDK
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: false,
      });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const asset = result.assets[0];

    // 🆕 File size check
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert(
        'File Too Large',
        'Please select an image under 5MB'
      );
      return null;
    }

    return asset;
  } catch (err) {
    console.log('Gallery picker error:', err?.message);
    Alert.alert('Error', 'Could not open photo library');
    return null;
  }
}

// ============================================
// TAKE PHOTO WITH CAMERA
// ============================================
export async function takePhoto(options = {}) {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const asset = result.assets[0];

    // 🆕 File size check
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert(
        'File Too Large',
        'Please take a photo under 5MB'
      );
      return null;
    }

    return asset;
  } catch (err) {
    console.log('Camera error:', err?.message);
    Alert.alert('Error', 'Could not open camera');
    return null;
  }
}

// ============================================
// 🆕 PICK DOCUMENT (for verification)
// ============================================
export async function pickDocument(options = {}) {
  const hasPermission = await requestImagePermission();
  if (!hasPermission) return null;

  try {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? false,
        quality: options.quality ?? 0.9,
        aspect: options.aspect ?? [4, 3],
      });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const asset = result.assets[0];

    // 🆕 Larger size limit for documents
    if (asset.fileSize && asset.fileSize > MAX_DOC_SIZE) {
      Alert.alert(
        'File Too Large',
        'Please select a document under 10MB'
      );
      return null;
    }

    return asset;
  } catch (err) {
    console.log('Document picker error:', err?.message);
    return null;
  }
}

// ============================================
// HELPER: Build FormData
// ============================================
function buildFormData(imageAsset, fieldName = 'file') {
  const formData = new FormData();

  // 🔧 FIX: Detect actual image type from URI
  const uri = imageAsset.uri;
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    gif:  'image/gif',
  };
  const mimeType = mimeMap[ext] || imageAsset.mimeType
    || 'image/jpeg';

  formData.append(fieldName, {
    uri: Platform.OS === 'android'
      ? uri
      : uri.replace('file://', ''),
    type: mimeType,
    name: `upload.${ext}`,
  });

  return formData;
}

// ============================================
// UPLOAD PROFILE PHOTO
// ============================================
export async function uploadProfilePhoto(
  userId,
  imageAsset
) {
  try {
    if (!userId || !imageAsset?.uri) {
      return { success: false, error: 'Invalid input' };
    }

    const formData = buildFormData(imageAsset);

    const response = await axios.post(
      `${API_URL}/upload/profile/${userId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    console.log(
      'Profile upload error:',
      error?.response?.status,
      error?.message
    );
    return {
      success: false,
      error: error?.response?.data?.detail
        || error.message
        || 'Upload failed',
    };
  }
}

// ============================================
// UPLOAD PRODUCT PHOTO
// ============================================
export async function uploadProductPhoto(
  productId,
  imageAsset
) {
  try {
    if (!productId || !imageAsset?.uri) {
      return { success: false, error: 'Invalid input' };
    }

    const formData = buildFormData(imageAsset);

    const response = await axios.post(
      `${API_URL}/upload/product/${productId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    console.log('Product upload error:', error?.message);
    return {
      success: false,
      error: error?.response?.data?.detail
        || error.message
        || 'Upload failed',
    };
  }
}

// ============================================
// UPLOAD RESTAURANT PHOTO
// ============================================
export async function uploadRestaurantPhoto(
  restaurantId,
  imageAsset
) {
  try {
    if (!restaurantId || !imageAsset?.uri) {
      return { success: false, error: 'Invalid input' };
    }

    const formData = buildFormData(imageAsset);

    const response = await axios.post(
      `${API_URL}/upload/restaurant/${restaurantId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    console.log('Restaurant upload error:', error?.message);
    return {
      success: false,
      error: error?.response?.data?.detail
        || error.message
        || 'Upload failed',
    };
  }
}

// ============================================
// UPLOAD DOCUMENT (for verification)
// ============================================
export async function uploadDocument(
  userId,
  docType,
  imageAsset
) {
  try {
    if (!userId || !docType || !imageAsset?.uri) {
      return { success: false, error: 'Invalid input' };
    }

    const formData = buildFormData(imageAsset);
    // 🔧 FIX: doc_type must be appended as form field
    formData.append('doc_type', docType);

    const response = await axios.post(
      `${API_URL}/upload/document/${userId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000, // longer timeout for docs
      }
    );

    return {
      success: true,
      url: response.data.image_url,
      public_id: response.data.public_id,
      doc_type: docType,
    };
  } catch (error) {
    console.log('Document upload error:', error?.message);
    return {
      success: false,
      error: error?.response?.data?.detail
        || error.message
        || 'Upload failed',
    };
  }
}

// ============================================
// 🆕 UPLOAD GENERAL IMAGE
// ============================================
export async function uploadGeneralImage(imageAsset) {
  try {
    if (!imageAsset?.uri) {
      return { success: false, error: 'No image selected' };
    }

    const formData = buildFormData(imageAsset);

    const response = await axios.post(
      `${API_URL}/upload/general`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

// ============================================
// 🆕 PICK AND UPLOAD (combined helper)
// ============================================
export async function pickAndUploadProfilePhoto(
  userId,
  source = 'gallery' // 'gallery' | 'camera'
) {
  let imageAsset;

  if (source === 'camera') {
    imageAsset = await takePhoto();
  } else {
    imageAsset = await pickImageFromGallery();
  }

  if (!imageAsset) return { success: false, cancelled: true };

  return await uploadProfilePhoto(userId, imageAsset);
}