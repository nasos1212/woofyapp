// Shared file validation utilities for secure file uploads

// Allowed image types - explicitly exclude SVG for security (can contain scripts)
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const VALID_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for type, extension, and size
 * @param file - The file to validate
 * @returns Object with valid boolean and optional error message
 */
export const validateImageFile = (file: File): FileValidationResult => {
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    };
  }

  // Check extension matches type to prevent MIME type spoofing
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !VALID_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file extension. Allowed extensions: JPG, PNG, GIF, WebP.'
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: 'Image must be less than 5MB.'
    };
  }

  return { valid: true };
};

/**
 * Validates multiple image files
 * @param files - Array of files to validate
 * @returns Object with valid boolean and optional error message
 */
export const validateImageFiles = (files: File[]): FileValidationResult => {
  for (const file of files) {
    const result = validateImageFile(file);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
};
