import { HomePageRefactored as HomePage } from "@/features/home/components/HomePageRefactored";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const HomeRoute = () => (
  <PageSuspenseWrapper>
    <HomePage />
  </PageSuspenseWrapper>
);
