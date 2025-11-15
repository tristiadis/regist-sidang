import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sidangTypeId = req.nextUrl.searchParams.get("sidangTypeId");
  const role = req.nextUrl.searchParams.get("role");

  const where: any = {};
  if (sidangTypeId) where.sidangTypeId = Number(sidangTypeId);
  if (role) where.role = role;

  const requirements = await prisma.requirement.findMany({
    where
  });
  return NextResponse.json(requirements);
}

export async function POST(req: NextRequest) {
  const { role, sidangTypeId, name, description, needsFile } = await req.json();
  const reqData = await prisma.requirement.create({
    data: { role, sidangTypeId, name, description, needsFile }
  });
  return NextResponse.json(reqData);
}
