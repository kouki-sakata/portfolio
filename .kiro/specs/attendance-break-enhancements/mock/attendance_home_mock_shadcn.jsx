"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Moon, Sun, Coffee, Clock } from "lucide-react";

export default function AttendanceHomeMock() {
  const [isBreak, setIsBreak] = useState(false);
  const [isNight, setIsNight] = useState(false);

  const status = isBreak ? "休憩中" : "勤務中";
  const [lastAction, setLastAction] = useState("");

  const handleBreakToggle = (state: boolean) => {
    setIsBreak(state);
    setLastAction(state ? "休憩開始を登録しました" : "休憩終了を登録しました");
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
                <Badge
                  className={cn(
                    "text-xs rounded-full px-3 py-1 shadow-sm",
                    isBreak
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-emerald-500 text-white"
                  )}
                >
                  {isBreak ? "休憩中" : "勤務中"}
                </Badge>
                ワンクリック打刻
              </CardTitle>
              <Button
                variant={isNight ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNight((p) => !p)}
                className="gap-1 text-xs"
              >
                <Moon className="h-4 w-4" /> 夜勤扱い
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 時刻表示 */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="flex items-center gap-2 text-4xl font-bold tracking-tight text-primary drop-shadow-sm">
                  <Clock className="h-9 w-9 text-primary/70" />21:35:04
                </div>
                <p className="text-xs text-muted-foreground">2025年11月06日(木)</p>
              </div>

              {/* 出勤・退勤ボタン */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="w-full py-5 text-base font-semibold shadow-sm hover:shadow-md"
                  variant="default"
                  onClick={() => handleClock("出勤打刻")}
                >
                  出勤打刻
                </Button>
                <Button
                  className="w-full py-5 text-base font-semibold shadow-sm hover:shadow-md"
                  variant="outline"
                  onClick={() => handleClock("退勤打刻")}
                >
                  退勤打刻
                </Button>
              </div>

              {/* 休憩操作（トグル式） */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">休憩の操作</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isBreak ? "default" : "outline"}
                    disabled={isBreak}
                    onClick={() => handleBreakToggle(true)}
                    className="flex-1 gap-1 rounded-full shadow-sm hover:shadow-md"
                  >
                    <Coffee className="h-4 w-4" /> 休憩開始
                  </Button>
                  <Button
                    type="button"
                    variant={isBreak ? "default" : "outline"}
                    disabled={!isBreak}
                    onClick={() => handleBreakToggle(false)}
                    className="flex-1 gap-1 rounded-full shadow-sm hover:shadow-md"
                  >
                    <Sun className="h-4 w-4" /> 休憩終了
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 操作ログ */}
              {lastAction && (
                <p className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1">
                  ✅ 最新の操作：{lastAction}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 右：最新のお知らせ */}
          <Card className="mt-4 md:mt-0 rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
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
