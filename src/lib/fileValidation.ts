import { fileTypeFromBuffer } from 'file-type';
import { extname, basename } from 'path';
import { z } from 'zod';

// ============================================
// File Type Configurations
// ============================================

export const ALLOWED_FILE_TYPES = {
  documents: {
    extensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  images: {
    extensions: ['.jpg', '.jpeg', '.png'],
    mimeTypes: [
      'image/jpeg',
      'image/png'
    ],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  archives: {
    extensions: ['.zip'],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed'
    ],
    maxSize: 20 * 1024 * 1024 // 20MB
  }
} as const;

// Flattened allowed types for general validation
export const ALL_ALLOWED_EXTENSIONS = [
  ...ALLOWED_FILE_TYPES.documents.extensions,
  ...ALLOWED_FILE_TYPES.images.extensions,
  ...ALLOWED_FILE_TYPES.archives.extensions
];

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_FILE_TYPES.documents.mimeTypes,
  ...ALLOWED_FILE_TYPES.images.mimeTypes,
  ...ALLOWED_FILE_TYPES.archives.mimeTypes
];

// ============================================
// Zod Schemas for Validation
// ============================================

export const fileUploadSchema = z.object({
  requestId: z.string().regex(/^\d+$/, "Request ID must be a number"),
  requirementId: z.string().regex(/^\d+$/, "Requirement ID must be a number"),
  file: z.custom<File>((val) => val instanceof File, "File is required")
});

export const revisiUploadSchema = z.object({
  requestId: z.string().regex(/^\d+$/, "Request ID must be a number"),
  catatan: z.string().min(10, "Catatan harus minimal 10 karakter").max(1000, "Catatan maksimal 1000 karakter"),
  file: z.custom<File | null>((val) => val === null || val instanceof File, "Invalid file")
});

// ============================================
// Path Sanitization
// ============================================

/**
 * Sanitizes a filename to prevent path traversal attacks
 * Removes special characters, path separators, and normalizes the name
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and normalize
  const base = basename(filename);

  // Remove any characters that aren't alphanumeric, dots, hyphens, or underscores
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove leading dots to prevent hidden files
  const withoutLeadingDots = sanitized.replace(/^\.+/, '');

  // Ensure filename isn't empty after sanitization
  if (!withoutLeadingDots || withoutLeadingDots === '_') {
    return 'file_' + Date.now();
  }

  return withoutLeadingDots;
}

/**
 * Validates that a path doesn't contain traversal attempts
 */
export function isValidPath(path: string): boolean {
  // Check for path traversal patterns
  const dangerousPatterns = [
    /\.\./,           // Parent directory
    /\0/,             // Null byte
    /~/,              // Home directory
    /^[\/\\]/,        // Absolute path
  ];

  return !dangerousPatterns.some(pattern => pattern.test(path));
}

// ============================================
// File Extension Validation
// ============================================

export interface ExtensionValidationResult {
  valid: boolean;
  extension: string;
  error?: string;
}

export function validateFileExtension(filename: string): ExtensionValidationResult {
  const extension = extname(filename).toLowerCase();

  if (!extension) {
    return {
      valid: false,
      extension: '',
      error: 'File tidak memiliki ekstensi'
    };
  }

  if (!ALL_ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      extension,
      error: `Tipe file ${extension} tidak didukung. Gunakan: ${ALL_ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  return {
    valid: true,
    extension
  };
}

// ============================================
// MIME Type Validation (Content-Based)
// ============================================

export interface MimeValidationResult {
  valid: boolean;
  detectedMime?: string;
  detectedExtension?: string;
  error?: string;
}

/**
 * Validates file MIME type by inspecting file content (magic bytes)
 * This prevents users from simply renaming files with wrong extensions
 */
export async function validateFileMimeType(
  buffer: Buffer,
  expectedExtension: string
): Promise<MimeValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    // Special handling for certain file types
    // Some files (like .doc, .docx, .zip) may not be detectable or may have multiple signatures
    const specialCases = ['.doc', '.docx', '.zip'];

    if (!fileType) {
      // If file type can't be detected, it might be a plain text or Office document
      // For Office documents (especially .docx which are ZIP-based), we allow if extension matches
      if (specialCases.includes(expectedExtension)) {
        // Additional validation: check if it's a valid ZIP (for .docx and .zip)
        if (expectedExtension === '.docx' || expectedExtension === '.zip') {
          const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B; // PK header
          if (isZip) {
            return { valid: true };
          }
        }

        // For .doc files, allow if magic bytes indicate Office format
        if (expectedExtension === '.doc') {
          const isDoc = buffer[0] === 0xD0 && buffer[1] === 0xCF; // MS Office header
          if (isDoc) {
            return { valid: true };
          }
        }
      }

      return {
        valid: false,
        error: 'Tidak dapat mendeteksi tipe file. File mungkin rusak atau tidak valid.'
      };
    }

    const detectedMime = fileType.mime;
    const detectedExt = '.' + fileType.ext;

    // Check if detected MIME type is in our allowed list
    if (!ALL_ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return {
        valid: false,
        detectedMime,
        detectedExtension: detectedExt,
        error: `Tipe file tidak diizinkan. Terdeteksi: ${detectedMime}`
      };
    }

    // Verify extension matches detected type
    // Allow some flexibility for JPEG (.jpg vs .jpeg)
    if (expectedExtension === '.jpg' || expectedExtension === '.jpeg') {
      if (detectedMime !== 'image/jpeg') {
        return {
          valid: false,
          detectedMime,
          detectedExtension: detectedExt,
          error: `File extension tidak sesuai dengan konten. Extension: ${expectedExtension}, Detected: ${detectedMime}`
        };
      }
    } else if (detectedExt !== expectedExtension) {
      // For ZIP-based formats (.docx), the detected type might be 'zip'
      if (expectedExtension === '.docx' && detectedMime === 'application/zip') {
        // This is acceptable as .docx files are ZIP archives
        return { valid: true, detectedMime, detectedExtension: detectedExt };
      }

      return {
        valid: false,
        detectedMime,
        detectedExtension: detectedExt,
        error: `File extension tidak sesuai dengan konten. Extension: ${expectedExtension}, Detected: ${detectedExt}`
      };
    }

    return {
      valid: true,
      detectedMime,
      detectedExtension: detectedExt
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Gagal memvalidasi tipe file'
    };
  }
}

// ============================================
// File Size Validation
// ============================================

export interface SizeValidationResult {
  valid: boolean;
  size: number;
  maxSize: number;
  error?: string;
}

export function validateFileSize(file: File, extension: string): SizeValidationResult {
  let maxSize = 10 * 1024 * 1024; // Default 10MB

  // Determine max size based on file type
  if (ALLOWED_FILE_TYPES.documents.extensions.includes(extension)) {
    maxSize = ALLOWED_FILE_TYPES.documents.maxSize;
  } else if (ALLOWED_FILE_TYPES.images.extensions.includes(extension)) {
    maxSize = ALLOWED_FILE_TYPES.images.maxSize;
  } else if (ALLOWED_FILE_TYPES.archives.extensions.includes(extension)) {
    maxSize = ALLOWED_FILE_TYPES.archives.maxSize;
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      size: file.size,
      maxSize,
      error: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal ${(maxSize / 1024 / 1024).toFixed(0)}MB untuk tipe file ini.`
    };
  }

  // Also check for suspiciously small files
  if (file.size < 100) { // Less than 100 bytes
    return {
      valid: false,
      size: file.size,
      maxSize,
      error: 'File terlalu kecil atau kosong'
    };
  }

  return {
    valid: true,
    size: file.size,
    maxSize
  };
}

// ============================================
// Comprehensive File Validation
// ============================================

export interface FileValidationResult {
  valid: boolean;
  sanitizedFilename?: string;
  extension?: string;
  errors: string[];
}

/**
 * Comprehensive file validation that checks:
 * 1. Filename sanitization
 * 2. Extension validity
 * 3. File size
 * 4. MIME type (content-based)
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const errors: string[] = [];

  // 1. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);

  // 2. Validate extension
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) {
    errors.push(extResult.error!);
    return { valid: false, errors };
  }

  // 3. Validate file size
  const sizeResult = validateFileSize(file, extResult.extension);
  if (!sizeResult.valid) {
    errors.push(sizeResult.error!);
  }

  // 4. Validate MIME type (content-based)
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeResult = await validateFileMimeType(buffer, extResult.extension);
  if (!mimeResult.valid) {
    errors.push(mimeResult.error!);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      sanitizedFilename,
      extension: extResult.extension,
      errors
    };
  }

  return {
    valid: true,
    sanitizedFilename,
    extension: extResult.extension,
    errors: []
  };
}

// ============================================
// Secure File Path Generation
// ============================================

export interface SecurePathResult {
  valid: boolean;
  fullPath?: string;
  relativePath?: string;
  error?: string;
}

/**
 * Generates a secure file path with validation
 */
export function generateSecureFilePath(
  baseDir: string,
  requestId: string,
  fileName: string
): SecurePathResult {
  // Validate requestId (should be numeric)
  if (!/^\d+$/.test(requestId)) {
    return {
      valid: false,
      error: 'Invalid request ID format'
    };
  }

  // Validate base directory path
  if (!isValidPath(baseDir)) {
    return {
      valid: false,
      error: 'Invalid base directory path'
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeFilename(fileName);

  // Build safe relative path
  const relativePath = `${requestId}/${sanitizedName}`;

  // Validate the complete path doesn't contain traversal
  if (!isValidPath(relativePath)) {
    return {
      valid: false,
      error: 'Invalid file path detected'
    };
  }

  return {
    valid: true,
    relativePath,
    fullPath: `${baseDir}/${relativePath}`
  };
}
