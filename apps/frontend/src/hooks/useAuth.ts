"use client";

import { useContext } from "react";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
