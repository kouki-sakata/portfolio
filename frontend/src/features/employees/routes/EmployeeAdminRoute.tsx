import { lazy } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

// Lazy load EmployeeListPage for code splitting
const EmployeeListPage = lazy(() =>
  import("@/features/employees/components/EmployeeListPage").then((module) => ({
    default: module.EmployeeListPage,
  }))
);

export const EmployeeAdminRoute = () => {
  const { user } = useAuth();

  if (!user?.admin) {
    return <Navigate replace to="/" />;
  }

  return (
    <PageSuspenseWrapper>
      <EmployeeListPage />
    </PageSuspenseWrapper>
  );
};
