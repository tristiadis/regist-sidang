import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const total = await prisma.request.count();
  const pending = await prisma.request.count({ where: { status: "pending" } });
  const approved = await prisma.request.count({ where: { status: "approved" } });
  const rejected = await prisma.request.count({ where: { status: "rejected" } });
  const waiting_admin = await prisma.request.count({ where: { status: "waiting_admin" } });

  return NextResponse.json({ total, pending, approved, rejected, waiting_admin });
}
