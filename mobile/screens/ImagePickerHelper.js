// ImagePickerHelper.js
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = 'https://onebohol-production.up.railway.app';

// ============================================
// REQUEST PERMISSIONS
// ============================================
export async function requestImagePermission() {
  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
}

export async function requestCameraPermission() {
  const { status } =
    await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
}

// ============================================
// PICK FROM GALLERY
// ============================================
export async function pickImageFromGallery() {
  const hasPermission = await requestImagePermission();
  if (!hasPermission) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

// ============================================
// TAKE PHOTO WITH CAMERA
// ============================================
export async function takePhoto() {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

// ============================================
// UPLOAD PROFILE PHOTO
// ============================================
export async function uploadProfilePhoto(
  userId,
  imageAsset
) {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageAsset.uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    const response = await axios.post(
      `${API_URL}/upload/profile/${userId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
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
    const formData = new FormData();
    formData.append('file', {
      uri: imageAsset.uri,
      type: 'image/jpeg',
      name: 'product.jpg',
    });

    const response = await axios.post(
      `${API_URL}/upload/product/${productId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
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
    const formData = new FormData();
    formData.append('file', {
      uri: imageAsset.uri,
      type: 'image/jpeg',
      name: 'restaurant.jpg',
    });

    const response = await axios.post(
      `${API_URL}/upload/restaurant/${restaurantId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// UPLOAD DOCUMENT
// ============================================
export async function uploadDocument(
  userId,
  docType,
  imageAsset
) {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageAsset.uri,
      type: 'image/jpeg',
      name: `${docType}.jpg`,
    });
    formData.append('doc_type', docType);

    const response = await axios.post(
      `${API_URL}/upload/document/${userId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.image_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}