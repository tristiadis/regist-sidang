import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sidangTypeId = req.nextUrl.searchParams.get("sidangTypeId");
  const steps = await prisma.workflowStep.findMany({
    where: { sidangTypeId: Number(sidangTypeId) },
    orderBy: { stepOrder: "asc" }
  });
  return NextResponse.json(steps);
}

export async function POST(req: NextRequest) {
  const { sidangTypeId, role, description } = await req.json();

  const maxOrder = await prisma.workflowStep.aggregate({
    where: { sidangTypeId },
    _max: { stepOrder: true }
  });

  const newStep = await prisma.workflowStep.create({
    data: {
      sidangTypeId,
      stepOrder: (maxOrder._max.stepOrder || 0) + 1,
      role,
      description
    }
  });

  return NextResponse.json(newStep);
}
