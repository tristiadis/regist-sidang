import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const active = req.nextUrl.searchParams.get("active");
  const types = await prisma.sidangType.findMany({
    where: active ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(types);
}
