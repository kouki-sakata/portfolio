import { lazy } from "react";
import { useLoaderData } from "react-router-dom";

import type { SessionResponse } from "@/features/auth/types";
import { AdminGuard } from "@/shared/components/guards/AdminGuard";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

const PendingRequestsAdminPage = lazy(() =>
  import("@/features/stampRequestWorkflow/components/PendingRequestsAdminPage").then(
    (module) => ({
      default: module.PendingRequestsAdminPage,
    })
  )
);

export const PendingRequestsRoute = () => {
  useLoaderData<SessionResponse>();

  return (
    <AdminGuard>
      <PageSuspenseWrapper>
        <PendingRequestsAdminPage />
      </PageSuspenseWrapper>
    </AdminGuard>
  );
};
