import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // ============================================
  // 1. AUTHENTICATION CHECK (CRITICAL FIX!)
  // ============================================
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to access requests"
    }, { status: 401 });
  }

  // ============================================
  // 2. PARSE AND VALIDATE QUERY PARAMETERS
  // ============================================
  const status = req.nextUrl.searchParams.get("status");
  const all = req.nextUrl.searchParams.get("all");

  // Validate status parameter
  const validStatuses = ['pending', 'approved', 'rejected', 'waiting_admin', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    }, { status: 400 });
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
      return NextResponse.json({
        error: "Invalid user role"
      }, { status: 403 });
  }

  // ============================================
  // 4. FETCH REQUESTS WITH APPROPRIATE DATA
  // ============================================
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

  // ============================================
  // 5. RETURN FILTERED RESULTS
  // ============================================
  return NextResponse.json({
    success: true,
    count: requests.length,
    data: requests
  });
}

export async function POST(req: NextRequest) {
  // ============================================
  // 1. AUTHENTICATION & AUTHORIZATION
  // ============================================
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to continue"
    }, { status: 401 });
  }

  if (session.user.role !== "mahasiswa") {
    return NextResponse.json({
      error: "Forbidden - Only mahasiswa can create requests"
    }, { status: 403 });
  }

  // ============================================
  // 2. VALIDATE INPUT
  // ============================================
  const { sidangTypeId } = await req.json();

  if (!sidangTypeId) {
    return NextResponse.json({
      error: "Missing required field: sidangTypeId"
    }, { status: 400 });
  }

  // Verify sidang type exists
  const sidangType = await prisma.sidangType.findUnique({
    where: { id: Number(sidangTypeId) }
  });

  if (!sidangType) {
    return NextResponse.json({
      error: "Invalid sidang type"
    }, { status: 404 });
  }

  // ============================================
  // 3. GET FIRST WORKFLOW STEP
  // ============================================
  const firstStep = await prisma.workflowStep.findFirst({
    where: { sidangTypeId: Number(sidangTypeId) },
    orderBy: { stepOrder: "asc" }
  });

  if (!firstStep) {
    return NextResponse.json({
      error: "Workflow not configured for this sidang type"
    }, { status: 400 });
  }

  // ============================================
  // 4. CREATE REQUEST
  // ============================================
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

  // ============================================
  // 6. RETURN SUCCESS RESPONSE
  // ============================================
  return NextResponse.json({
    success: true,
    message: "Request created successfully",
    data: request
  });
}
