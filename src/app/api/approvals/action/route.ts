import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { successResponse, errorResponse, ApiErrorCode } from "@/lib/apiResponse";
import { logger, createRequestContext, PerformanceTimer } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const timer = new PerformanceTimer();
  const requestContext = createRequestContext(req);

  try {
    logger.apiRequest('POST', '/api/approvals/action', requestContext);

    // ============================================
    // 1. AUTHENTICATION CHECK
    // ============================================
    const session = await getServerSession(authOptions);
    if (!session) {
      logger.security('unauthorized_access', requestContext);
      return errorResponse(
        "Unauthorized - Please login to continue",
        ApiErrorCode.UNAUTHORIZED
      );
    }

    requestContext.userId = session.user.id;

    // ============================================
    // 2. PARSE AND VALIDATE INPUT
    // ============================================
    const { requestId, action, notes } = await req.json();

    if (!requestId || !action) {
      logger.warn('Missing required fields in approval action', {
        ...requestContext,
        requestId,
        action
      });
      return errorResponse(
        "Missing required fields: requestId and action",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      logger.warn('Invalid action in approval', {
        ...requestContext,
        requestId,
        action
      });
      return errorResponse(
        "Invalid action. Must be 'approve' or 'reject'",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    if (action === 'reject' && (!notes || notes.trim().length < 10)) {
      logger.warn('Insufficient rejection notes', {
        ...requestContext,
        requestId,
        notesLength: notes?.length || 0
      });
      return errorResponse(
        "Rejection reason is required (minimum 10 characters)",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // ============================================
    // 3. GET REQUEST WITH CURRENT STEP
    // ============================================
    logger.dbQuery('findUnique', 'request', 0, {
      ...requestContext,
      requestId
    });

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
      logger.warn('Request not found', {
        ...requestContext,
        requestId
      });
      return errorResponse(
        "Request not found",
        ApiErrorCode.NOT_FOUND
      );
    }

    if (!request.currentStep) {
      logger.warn('Request not in approvable state', {
        ...requestContext,
        requestId,
        status: request.status
      });
      return errorResponse(
        "This request is not in an approvable state",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // ============================================
    // 4. AUTHORIZATION CHECKS (CRITICAL!)
    // ============================================

    // 4a. Check if user's role matches the required step role
    if (session.user.role !== request.currentStep.role) {
      logger.security('unauthorized_access', {
        ...requestContext,
        requestId,
        requiredRole: request.currentStep.role,
        userRole: session.user.role
      });
      return errorResponse(
        `Unauthorized - This step requires ${request.currentStep.role} role, but you are ${session.user.role}`,
        ApiErrorCode.FORBIDDEN
      );
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
      logger.security('unauthorized_access', {
        ...requestContext,
        requestId,
        reason: 'Not assigned as approver'
      });
      return errorResponse(
        "You are not assigned to approve this request",
        ApiErrorCode.FORBIDDEN
      );
    }

    // 4c. Check if approval is still pending
    if (approval.action !== 'pending') {
      logger.warn('Duplicate approval attempt', {
        ...requestContext,
        requestId,
        previousAction: approval.action
      });
      return errorResponse(
        `This request has already been ${approval.action}ed by you`,
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // 4d. Prevent mahasiswa from approving their own request
    if (request.mahasiswa.id === Number(session.user.id)) {
      logger.security('unauthorized_access', {
        ...requestContext,
        requestId,
        reason: 'Self-approval attempt'
      });
      return errorResponse(
        "You cannot approve your own request",
        ApiErrorCode.FORBIDDEN
      );
    }

    // ============================================
    // 5. UPDATE APPROVAL RECORD
    // ============================================
    logger.dbQuery('update', 'approval', 0, {
      ...requestContext,
      approvalId: approval.id,
      action
    });

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
    let nextStatus: string;

    if (action === 'reject') {
      // Rejection: Update request status to rejected
      logger.info('Request rejected', {
        ...requestContext,
        requestId,
        rejectionReason: notes
      });

      await prisma.request.update({
        where: { id: Number(requestId) },
        data: {
          status: "rejected",
          currentStepId: null
        }
      });
      nextStatus = 'rejected';
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
        logger.info('Request moved to next step', {
          ...requestContext,
          requestId,
          nextStepId: nextStep.id,
          nextStepOrder: nextStep.stepOrder
        });

        await prisma.request.update({
          where: { id: Number(requestId) },
          data: { currentStepId: nextStep.id }
        });
        nextStatus = 'pending';
      } else {
        // All steps completed - go to admin review
        logger.info('Request completed all steps, waiting for admin', {
          ...requestContext,
          requestId
        });

        await prisma.request.update({
          where: { id: Number(requestId) },
          data: {
            status: "waiting_admin",
            currentStepId: null
          }
        });
        nextStatus = 'waiting_admin';
      }
    }

    // ============================================
    // 7. RETURN SUCCESS RESPONSE
    // ============================================
    const duration = timer.elapsed();
    logger.apiResponse('POST', '/api/approvals/action', 200, duration, {
      ...requestContext,
      requestId,
      action
    });

    return successResponse(
      {
        requestId: request.id,
        action,
        nextStatus
      },
      `Request ${action}ed successfully`
    );

  } catch (error: any) {
    logger.error('Approval action error', error, requestContext);
    return errorResponse(
      error.message || 'Failed to process approval action',
      ApiErrorCode.INTERNAL_ERROR
    );
  }
}
