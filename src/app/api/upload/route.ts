import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fileUploadSchema,
  validateFile,
  generateSecureFilePath,
  sanitizeFilename
} from "@/lib/fileValidation";
import { z } from "zod";
import { successResponse, errorResponse, ApiErrorCode } from "@/lib/apiResponse";
import { logger, createRequestContext, PerformanceTimer } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const timer = new PerformanceTimer();
  const requestContext = createRequestContext(req);

  try {
    logger.apiRequest('POST', '/api/upload', requestContext);

    // 1. AUTHENTICATION CHECK (CRITICAL!)
    const session = await getServerSession(authOptions);
    if (!session) {
      logger.security('unauthorized_access', requestContext);
      return errorResponse(
        "Unauthorized - Please login to upload files",
        ApiErrorCode.UNAUTHORIZED
      );
    }

    requestContext.userId = session.user.id;

    // 2. PARSE AND VALIDATE FORM DATA
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;
    const requirementId = formData.get("requirementId") as string;

    // 3. VALIDATE INPUT WITH ZOD SCHEMA
    try {
      fileUploadSchema.parse({ requestId, requirementId, file });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('File upload validation failed', {
          ...requestContext,
          errors: error.errors.map(e => e.message)
        });
        return errorResponse(
          "Validasi input gagal",
          ApiErrorCode.VALIDATION_ERROR,
          { details: error.errors.map(e => e.message) }
        );
      }
      throw error;
    }

    // 4. AUTHORIZATION CHECK - Verify user owns the request
    const request = await prisma.request.findUnique({
      where: { id: Number(requestId) },
      select: { mahasiswaId: true }
    });

    if (!request) {
      logger.warn('Request not found for file upload', {
        ...requestContext,
        requestId
      });
      return errorResponse(
        "Request tidak ditemukan",
        ApiErrorCode.NOT_FOUND
      );
    }

    // Only mahasiswa can upload files for their own request
    if (session.user.role === 'mahasiswa' && request.mahasiswaId !== Number(session.user.id)) {
      logger.security('unauthorized_access', {
        ...requestContext,
        requestId,
        reason: 'Attempting to upload file for another user\'s request'
      });
      return errorResponse(
        "Anda tidak memiliki izin untuk mengupload file pada request ini",
        ApiErrorCode.FORBIDDEN
      );
    }

    // 5. COMPREHENSIVE FILE VALIDATION (MIME type, size, extension)
    const validationResult = await validateFile(file);
    if (!validationResult.valid) {
      logger.warn('File validation failed', {
        ...requestContext,
        requestId,
        fileName: file.name,
        fileSize: file.size,
        errors: validationResult.errors
      });
      return errorResponse(
        "Validasi file gagal",
        ApiErrorCode.VALIDATION_ERROR,
        { details: validationResult.errors }
      );
    }

    // 6. GENERATE SECURE FILE PATH (prevent path traversal)
    const baseDir = join(process.cwd(), "public", "uploads");
    const randomSuffix = randomBytes(8).toString('hex');
    const secureName = `${requirementId}_${randomSuffix}${validationResult.extension}`;

    const pathResult = generateSecureFilePath(baseDir, requestId, secureName);
    if (!pathResult.valid) {
      logger.warn('Invalid file path generated', {
        ...requestContext,
        requestId,
        secureName,
        error: pathResult.error
      });
      return errorResponse(
        pathResult.error || "Invalid file path",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // 7. CREATE UPLOAD DIRECTORY
    const uploadDir = join(baseDir, requestId);
    await mkdir(uploadDir, { recursive: true });

    // 8. SAVE FILE WITH VALIDATED CONTENT
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, secureName);
    const fileWriteTimer = new PerformanceTimer();
    await writeFile(filePath, buffer);

    logger.fileOperation('upload', secureName, file.size, {
      ...requestContext,
      requestId,
      requirementId,
      duration: fileWriteTimer.elapsed()
    });

    // 9. SAVE TO DATABASE
    await prisma.requirementFulfillment.create({
      data: {
        requestId: Number(requestId),
        requirementId: Number(requirementId),
        isConfirmed: true,
        fileUrl: `/uploads/${requestId}/${secureName}`
      }
    });

    const fileSizeKB = (file.size / 1024).toFixed(2);
    const duration = timer.elapsed();

    logger.apiResponse('POST', '/api/upload', 200, duration, {
      ...requestContext,
      requestId,
      fileName: secureName,
      fileSize: fileSizeKB + ' KB'
    });

    return successResponse({
      path: `/uploads/${requestId}/${secureName}`,
      fileName: sanitizeFilename(file.name),
      fileSize: fileSizeKB + ' KB'
    }, `File "${sanitizeFilename(file.name)}" berhasil diupload`);

  } catch (error: any) {
    logger.error('File upload error', error, {
      ...requestContext,
      errorCode: error.code
    });

    // Error messages yang lebih spesifik
    if (error.code === 'ENOSPC') {
      return errorResponse(
        "Ruang penyimpanan server penuh. Hubungi administrator.",
        ApiErrorCode.INTERNAL_ERROR
      );
    }

    if (error.code === 'EACCES') {
      return errorResponse(
        "Tidak memiliki izin untuk menyimpan file. Hubungi administrator.",
        ApiErrorCode.INTERNAL_ERROR
      );
    }

    return errorResponse(
      `Upload gagal: ${error.message || 'Terjadi kesalahan server'}`,
      ApiErrorCode.INTERNAL_ERROR
    );
  }
}
