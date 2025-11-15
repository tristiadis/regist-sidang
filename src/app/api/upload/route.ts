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

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validasi folder
    const uploadDir = join(process.cwd(), "public", "uploads", requestId);
    await mkdir(uploadDir, { recursive: true });

    // Generate safe filename
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = extname(file.name);
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
      path: `/uploads/${requestId}/${fileName}`
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}
