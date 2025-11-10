import type { ReactNode } from "react";

/**
 * 時刻の表示フォーマット
 * null または空文字列の場合は "-" を返す
 */
export const renderOptionalTime = (value: string | null): ReactNode =>
  value && value.trim().length > 0 ? value : "-";

/**
 * 休憩時刻の表示フォーマット
 * null または空文字列の場合は "-" を返す
 */
export const renderBreakTimeCell = (value: string | null): ReactNode =>
  value && value.trim().length > 0 ? value : "-";

/**
 * 残業時間の表示フォーマット
 * null の場合は "-"、0以下の場合は "0分"、それ以外は "N分" を返す
 */
export const renderOvertimeCell = (value: number | null): ReactNode => {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalized = Number.isFinite(value) ? value : 0;
  if (normalized <= 0) {
    return "0分";
  }

  return `${normalized}分`;
};

/**
 * 曜日に応じた色クラスを返す
 * 土曜日: 青、日曜日: 赤、それ以外: デフォルト
 */
export const getDayOfWeekColor = (dayOfWeek: string | null): string => {
  if (dayOfWeek === "土") return "text-blue-600";
  if (dayOfWeek === "日") return "text-red-600";
  return "text-foreground";
};

/**
 * 残業時間に応じたバッジのバリアントを返す
 * 残業あり: destructive、なし: secondary
 */
export const getOvertimeBadgeVariant = (
  minutes: number | null
): "secondary" | "destructive" => {
  if (!minutes || minutes <= 0) return "secondary";
  return "destructive";
};
