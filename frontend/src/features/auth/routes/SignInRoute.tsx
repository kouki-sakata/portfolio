import { Navigate } from "react-router-dom";

import { SignInPage } from "@/features/auth/components/SignInPage";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const SignInRoute = () => {
  const { authenticated } = useAuth();

  if (authenticated) {
    return <Navigate replace to="/" />;
  }

  return (
    <PageSuspenseWrapper>
      <SignInPage />
    </PageSuspenseWrapper>
  );
};
