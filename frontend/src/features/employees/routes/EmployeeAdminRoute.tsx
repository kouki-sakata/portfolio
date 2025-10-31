import { lazy } from "react";
import { AdminGuard } from "@/shared/components/guards/AdminGuard";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

// Lazy load EmployeeListPage for code splitting
const EmployeeListPage = lazy(() =>
  import("@/features/employees/components/EmployeeListPage").then((module) => ({
    default: module.EmployeeListPage,
  }))
);

export const EmployeeAdminRoute = () => (
  <AdminGuard>
    <PageSuspenseWrapper>
      <EmployeeListPage />
    </PageSuspenseWrapper>
  </AdminGuard>
);
