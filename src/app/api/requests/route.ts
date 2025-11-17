import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { successResponse, errorResponse, ApiErrorCode } from "@/lib/apiResponse";
import { logger, createRequestContext, PerformanceTimer } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const timer = new PerformanceTimer();
  const requestContext = createRequestContext(req);

  try {
    logger.apiRequest('GET', '/api/requests', requestContext);

    // ============================================
    // 1. AUTHENTICATION CHECK (CRITICAL FIX!)
    // ============================================
    const session = await getServerSession(authOptions);
    if (!session) {
      logger.security('unauthorized_access', requestContext);
      return errorResponse(
        "Unauthorized - Please login to access requests",
        ApiErrorCode.UNAUTHORIZED
      );
    }

    requestContext.userId = session.user.id;

    // ============================================
    // 2. PARSE AND VALIDATE QUERY PARAMETERS
    // ============================================
    const status = req.nextUrl.searchParams.get("status");
    const all = req.nextUrl.searchParams.get("all");

    // Validate status parameter
    const validStatuses = ['pending', 'approved', 'rejected', 'waiting_admin', 'completed'];
    if (status && !validStatuses.includes(status)) {
      logger.warn('Invalid status parameter', {
        ...requestContext,
        status
      });
      return errorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // ============================================
    // 3. ROLE-BASED ACCESS CONTROL (RBAC)
    // ============================================
    let where: any = {};

    // Apply status filter if provided
    if (status) {
      where.status = status;
    }

    // Apply role-based filtering
    logger.debug('Applying RBAC filters', {
      ...requestContext,
      role: session.user.role,
      status,
      all
    });

    switch (session.user.role) {
      case 'mahasiswa':
        // Mahasiswa: Can only see their own requests
        where.mahasiswaId = Number(session.user.id);
        break;

      case 'dosen':
        // Dosen: Can see requests where they are assigned as approver
        // Unless 'all' parameter is true (for dashboard stats)
        if (!all) {
          where.approvals = {
            some: {
              approvedBy: Number(session.user.id)
            }
          };
        }
        break;

      case 'akademik':
        // Akademik: Can see all requests (for academic staff)
        // No additional filtering needed
        break;

      case 'admin':
        // Admin: Can see all requests
        // No additional filtering needed
        break;

      default:
        logger.security('unauthorized_access', {
          ...requestContext,
          reason: 'Invalid user role'
        });
        return errorResponse(
          "Invalid user role",
          ApiErrorCode.FORBIDDEN
        );
    }

    // ============================================
    // 4. FETCH REQUESTS WITH APPROPRIATE DATA
    // ============================================
    const queryTimer = new PerformanceTimer();

    const requests = await prisma.request.findMany({
      where,
      include: {
        mahasiswa: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            prodi: true,
            // Don't expose password!
          }
        },
        sidangType: {
          select: {
            id: true,
            name: true
          }
        },
        currentStep: {
          select: {
            id: true,
            role: true,
            stepOrder: true
          }
        },
        approvals: {
          select: {
            id: true,
            action: true,
            notes: true,
            approvedAt: true,
            step: {
              select: {
                role: true,
                stepOrder: true
              }
            },
            approver: {
              select: {
                id: true,
                name: true,
                role: true
                // Don't expose email or password
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        revisiNotes: {
          include: {
            dosen: {
              select: {
                id: true,
                name: true,
                role: true
                // Don't expose email or password
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      // Limit results to prevent performance issues
      take: all ? undefined : 100
    });

    logger.dbQuery('findMany', 'request', queryTimer.elapsed(), {
      ...requestContext,
      count: requests.length,
      filters: { status, role: session.user.role }
    });

    // ============================================
    // 5. RETURN FILTERED RESULTS
    // ============================================
    const duration = timer.elapsed();
    logger.apiResponse('GET', '/api/requests', 200, duration, {
      ...requestContext,
      count: requests.length
    });

    return successResponse({
      requests,
      count: requests.length
    });

  } catch (error: any) {
    logger.error('Get requests error', error, requestContext);
    return errorResponse(
      error.message || 'Failed to fetch requests',
      ApiErrorCode.INTERNAL_ERROR
    );
  }
}

export async function POST(req: NextRequest) {
  const timer = new PerformanceTimer();
  const requestContext = createRequestContext(req);

  try {
    logger.apiRequest('POST', '/api/requests', requestContext);

    // ============================================
    // 1. AUTHENTICATION & AUTHORIZATION
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

    if (session.user.role !== "mahasiswa") {
      logger.security('unauthorized_access', {
        ...requestContext,
        reason: 'Non-mahasiswa attempting to create request',
        role: session.user.role
      });
      return errorResponse(
        "Forbidden - Only mahasiswa can create requests",
        ApiErrorCode.FORBIDDEN
      );
    }

    // ============================================
    // 2. VALIDATE INPUT
    // ============================================
    const { sidangTypeId } = await req.json();

    if (!sidangTypeId) {
      logger.warn('Missing sidangTypeId in request creation', requestContext);
      return errorResponse(
        "Missing required field: sidangTypeId",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // Verify sidang type exists
    const sidangType = await prisma.sidangType.findUnique({
      where: { id: Number(sidangTypeId) }
    });

    if (!sidangType) {
      logger.warn('Invalid sidang type', {
        ...requestContext,
        sidangTypeId
      });
      return errorResponse(
        "Invalid sidang type",
        ApiErrorCode.NOT_FOUND
      );
    }

    // ============================================
    // 3. GET FIRST WORKFLOW STEP
    // ============================================
    const firstStep = await prisma.workflowStep.findFirst({
      where: { sidangTypeId: Number(sidangTypeId) },
      orderBy: { stepOrder: "asc" }
    });

    if (!firstStep) {
      logger.warn('Workflow not configured', {
        ...requestContext,
        sidangTypeId
      });
      return errorResponse(
        "Workflow not configured for this sidang type",
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    // ============================================
    // 4. CREATE REQUEST
    // ============================================
    logger.dbQuery('create', 'request', 0, {
      ...requestContext,
      sidangTypeId
    });

    const request = await prisma.request.create({
      data: {
        mahasiswaId: Number(session.user.id),
        sidangTypeId: Number(sidangTypeId),
        currentStepId: firstStep.id,
        status: "pending"
      },
      include: {
        sidangType: true,
        currentStep: true
      }
    });

    // ============================================
    // 5. CREATE INITIAL APPROVAL RECORD
    // ============================================
    // Find the approver for first step (simplified - should be assigned by admin)
    // For now, we'll create a pending approval without specific approver
    await prisma.approval.create({
      data: {
        requestId: request.id,
        stepId: firstStep.id,
        approvedBy: 0, // Placeholder - should be assigned by admin
        action: 'pending'
      }
    });

    logger.info('Request created successfully', {
      ...requestContext,
      requestId: request.id,
      sidangTypeId
    });

    // ============================================
    // 6. RETURN SUCCESS RESPONSE
    // ============================================
    const duration = timer.elapsed();
    logger.apiResponse('POST', '/api/requests', 201, duration, {
      ...requestContext,
      requestId: request.id
    });

    return successResponse(
      request,
      "Request created successfully",
      201
    );

  } catch (error: any) {
    logger.error('Create request error', error, requestContext);
    return errorResponse(
      error.message || 'Failed to create request',
      ApiErrorCode.INTERNAL_ERROR
    );
  }
}
