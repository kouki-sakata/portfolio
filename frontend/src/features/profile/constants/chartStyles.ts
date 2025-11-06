/**
 * Rechartsチャートの共通スタイル定数
 * ProfileSummaryCardとProfileMonthlyDetailCardで使用
 */

/**
 * チャートグリッドの設定
 * - より視認性の高いグレー (Slate 300: #cbd5e1)
 * - バランスの良い点線パターン (5px線、5px空白)
 * - 適度な透明度 (60%)
 */
export const CHART_GRID_CONFIG = {
  stroke: "#cbd5e1", // Slate 300
  strokeDasharray: "5 5",
  strokeOpacity: 0.6,
} as const;

/**
 * チャート軸の設定
 */
export const CHART_AXIS_CONFIG = {
  stroke: "hsl(var(--border))",
  tick: {
    fill: "hsl(var(--muted-foreground))",
    fontSize: 12,
  },
} as const;

/**
 * ツールチップのスタイル設定
 */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
  },
  labelStyle: { color: "hsl(var(--foreground))" },
} as const;
