import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "dosen") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const catatan = formData.get("catatan") as string;
  const requestId = formData.get("requestId") as string;
  const file = formData.get("file") as File | null;

  let fileUrl = null;
  if (file) {
    const uploadDir = join(process.cwd(), "public", "uploads", "revisi", requestId);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `revisi_${randomBytes(8).toString('hex')}${extname(file.name)}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    fileUrl = `/uploads/revisi/${requestId}/${fileName}`;
  }

  await prisma.revisiNote.create({
    data: {
      requestId: Number(requestId),
      dosenId: Number(session.user.id),
      catatan,
      fileUrl
    }
  });

  return NextResponse.json({ success: true });
}
