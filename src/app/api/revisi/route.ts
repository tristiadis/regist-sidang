import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import {
  revisiUploadSchema,
  validateFile,
  generateSecureFilePath,
  sanitizeFilename
} from "@/lib/fileValidation";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        error: "Unauthorized - Please login to continue"
      }, { status: 401 });
    }

    // 2. AUTHORIZATION CHECK - Only dosen can create revisi notes
    if (session.user.role !== "dosen") {
      return NextResponse.json({
        error: "Forbidden - Only dosen can create revision notes"
      }, { status: 403 });
    }

    // 3. PARSE FORM DATA
    const formData = await req.formData();
    const catatan = formData.get("catatan") as string;
    const requestId = formData.get("requestId") as string;
    const file = formData.get("file") as File | null;

    // 4. VALIDATE INPUT WITH ZOD SCHEMA
    try {
      revisiUploadSchema.parse({ requestId, catatan, file });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: "Validasi input gagal",
          details: error.errors.map(e => e.message)
        }, { status: 400 });
      }
      throw error;
    }

    // 5. VERIFY REQUEST EXISTS
    const request = await prisma.request.findUnique({
      where: { id: Number(requestId) },
      select: { id: true, mahasiswaId: true }
    });

    if (!request) {
      return NextResponse.json({
        error: "Request tidak ditemukan"
      }, { status: 404 });
    }

    // 6. VERIFY DOSEN IS ASSIGNED TO THIS REQUEST
    const isAssigned = await prisma.approval.findFirst({
      where: {
        requestId: Number(requestId),
        approvedBy: Number(session.user.id)
      }
    });

    if (!isAssigned) {
      return NextResponse.json({
        error: "Anda tidak memiliki izin untuk memberikan revisi pada request ini"
      }, { status: 403 });
    }

    // 7. HANDLE FILE UPLOAD IF PROVIDED
    let fileUrl = null;
    if (file) {
      // Comprehensive file validation (MIME type, size, extension)
      const validationResult = await validateFile(file);
      if (!validationResult.valid) {
        return NextResponse.json({
          error: "Validasi file gagal",
          details: validationResult.errors
        }, { status: 400 });
      }

      // Generate secure file path (prevent path traversal)
      const baseDir = join(process.cwd(), "public", "uploads", "revisi");
      const randomSuffix = randomBytes(8).toString('hex');
      const secureName = `revisi_${randomSuffix}${validationResult.extension}`;

      const pathResult = generateSecureFilePath(baseDir, requestId, secureName);
      if (!pathResult.valid) {
        return NextResponse.json({
          error: pathResult.error || "Invalid file path"
        }, { status: 400 });
      }

      // Create upload directory
      const uploadDir = join(baseDir, requestId);
      await mkdir(uploadDir, { recursive: true });

      // Save file with validated content
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = join(uploadDir, secureName);
      await writeFile(filePath, buffer);

      fileUrl = `/uploads/revisi/${requestId}/${secureName}`;
    }

    // 8. CREATE REVISI NOTE
    const revisiNote = await prisma.revisiNote.create({
      data: {
        requestId: Number(requestId),
        dosenId: Number(session.user.id),
        catatan,
        fileUrl
      },
      include: {
        dosen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Catatan revisi berhasil ditambahkan",
      data: revisiNote
    });

  } catch (error: any) {
    console.error("Revisi upload error:", error);

    // Specific error messages
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
