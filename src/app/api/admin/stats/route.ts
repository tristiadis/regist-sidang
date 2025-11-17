import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  // 1. AUTHENTICATION CHECK
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({
      error: "Unauthorized - Please login to access admin statistics"
    }, { status: 401 });
  }

  // 2. AUTHORIZATION CHECK - Only admin and akademik can view stats
  if (session.user.role !== 'admin' && session.user.role !== 'akademik') {
    return NextResponse.json({
      error: "Forbidden - Only admin and akademik can view statistics"
    }, { status: 403 });
  }

  // 3. FETCH STATISTICS
  const total = await prisma.request.count();
  const pending = await prisma.request.count({ where: { status: "pending" } });
  const approved = await prisma.request.count({ where: { status: "approved" } });
  const rejected = await prisma.request.count({ where: { status: "rejected" } });
  const waiting_admin = await prisma.request.count({ where: { status: "waiting_admin" } });

  return NextResponse.json({
    success: true,
    data: {
      total,
      pending,
      approved,
      rejected,
      waiting_admin
    }
  });
}
