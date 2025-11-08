import { useEffect, useState } from "react";
import { ATTENDANCE_STATUS_META } from "@/features/home/components/AttendanceSnapshotCard";
import type { StampCardProps } from "@/features/home/types";

type UseStampCardLogicParams = Pick<
  StampCardProps,
  "snapshot" | "clockState" | "onCaptureTimestamp" | "onStamp" | "onToggleBreak"
>;

export const useStampCardLogic = ({
  snapshot,
  clockState,
  onCaptureTimestamp,
  onStamp,
  onToggleBreak,
}: UseStampCardLogicParams) => {
  const [nightWork, setNightWork] = useState(false);
  const [lastAction, setLastAction] = useState("");

  // 操作ログの5秒自動消去
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // 派生状態の計算
  const isBreak = snapshot?.status === "ON_BREAK";
  const statusMeta = snapshot
    ? ATTENDANCE_STATUS_META[snapshot.status]
    : undefined;
  const isClockError = clockState.status === "error";

  // イベントハンドラー
  const handleStamp = async (type: "1" | "2") => {
    const iso = onCaptureTimestamp();
    await onStamp(type, nightWork, iso);
    const actionType = type === "1" ? "出勤打刻" : "退勤打刻";
    setLastAction(`${actionType}を登録しました`);
  };

  const handleBreakToggle = async () => {
    if (!onToggleBreak) {
      return;
    }
    await onToggleBreak();
    const action = isBreak ? "休憩終了" : "休憩開始";
    setLastAction(`${action}を登録しました`);
  };

  const toggleNightWork = () => setNightWork((prev) => !prev);

  return {
    nightWork,
    lastAction,
    isBreak,
    statusMeta,
    isClockError,
    handleStamp,
    handleBreakToggle,
    toggleNightWork,
  };
};
