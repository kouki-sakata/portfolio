import { AttendancePage } from "@/features/home/components/AttendancePage";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const AttendanceRoute = () => (
  <PageSuspenseWrapper>
    <AttendancePage />
  </PageSuspenseWrapper>
);
