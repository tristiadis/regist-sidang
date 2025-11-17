import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to access requirements"
    }, { status: 401 });
  }

  // 2. FETCH REQUIREMENTS
  const sidangTypeId = req.nextUrl.searchParams.get("sidangTypeId");
  const role = req.nextUrl.searchParams.get("role");

  const where: any = {};
  if (sidangTypeId) where.sidangTypeId = Number(sidangTypeId);
  if (role) where.role = role;

  const requirements = await prisma.requirement.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: requirements
  });
}

export async function POST(req: NextRequest) {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to create requirements"
    }, { status: 401 });
  }

  // 2. AUTHORIZATION CHECK - Only admin and akademik can create requirements
  if (session.user.role !== 'admin' && session.user.role !== 'akademik') {
    return NextResponse.json({
      error: "Forbidden - Only admin and akademik can create requirements"
    }, { status: 403 });
  }

  // 3. PARSE AND VALIDATE INPUT
  const { role, sidangTypeId, name, description, needsFile } = await req.json();

  if (!sidangTypeId || !name) {
    return NextResponse.json({
      error: "Missing required fields: sidangTypeId and name"
    }, { status: 400 });
  }

  // 4. CREATE REQUIREMENT
  const reqData = await prisma.requirement.create({
    data: { role, sidangTypeId, name, description, needsFile }
  });

  return NextResponse.json({
    success: true,
    message: "Requirement created successfully",
    data: reqData
  });
}
