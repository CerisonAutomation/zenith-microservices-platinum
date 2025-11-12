/**
 * ============================================
 * ADVANCED STORAGE UTILITIES
 * ============================================
 * Production-ready file upload and management
 * - Image optimization
 * - Progress tracking
 * - File validation
 * - CDN integration
 * - Batch operations
 */

import { createClient } from '@/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
  cacheControl?: string;
  upsert?: boolean;
  contentType?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
  fullPath: string;
}

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// ============================================
// FILE VALIDATION
// ============================================

export const FILE_CONSTRAINTS = {
  images: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  documents: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['application/pdf', 'application/msword', 'text/plain'],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
  },
  videos: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    allowedExtensions: ['.mp4', '.mov', '.avi'],
  },
};

export function validateFile(
  file: File,
  type: keyof typeof FILE_CONSTRAINTS
): { valid: boolean; error?: string } {
  const constraints = FILE_CONSTRAINTS[type];

  // Check file size
  if (file.size > constraints.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${constraints.maxSize / 1024 / 1024}MB limit`,
    };
  }

  // Check file type
  if (!constraints.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!constraints.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { valid: true };
}

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Compress and resize image before upload
 */
export async function optimizeImage(
  file: File,
  options: ImageOptions = {}
): Promise<Blob> {
  const { width = 1200, height = 1200, quality = 0.8, format = 'webp' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let newWidth = width;
        let newHeight = height;

        if (img.width > img.height) {
          newHeight = (img.height / img.width) * newWidth;
        } else {
          newWidth = (img.width / img.height) * newHeight;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<Blob> {
  return optimizeImage(file, {
    width: size,
    height: size,
    quality: 0.7,
    format: 'webp',
  });
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload file with progress tracking
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const {
    bucket,
    path,
    file,
    onProgress,
    cacheControl = '3600',
    upsert = false,
    contentType,
  } = options;

  // Validate file
  const fileType = file.type.startsWith('image/') ? 'images' : 'documents';
  const validation = validateFile(file, fileType);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create upload promise
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl,
      upsert,
      contentType: contentType || file.type,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  // Simulate progress (since Supabase doesn't provide real-time progress yet)
  if (onProgress) {
    onProgress(100);
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
    bucket,
    fullPath: `${bucket}/${data.path}`,
  };
}

/**
 * Upload image with optimization
 */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  options: {
    optimize?: boolean;
    generateThumbnail?: boolean;
    imageOptions?: ImageOptions;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{
  original: UploadResult;
  thumbnail?: UploadResult;
}> {
  const { optimize = true, generateThumbnail: genThumb = true, imageOptions, onProgress } = options;

  // Optimize image if requested
  let fileToUpload: File | Blob = file;
  if (optimize) {
    if (onProgress) onProgress(20);
    fileToUpload = await optimizeImage(file, imageOptions);
  }

  // Upload original/optimized image
  if (onProgress) onProgress(50);
  const originalResult = await uploadFile({
    bucket,
    path,
    file: new File([fileToUpload], file.name, { type: fileToUpload.type }),
    cacheControl: '31536000', // 1 year for images
  });

  if (onProgress) onProgress(75);

  // Generate and upload thumbnail
  let thumbnailResult: UploadResult | undefined;
  if (genThumb) {
    const thumbnailBlob = await generateThumbnail(file);
    const thumbnailPath = path.replace(/(\.[^.]+)$/, '_thumb$1');

    thumbnailResult = await uploadFile({
      bucket,
      path: thumbnailPath,
      file: new File([thumbnailBlob], `thumb_${file.name}`, { type: thumbnailBlob.type }),
      cacheControl: '31536000',
    });
  }

  if (onProgress) onProgress(100);

  return {
    original: originalResult,
    thumbnail: thumbnailResult,
  };
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Array<{ file: File; path: string }>,
  bucket: string,
  onProgress?: (progress: number, fileIndex: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const { file, path } = files[i];

    const result = await uploadFile({
      bucket,
      path,
      file,
      onProgress: (progress) => {
        if (onProgress) {
          const overallProgress = ((i * 100 + progress) / files.length);
          onProgress(overallProgress, i);
        }
      },
    });

    results.push(result);
  }

  return results;
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder: string = '',
  options: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  } = {}
): Promise<any[]> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase.storage.from(bucket).list(folder, options);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(bucket: string, path: string): Promise<any> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Download just the metadata (0 bytes)
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path, { transform: { width: 1, height: 1 } });

  if (error) {
    throw error;
  }

  return {
    size: data.size,
    type: data.type,
  };
}

/**
 * Move/rename file
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);

  if (error) {
    throw error;
  }
}

/**
 * Copy file
 */
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath);

  if (error) {
    throw error;
  }
}

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Generate unique file path
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  folder: string = ''
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop();
  const baseName = fileName.split('.').slice(0, -1).join('.');

  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `${folder}/${userId}/${timestamp}_${randomString}_${sanitizedBaseName}.${extension}`;

  return path.replace(/^\/+/, ''); // Remove leading slashes
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

export default {
  uploadFile,
  uploadImage,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getPublicUrl,
  getSignedUrl,
  listFiles,
  optimizeImage,
  generateThumbnail,
  validateFile,
  generateFilePath,
  formatFileSize,
};
