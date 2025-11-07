import type { EmployeeSummary } from "@/features/auth/types";
import type { HomeClockState } from "@/features/home/hooks/useHomeClock";
import type { StampStatus } from "@/features/home/hooks/useStamp";
import type { NewsResponse } from "@/types";

export type AttendanceStatus =
  | "NOT_ATTENDED"
  | "WORKING"
  | "ON_BREAK"
  | "FINISHED";

export type DailyAttendanceSnapshot = {
  status: AttendanceStatus;
  attendanceTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  departureTime: string | null;
  overtimeMinutes: number;
};

export type HomeNewsItem = Pick<
  NewsResponse,
  | "id"
  | "title"
  | "content"
  | "label"
  | "newsDate"
  | "releaseFlag"
  | "updateDate"
>;

export type HomeDashboardResponse = {
  employee: EmployeeSummary;
  news: HomeNewsItem[];
  attendance: DailyAttendanceSnapshot | null;
};

export type StampRequest = {
  stampType: "1" | "2";
  stampTime: string;
  nightWorkFlag: "0" | "1";
};

export type StampResponse = {
  message: string;
  success?: boolean;
};

/**
 * StampCardコンポーネントのProps定義
 * 改善版: snapshot, onToggleBreak, isToggling を追加
 */
export type StampCardProps = {
  /** 打刻処理のコールバック */
  onStamp: (type: "1" | "2", nightWork: boolean, iso?: string) => Promise<void>;
  /** タイムスタンプをキャプチャする関数 */
  onCaptureTimestamp: () => string;
  /** 時計の状態 */
  clockState: Pick<HomeClockState, "status" | "isoNow" | "displayText">;
  /** 打刻ステータス */
  status: StampStatus | null;
  /** 勤務スナップショット（改善版で追加） */
  snapshot: DailyAttendanceSnapshot | null;
  /** 休憩トグルのコールバック（改善版で追加） */
  onToggleBreak?: () => Promise<void>;
  /** 休憩トグル中のローディング状態（改善版で追加） */
  isToggling?: boolean;
  /** ローディング中フラグ */
  isLoading?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** スケルトン表示フラグ */
  showSkeleton?: boolean;
};
