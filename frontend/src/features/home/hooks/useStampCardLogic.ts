import { useCallback, useEffect, useState } from "react";
import { ATTENDANCE_STATUS_META } from "@/features/home/components/AttendanceSnapshotCard";
import {
  StampValidationError,
  validateAttendanceStamp,
  validateBreakToggle,
  validateDepartureStamp,
} from "@/features/home/lib/stampValidation";
import type { StampCardProps } from "@/features/home/types";
import { toast } from "@/hooks/use-toast";

type UseStampCardLogicParams = Pick<
  StampCardProps,
  "snapshot" | "onCaptureTimestamp" | "onStamp" | "onToggleBreak"
>;

export const useStampCardLogic = ({
  snapshot,
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

  // イベントハンドラー
  const handleStamp = useCallback(
    async (type: "1" | "2") => {
      // クライアント側バリデーション
      try {
        if (type === "1") {
          validateAttendanceStamp(snapshot);
        } else {
          validateDepartureStamp(snapshot);
        }
      } catch (error) {
        if (error instanceof StampValidationError) {
          toast({
            variant: "destructive",
            title: "操作エラー",
            description: error.message,
          });
          return; // バリデーションエラー時は処理を中断
        }
        throw error; // 予期しないエラーは再スロー
      }

      const iso = onCaptureTimestamp();
      await onStamp(type, nightWork, iso);
      const actionType = type === "1" ? "出勤打刻" : "退勤打刻";
      setLastAction(`${actionType}を登録しました`);
    },
    [snapshot, onCaptureTimestamp, onStamp, nightWork]
  );

  const handleBreakToggle = useCallback(async () => {
    if (!onToggleBreak) {
      return;
    }

    // クライアント側バリデーション
    try {
      validateBreakToggle(snapshot);
    } catch (error) {
      if (error instanceof StampValidationError) {
        toast({
          variant: "destructive",
          title: "操作エラー",
          description: error.message,
        });
        return; // バリデーションエラー時は処理を中断
      }
      throw error; // 予期しないエラーは再スロー
    }

    await onToggleBreak();
    const action = isBreak ? "休憩終了" : "休憩開始";
    setLastAction(`${action}を登録しました`);
  }, [onToggleBreak, snapshot, isBreak]);

  const toggleNightWork = () => setNightWork((prev) => !prev);

  return {
    nightWork,
    lastAction,
    isBreak,
    statusMeta,
    handleStamp,
    handleBreakToggle,
    toggleNightWork,
  };
};
