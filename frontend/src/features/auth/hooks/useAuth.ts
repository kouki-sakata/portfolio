import { useContext } from "react";

import { AuthContext } from "@/features/auth/context/internal/AuthContext";
import type { EnhancedAuthContextValue } from "@/features/auth/types/auth-context.types";

export const useAuth = (): EnhancedAuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
