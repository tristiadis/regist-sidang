import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // ============================================
  // 1. AUTHENTICATION CHECK
  // ============================================
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to continue"
    }, { status: 401 });
  }

  // ============================================
  // 2. PARSE AND VALIDATE INPUT
  // ============================================
  const { requestId, action, notes } = await req.json();

  if (!requestId || !action) {
    return NextResponse.json({
      error: "Missing required fields: requestId and action"
    }, { status: 400 });
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({
      error: "Invalid action. Must be 'approve' or 'reject'"
    }, { status: 400 });
  }

  if (action === 'reject' && (!notes || notes.trim().length < 10)) {
    return NextResponse.json({
      error: "Rejection reason is required (minimum 10 characters)"
    }, { status: 400 });
  }

  // ============================================
  // 3. GET REQUEST WITH CURRENT STEP
  // ============================================
  const request = await prisma.request.findUnique({
    where: { id: Number(requestId) },
    include: {
      currentStep: true,
      mahasiswa: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!request) {
    return NextResponse.json({
      error: "Request not found"
    }, { status: 404 });
  }

  if (!request.currentStep) {
    return NextResponse.json({
      error: "This request is not in an approvable state"
    }, { status: 400 });
  }

  // ============================================
  // 4. AUTHORIZATION CHECKS (CRITICAL!)
  // ============================================

  // 4a. Check if user's role matches the required step role
  if (session.user.role !== request.currentStep.role) {
    return NextResponse.json({
      error: `Unauthorized - This step requires ${request.currentStep.role} role, but you are ${session.user.role}`
    }, { status: 403 });
  }

  // 4b. Check if there's an approval record for this user
  const approval = await prisma.approval.findFirst({
    where: {
      requestId: Number(requestId),
      stepId: request.currentStep.id,
      approvedBy: Number(session.user.id)
    }
  });

  if (!approval) {
    return NextResponse.json({
      error: "You are not assigned to approve this request"
    }, { status: 403 });
  }

  // 4c. Check if approval is still pending
  if (approval.action !== 'pending') {
    return NextResponse.json({
      error: `This request has already been ${approval.action}ed by you`
    }, { status: 400 });
  }

  // 4d. Prevent mahasiswa from approving their own request
  if (request.mahasiswa.id === Number(session.user.id)) {
    return NextResponse.json({
      error: "You cannot approve your own request"
    }, { status: 403 });
  }

  // ============================================
  // 5. UPDATE APPROVAL RECORD
  // ============================================
  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      action,
      notes: action === 'reject' ? notes : null,
      approvedAt: new Date()
    }
  });

  // ============================================
  // 6. UPDATE REQUEST STATUS
  // ============================================
  if (action === 'reject') {
    // Rejection: Update request status to rejected
    await prisma.request.update({
      where: { id: Number(requestId) },
      data: {
        status: "rejected",
        currentStepId: null
      }
    });
  } else {
    // Approval: Move to next step or complete
    const nextStep = await prisma.workflowStep.findFirst({
      where: {
        sidangTypeId: request.sidangTypeId,
        stepOrder: request.currentStep.stepOrder + 1
      }
    });

    if (nextStep) {
      // Move to next step
      await prisma.request.update({
        where: { id: Number(requestId) },
        data: { currentStepId: nextStep.id }
      });
    } else {
      // All steps completed - go to admin review
      await prisma.request.update({
        where: { id: Number(requestId) },
        data: {
          status: "waiting_admin",
          currentStepId: null
        }
      });
    }
  }

  // ============================================
  // 7. RETURN SUCCESS RESPONSE
  // ============================================
  return NextResponse.json({
    success: true,
    message: `Request ${action}ed successfully`,
    data: {
      requestId: request.id,
      action,
      nextStatus: action === 'reject' ? 'rejected' : (nextStep ? 'pending' : 'waiting_admin')
    }
  });
}
