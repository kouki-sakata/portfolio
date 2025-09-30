import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { EmployeeListPage } from "@/features/employees/components/EmployeeListPage";

export const EmployeeAdminRoute = () => {
  const { user } = useAuth();

  if (!user?.admin) {
    return <Navigate replace to="/" />;
  }

  return <EmployeeListPage />;
};
