import { useCallback, useMemo } from "react";

/**
 * 日付フォーマットのオプション
 */
export type DateFormatOptions = {
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "numeric" | "2-digit";
  hour12?: boolean;
};

/**
 * デフォルトの日時フォーマットオプション (日本語)
 */
const DEFAULT_DATETIME_OPTIONS: DateFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * デフォルトの日付フォーマットオプション (日本語)
 */
const DEFAULT_DATE_OPTIONS: DateFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/**
 * メモ化された日付フォーマッターフック
 *
 * 日付のフォーマット処理を最適化します。
 * Intl.DateTimeFormatインスタンスをメモ化し、フォーマット関数もuseCallbackで最適化します。
 *
 * @param locale - ロケール文字列 (デフォルト: "ja-JP")
 * @param options - Intl.DateTimeFormatのオプション
 * @returns メモ化された日付フォーマット関数
 *
 * @example
 * ```tsx
 * const formatDateTime = useMemoizedDateFormatter("ja-JP", {
 *   year: "numeric",
 *   month: "2-digit",
 *   day: "2-digit",
 *   hour: "2-digit",
 *   minute: "2-digit",
 * });
 *
 * // コンポーネント内で使用
 * <div>{formatDateTime(new Date())}</div>
 * ```
 */
export function useMemoizedDateFormatter(
  locale = "ja-JP",
  options: DateFormatOptions = DEFAULT_DATETIME_OPTIONS
): (date: Date | string | number) => string {
  // Intl.DateTimeFormatインスタンスをメモ化
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, options),
    [locale, options]
  );

  // フォーマット関数をメモ化
  return useCallback(
    (date: Date | string | number) => {
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(dateObj.getTime())) {
          return "Invalid Date";
        }
        return formatter.format(dateObj);
      } catch (_error) {
        return "Invalid Date";
      }
    },
    [formatter]
  );
}

/**
 * 日時フォーマット用の便利フック (YYYY/MM/DD HH:mm 形式)
 *
 * @param locale - ロケール文字列 (デフォルト: "ja-JP")
 * @returns 日時フォーマット関数
 *
 * @example
 * ```tsx
 * const formatDateTime = useDateTimeFormatter();
 * <div>{formatDateTime("2024-01-01T12:30:00")}</div>
 * // 出力: 2024/01/01 12:30
 * ```
 */
export function useDateTimeFormatter(locale = "ja-JP") {
  return useMemoizedDateFormatter(locale, DEFAULT_DATETIME_OPTIONS);
}

/**
 * 日付フォーマット用の便利フック (YYYY/MM/DD 形式)
 *
 * @param locale - ロケール文字列 (デフォルト: "ja-JP")
 * @returns 日付フォーマット関数
 *
 * @example
 * ```tsx
 * const formatDate = useDateFormatter();
 * <div>{formatDate("2024-01-01")}</div>
 * // 出力: 2024/01/01
 * ```
 */
export function useDateFormatter(locale = "ja-JP") {
  return useMemoizedDateFormatter(locale, DEFAULT_DATE_OPTIONS);
}

/**
 * 複数の日付フォーマット関数をまとめて返すフック
 *
 * @param locale - ロケール文字列 (デフォルト: "ja-JP")
 * @returns 日付・日時フォーマット関数のオブジェクト
 *
 * @example
 * ```tsx
 * const { formatDate, formatDateTime } = useDateFormatters();
 * <div>
 *   <p>{formatDate("2024-01-01")}</p>
 *   <p>{formatDateTime("2024-01-01T12:30:00")}</p>
 * </div>
 * ```
 */
export function useDateFormatters(locale = "ja-JP") {
  const formatDate = useDateFormatter(locale);
  const formatDateTime = useDateTimeFormatter(locale);

  return useMemo(
    () => ({
      formatDate,
      formatDateTime,
    }),
    [formatDate, formatDateTime]
  );
}
