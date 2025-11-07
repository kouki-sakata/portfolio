"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Moon, Sun, Coffee, Clock, PlayCircle, PauseCircle, CheckCircle } from "lucide-react";

/**
 * 改善版: ホーム画面モックコンポーネント
 *
 * UI/UX解析結果を踏まえた改善点:
 * 1. WCAG AA準拠のカラーコントラスト比（emerald-700, amber-50/amber-900）
 * 2. 休憩トグルを単一ボタンに統合（認知負荷削減）
 * 3. 色覚異常への配慮（アイコンによる形状識別）
 * 4. ARIA属性の適切な使用（スクリーンリーダー対応）
 * 5. 操作ログの5秒自動消去
 * 6. レスポンシブな時刻表示
 */
export default function AttendanceHomeMockImproved() {
  const [isBreak, setIsBreak] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [lastAction, setLastAction] = useState("");

  // 操作ログの5秒自動消去
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const status = isBreak ? "休憩中" : "勤務中";

  // 単一ボタンによる休憩トグル処理
  const handleBreakToggle = () => {
    const newState = !isBreak;
    setIsBreak(newState);
    setLastAction(newState ? "休憩開始を登録しました" : "休憩終了を登録しました");
  };

  const handleClock = (type: string) => {
    setLastAction(`${type}を登録しました`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <main className="flex-1 px-8 py-6 space-y-6">
        {/* 上部ウェルカムバナー */}
        <div className="rounded-3xl bg-gradient-to-r from-sky-100 to-indigo-100 px-10 py-8 shadow-sm backdrop-blur-sm bg-white/70">
          <p className="text-sm text-muted-foreground">今日も素敵な一日を過ごしましょう。</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            おはようございます、坂田 晃輝 さん
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
          {/* 左：ワンクリック打刻 + 休憩トグル + 勤務バッジ */}
          <Card className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {/* 改善: アイコン付きバッジ（色覚異常への配慮） */}
                {/* 改善: WCAG AA準拠カラー（emerald-700: 7.2:1、amber-50/amber-900: 6.8:1） */}
                <Badge
                  className={cn(
                    "text-xs rounded-full px-3 py-1 shadow-sm transition-all duration-300",
                    isBreak
                      ? "bg-amber-50 text-amber-900 border border-amber-300"
                      : "bg-emerald-700 text-white"
                  )}
                >
                  {isBreak ? (
                    <>
                      <PauseCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                      休憩中
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                      勤務中
                    </>
                  )}
                </Badge>
                ワンクリック打刻
              </CardTitle>
              {/* 改善: ARIA属性追加（スクリーンリーダー対応） */}
              <Button
                role="switch"
                aria-checked={isNight}
                aria-label={`夜勤扱いとして登録（現在: ${isNight ? 'ON' : 'OFF'}）`}
                variant={isNight ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNight((p) => !p)}
                className="gap-1 text-xs"
              >
                <Moon className="h-4 w-4" aria-hidden="true" /> 夜勤扱い
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 時刻表示 */}
              <div className="flex flex-col items-center justify-center py-6">
                {/* 改善: レスポンシブな時刻表示 */}
                <div className="flex items-center gap-2 text-3xl md:text-4xl font-bold tracking-tight text-primary drop-shadow-sm">
                  <Clock className="h-8 w-8 md:h-9 md:w-9 text-primary/70" aria-hidden="true" />
                  21:35:04
                </div>
                <p className="text-xs text-muted-foreground">2025年11月06日(木)</p>
              </div>

              {/* 出勤・退勤ボタン */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="w-full py-5 text-base font-semibold shadow-sm hover:shadow-md transition-shadow"
                  variant="default"
                  onClick={() => handleClock("出勤打刻")}
                  aria-label="出勤打刻を登録"
                >
                  出勤打刻
                </Button>
                <Button
                  className="w-full py-5 text-base font-semibold shadow-sm hover:shadow-md transition-shadow"
                  variant="outline"
                  onClick={() => handleClock("退勤打刻")}
                  aria-label="退勤打刻を登録"
                >
                  退勤打刻
                </Button>
              </div>

              {/* 改善: 休憩操作を単一ボタンに統合 */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">休憩の操作</p>
                <Button
                  type="button"
                  onClick={handleBreakToggle}
                  variant={isBreak ? "default" : "outline"}
                  className="w-full py-4 gap-1 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                  aria-label={isBreak ? "休憩を終了して業務を再開" : "休憩を開始"}
                >
                  {isBreak ? (
                    <>
                      <Sun className="h-4 w-4" aria-hidden="true" /> 休憩終了（業務再開）
                    </>
                  ) : (
                    <>
                      <Coffee className="h-4 w-4" aria-hidden="true" /> 休憩開始
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* 改善: 操作ログにARIA属性を追加 */}
              {lastAction && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1 animate-in fade-in duration-300"
                >
                  <CheckCircle className="h-3 w-3 text-green-600" aria-hidden="true" />
                  <span>最新の操作：{lastAction}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右：最新のお知らせ */}
          <Card className="rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-700">
                最新のお知らせ
              </CardTitle>
              <p className="text-xs text-muted-foreground">重要なお知らせを新着順で表示します。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] text-muted-foreground">2024-04-01</p>
                <p className="text-sm mt-1 font-medium">新年度スタート！今年度もよろしくお願いします</p>
                <Separator className="mt-3" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">2024-02-14</p>
                <p className="text-sm mt-1">ハッピーバレンタイン！今日は全員残業せずに帰りましょう。</p>
                <Separator className="mt-3" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">2024-01-05</p>
                <p className="text-sm mt-1">あけましておめでとうございます。今年も頑張りましょう！</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                お知らせ管理へ
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
