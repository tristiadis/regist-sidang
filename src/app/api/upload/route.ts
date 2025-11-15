import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const reqId = req.nextUrl.searchParams.get("reqId");
    const requestId = req.nextUrl.searchParams.get("requestId");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", requestId as string);
    await mkdir(uploadDir, { recursive: true });

    // Create safe filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${reqId}_${timestamp}_${safeName}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Update database
    await prisma.requirementFulfillment.create({
      data: {
        requestId: Number(requestId),
        requirementId: Number(reqId),
        isConfirmed: true,
        fileUrl: `/uploads/${requestId}/${filename}`
      }
    });

    return NextResponse.json({
      success: true,
      path: `/uploads/${requestId}/${filename}`
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
