"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push(user?.role === "CLIENT" ? "/portal/login" : "/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {title ? (
        <span className="font-semibold text-gray-900">{title}</span>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
