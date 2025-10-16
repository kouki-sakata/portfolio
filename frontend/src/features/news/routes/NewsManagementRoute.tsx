import { lazy } from "react";
import { useLoaderData } from "react-router-dom";

import type { SessionResponse } from "@/features/auth/types";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

const NewsManagementPage = lazy(() =>
  import("@/features/news/components/NewsManagementPage").then((module) => ({
    default: module.NewsManagementPage,
  }))
);

export const NewsManagementRoute = () => {
  useLoaderData<SessionResponse>();

  return (
    <PageSuspenseWrapper>
      <NewsManagementPage />
    </PageSuspenseWrapper>
  );
};
