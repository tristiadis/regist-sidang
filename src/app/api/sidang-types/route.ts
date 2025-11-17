import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to access sidang types"
    }, { status: 401 });
  }

  // 2. FETCH SIDANG TYPES
  const active = req.nextUrl.searchParams.get("active");
  const types = await prisma.sidangType.findMany({
    where: active ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: types
  });
}
