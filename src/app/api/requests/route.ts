import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const all = req.nextUrl.searchParams.get("all");

  const where: any = {};
  if (status) where.status = status;

  const requests = await prisma.request.findMany({
    where: all ? undefined : where,
    include: {
      mahasiswa: true,
      sidangType: true,
      currentStep: true,
      revisiNotes: {
        include: {
          dosen: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "mahasiswa") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { sidangTypeId } = await req.json();

  // Get first step
  const firstStep = await prisma.workflowStep.findFirst({
    where: { sidangTypeId },
    orderBy: { stepOrder: "asc" }
  });

  const request = await prisma.request.create({
    data: {
      mahasiswaId: Number(session.user.id),
      sidangTypeId,
      currentStepId: firstStep?.id || null,
      status: firstStep ? "pending" : "waiting_admin"
    }
  });

  return NextResponse.json(request);
}
