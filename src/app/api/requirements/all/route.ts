import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sidangTypeId = req.nextUrl.searchParams.get("sidangTypeId");
  const requirements = await prisma.requirement.findMany({
    where: { sidangTypeId: Number(sidangTypeId) }
  });
  return NextResponse.json(requirements);
}
