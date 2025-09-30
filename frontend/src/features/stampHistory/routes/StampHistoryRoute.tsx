import { StampHistoryPage } from "@/features/stampHistory/components/StampHistoryPage";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const StampHistoryRoute = () => (
  <PageSuspenseWrapper>
    <StampHistoryPage />
  </PageSuspenseWrapper>
);
