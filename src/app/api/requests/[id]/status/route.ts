import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();

  await prisma.request.update({
    where: { id: Number(params.id) },
    data: { status }
  });

  return NextResponse.json({ success: true });
}
