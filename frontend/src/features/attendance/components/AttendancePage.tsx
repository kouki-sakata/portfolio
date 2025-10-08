import { AlertCircle } from "lucide-react";
import { Fragment } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StampCard } from "@/features/home/components/StampCard";
import { useDashboard } from "@/features/home/hooks/useDashboard";
import { useStamp } from "@/features/home/hooks/useStamp";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { PageLoader } from "@/shared/components/layout/PageLoader";

export const AttendancePage = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const {
    handleStamp,
    isLoading: isStamping,
    message,
    messageStatus,
    clearMessage,
  } = useStamp();

  if (isLoading && !data) {
    return <PageLoader label="勤怠情報を読み込み中" />;
  }

  if (isError) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="font-bold text-3xl text-slate-900 tracking-tight">
            勤怠管理
          </h1>
          <p className="text-slate-600">
            勤怠データの取得中に問題が発生しました。再読み込みをお試しください。
          </p>
        </header>

        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>データの取得に失敗しました</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "現在データを取得できません。"}
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => {
            refetch().catch(() => {
              // ignore errors in manual refresh
            });
          }}
          size="lg"
          variant="outline"
        >
          <SpriteIcon className="h-4 w-4" decorative name="refresh-cw" />
          再読み込み
        </Button>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-bold text-3xl text-slate-900 tracking-tight">
          勤怠管理
        </h1>
        <p className="text-slate-600">
          打刻と勤務状況をリアルタイムに管理し、最新の勤怠ステータスを確認できます。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StampCard
          className="h-full border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/40 backdrop-blur"
          isLoading={isStamping}
          message={message}
          messageStatus={messageStatus}
          onDismissMessage={clearMessage}
          onStamp={handleStamp}
        />

        <Card className="h-full border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900">
              本日のステータス
              <Badge variant="secondary">リアルタイム</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-slate-700 text-sm">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-500 text-xs uppercase tracking-wide">
                担当者
              </p>
              <p className="font-semibold text-slate-900 text-xl">
                {data.employee.lastName} {data.employee.firstName}
              </p>
              <p className="text-slate-500">{data.employee.email}</p>
              <Badge className="mt-1 w-fit" variant="outline">
                {data.employee.admin ? "管理者" : "一般ユーザー"}
              </Badge>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
              <p className="font-medium text-slate-800">
                打刻履歴は勤怠履歴ページで確認できます。必要に応じて打刻後に最新情報を更新してください。
              </p>
              <Button
                className="mt-3"
                disabled={isLoading || isStamping}
                onClick={() => {
                  refetch().catch(() => {
                    // ignore errors in manual refresh
                  });
                }}
                size="sm"
                variant="outline"
              >
                <SpriteIcon className="h-4 w-4" decorative name="refresh-cw" />
                最新の情報に更新
              </Button>
            </div>

            <div className="grid gap-3">
              {[
                "打刻結果はカード下部に表示され、通知が不要な場合は閉じることができます。",
                "夜勤フラグを切り替えると、次回の打刻リクエストに反映されます。",
                "通信状態に応じて自動で再試行されますが、長時間待機する場合は再読み込みしてください。",
              ].map((text, index) => (
                <Fragment key={text}>
                  <div className="flex items-start gap-2 rounded-lg border border-slate-200/70 bg-white/90 p-3">
                    <SpriteIcon
                      aria-label={`ポイント${index + 1}`}
                      className="mt-0.5 h-4 w-4 text-sky-600"
                      name="check"
                    />
                    <p className="text-slate-700">{text}</p>
                  </div>
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
