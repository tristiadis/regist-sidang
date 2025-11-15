'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    } else if (!allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized");
    }
  }, [session, status, router, allowedRoles]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-purple-600"></span>
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
