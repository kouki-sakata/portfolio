import { Suspense } from "react";

import { HomePage } from "@/features/home/components/HomePage";
import { PageLoader } from "@/shared/components/layout/PageLoader";

export const HomeRoute = () => (
  <Suspense fallback={<PageLoader />}>
    <HomePage />
  </Suspense>
);
