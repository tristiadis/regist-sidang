import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { requestId, action, notes } = await req.json();

  // Get current request
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { currentStep: true }
  });

  if (!request || !request.currentStep) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Record approval
  await prisma.approval.create({
    data: {
      requestId,
      stepId: request.currentStep.id,
      approvedBy: Number(session.user.id),
      action,
      notes: action === 'reject' ? notes : null
    }
  });

  // Determine next step or finalize
  if (action === 'reject') {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "rejected" }
    });
  } else {
    const nextStep = await prisma.workflowStep.findFirst({
      where: {
        sidangTypeId: request.sidangTypeId,
        stepOrder: request.currentStep.stepOrder + 1
      }
    });

    if (nextStep) {
      await prisma.request.update({
        where: { id: requestId },
        data: { currentStepId: nextStep.id }
      });
    } else {
      // All steps completed - go to admin review
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "waiting_admin", currentStepId: null }
      });
    }
  }

  return NextResponse.json({ success: true });
}
