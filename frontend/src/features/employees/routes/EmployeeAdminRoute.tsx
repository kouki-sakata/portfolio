import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { EmployeeListPage } from "@/features/employees/components/EmployeeListPage";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

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
