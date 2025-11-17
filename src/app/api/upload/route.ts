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

export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK (CRITICAL!)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        error: "Unauthorized - Please login to upload files"
      }, { status: 401 });
    }

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
        return NextResponse.json({
          error: "Validasi input gagal",
          details: error.errors.map(e => e.message)
        }, { status: 400 });
      }
      throw error;
    }

    // 4. AUTHORIZATION CHECK - Verify user owns the request
    const request = await prisma.request.findUnique({
      where: { id: Number(requestId) },
      select: { mahasiswaId: true }
    });

    if (!request) {
      return NextResponse.json({
        error: "Request tidak ditemukan"
      }, { status: 404 });
    }

    // Only mahasiswa can upload files for their own request
    if (session.user.role === 'mahasiswa' && request.mahasiswaId !== Number(session.user.id)) {
      return NextResponse.json({
        error: "Anda tidak memiliki izin untuk mengupload file pada request ini"
      }, { status: 403 });
    }

    // 5. COMPREHENSIVE FILE VALIDATION (MIME type, size, extension)
    const validationResult = await validateFile(file);
    if (!validationResult.valid) {
      return NextResponse.json({
        error: "Validasi file gagal",
        details: validationResult.errors
      }, { status: 400 });
    }

    // 6. GENERATE SECURE FILE PATH (prevent path traversal)
    const baseDir = join(process.cwd(), "public", "uploads");
    const randomSuffix = randomBytes(8).toString('hex');
    const secureName = `${requirementId}_${randomSuffix}${validationResult.extension}`;

    const pathResult = generateSecureFilePath(baseDir, requestId, secureName);
    if (!pathResult.valid) {
      return NextResponse.json({
        error: pathResult.error || "Invalid file path"
      }, { status: 400 });
    }

    // 7. CREATE UPLOAD DIRECTORY
    const uploadDir = join(baseDir, requestId);
    await mkdir(uploadDir, { recursive: true });

    // 8. SAVE FILE WITH VALIDATED CONTENT
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, secureName);
    await writeFile(filePath, buffer);

    // 9. SAVE TO DATABASE
    await prisma.requirementFulfillment.create({
      data: {
        requestId: Number(requestId),
        requirementId: Number(requirementId),
        isConfirmed: true,
        fileUrl: `/uploads/${requestId}/${secureName}`
      }
    });

    return NextResponse.json({
      success: true,
      path: `/uploads/${requestId}/${secureName}`,
      message: `File "${sanitizeFilename(file.name)}" berhasil diupload`,
      fileSize: (file.size / 1024).toFixed(2) + ' KB'
    });

  } catch (error: any) {
    console.error("Upload error:", error);

    // Error messages yang lebih spesifik
    if (error.code === 'ENOSPC') {
      return NextResponse.json({
        error: "Ruang penyimpanan server penuh. Hubungi administrator."
      }, { status: 500 });
    }

    if (error.code === 'EACCES') {
      return NextResponse.json({
        error: "Tidak memiliki izin untuk menyimpan file. Hubungi administrator."
      }, { status: 500 });
    }

    return NextResponse.json({
      error: `Upload gagal: ${error.message || 'Terjadi kesalahan server'}`
    }, { status: 500 });
  }
}
