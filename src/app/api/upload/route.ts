import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;
    const requirementId = formData.get("requirementId") as string;

    // Validasi input
    if (!file) {
      return NextResponse.json({
        error: "File tidak ditemukan. Silakan pilih file terlebih dahulu."
      }, { status: 400 });
    }

    if (!requestId || !requirementId) {
      return NextResponse.json({
        error: "Data request tidak lengkap. Silakan coba lagi."
      }, { status: 400 });
    }

    // Validasi ukuran file (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 10MB.`
      }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip'];
    const fileExt = extname(file.name).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json({
        error: `Tipe file ${fileExt} tidak didukung. Gunakan: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validasi folder
    const uploadDir = join(process.cwd(), "public", "uploads", requestId);
    await mkdir(uploadDir, { recursive: true });

    // Generate safe filename
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${requirementId}_${randomBytes(8).toString('hex')}${fileExt}`;
    const filePath = join(uploadDir, fileName);

    // Simpan file
    await writeFile(filePath, buffer);

    // Simpan ke DB
    await prisma.requirementFulfillment.create({
      data: {
        requestId: Number(requestId),
        requirementId: Number(requirementId),
        isConfirmed: true,
        fileUrl: `/uploads/${requestId}/${fileName}`
      }
    });

    return NextResponse.json({
      success: true,
      path: `/uploads/${requestId}/${fileName}`,
      message: `File "${file.name}" berhasil diupload`
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
