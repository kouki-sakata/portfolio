import { AttendancePage } from "@/features/attendance/components/AttendancePage";
import { PageSuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";

export const AttendanceRoute = () => (
  <PageSuspenseWrapper>
    <AttendancePage />
  </PageSuspenseWrapper>
);
