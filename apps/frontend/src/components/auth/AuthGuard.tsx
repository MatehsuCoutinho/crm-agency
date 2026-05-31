"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo: string;
}

export function AuthGuard({ children, allowedRoles, redirectTo }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
