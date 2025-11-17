import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================
// GET - Retrieve a single request by ID
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to access requests"
    }, { status: 401 });
  }

  // 2. VALIDATE REQUEST ID
  const requestId = Number(params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return NextResponse.json({
      error: "Invalid request ID"
    }, { status: 400 });
  }

  // 3. FETCH REQUEST WITH DETAILS
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      mahasiswa: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          prodi: true
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
        include: {
          step: true,
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      requirementFulfillments: {
        include: {
          requirement: true
        }
      },
      sidang: {
        include: {
          revisiNotes: {
            include: {
              dosen: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!request) {
    return NextResponse.json({
      error: "Request not found"
    }, { status: 404 });
  }

  // 4. AUTHORIZATION CHECK
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  // Mahasiswa can only view their own requests
  if (userRole === 'mahasiswa' && request.mahasiswaId !== userId) {
    return NextResponse.json({
      error: "You do not have permission to view this request"
    }, { status: 403 });
  }

  // Dosen can only view requests where they are assigned as approver
  if (userRole === 'dosen') {
    const isAssigned = request.approvals.some(
      approval => approval.approvedBy === userId
    );
    if (!isAssigned) {
      return NextResponse.json({
        error: "You do not have permission to view this request"
      }, { status: 403 });
    }
  }

  // Akademik and admin can view all requests

  return NextResponse.json({
    success: true,
    data: request
  });
}

// ============================================
// PATCH - Update request status (admin only)
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to continue"
    }, { status: 401 });
  }

  // 2. AUTHORIZATION CHECK - Only admin and akademik can update status
  if (session.user.role !== 'admin' && session.user.role !== 'akademik') {
    return NextResponse.json({
      error: "Forbidden - Only admin and akademik can update request status"
    }, { status: 403 });
  }

  // 3. VALIDATE REQUEST ID
  const requestId = Number(params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return NextResponse.json({
      error: "Invalid request ID"
    }, { status: 400 });
  }

  // 4. PARSE AND VALIDATE INPUT
  const { status } = await req.json();

  const validStatuses = ['pending', 'approved', 'rejected', 'waiting_admin', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    }, { status: 400 });
  }

  // 5. FETCH EXISTING REQUEST
  const existingRequest = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      currentStep: true,
      mahasiswa: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!existingRequest) {
    return NextResponse.json({
      error: "Request not found"
    }, { status: 404 });
  }

  // 6. VALIDATE STATE TRANSITION
  // Admin/akademik typically updates status after all approvals are done
  // Common transitions:
  // - waiting_admin -> approved (admin approves final sidang scheduling)
  // - waiting_admin -> rejected (admin rejects for some reason)
  // - approved -> completed (after sidang is done)

  const currentStatus = existingRequest.status;

  // Prevent invalid state transitions
  if (currentStatus === 'completed' && status !== 'completed') {
    return NextResponse.json({
      error: "Cannot change status of a completed request"
    }, { status: 400 });
  }

  if (currentStatus === 'rejected' && status !== 'rejected') {
    return NextResponse.json({
      error: "Cannot change status of a rejected request"
    }, { status: 400 });
  }

  // 7. UPDATE REQUEST STATUS
  const updatedRequest = await prisma.request.update({
    where: { id: requestId },
    data: { status },
    include: {
      mahasiswa: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          prodi: true
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
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: `Request status updated to ${status}`,
    data: updatedRequest
  });
}
