import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const role = req.nextUrl.searchParams.get("role");

  const requests = await prisma.request.findMany({
    where: {
      status: "pending",
      currentStep: {
        role: role as string
      }
    },
    include: {
      mahasiswa: true,
      sidangType: true,
      currentStep: true,
      fulfillments: {
        include: { requirement: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(requests);
}
