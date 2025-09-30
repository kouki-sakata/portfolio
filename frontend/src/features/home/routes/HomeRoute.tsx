import { HomePage } from "@/features/home/components/HomePage";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const HomeRoute = () => (
  <PageSuspenseWrapper>
    <HomePage />
  </PageSuspenseWrapper>
);
