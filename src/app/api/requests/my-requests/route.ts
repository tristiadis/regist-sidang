import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "mahasiswa") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    where: {
      mahasiswaId: Number(session.user.id),
      deletedAt: null
    },
    include: {
      sidangType: true,
      currentStep: true,
      approvals: {
        include: {
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
          createdAt: 'asc'
        }
      },
      revisiNotes: {
        include: {
          dosen: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      fulfillments: {
        include: {
          requirement: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return NextResponse.json(requests);
}
