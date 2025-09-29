import { Navigate } from "react-router-dom";

import { SignInPage } from "@/features/auth/components/SignInPage";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const SignInRoute = () => {
  const { authenticated } = useAuth();

  if (authenticated) {
    return <Navigate replace to="/" />;
  }

  return <SignInPage />;
};
