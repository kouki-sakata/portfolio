import { lazy } from "react";
import { useLoaderData } from "react-router-dom";

import type { SessionResponse } from "@/features/auth/types";
import { AdminGuard } from "@/shared/components/guards/AdminGuard";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

const NewsManagementPage = lazy(() =>
  import("@/features/news/components/NewsManagementPage").then((module) => ({
    default: module.NewsManagementPage,
  }))
);

export const NewsManagementRoute = () => {
  useLoaderData<SessionResponse>();

  return (
    <AdminGuard>
      <PageSuspenseWrapper>
        <NewsManagementPage />
      </PageSuspenseWrapper>
    </AdminGuard>
  );
};
