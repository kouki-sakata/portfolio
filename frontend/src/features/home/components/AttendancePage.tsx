import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/shared/components/layout/PageLoader";

import { useDashboard } from "../hooks/useDashboard";
import { useStamp } from "../hooks/useStamp";
import { StampCard } from "./StampCard";

export const AttendancePage = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const {
    handleStamp,
    isLoading: isStamping,
    message,
    clearMessage,
  } = useStamp();

  const handleRetry = () => {
    refetch().catch(() => {
      // リカバリー用の追加処理は不要
    });
  };

  if (isLoading) {
    return <PageLoader label="出退勤情報を読み込み中" />;
  }

  if (isError || !data) {
    return (
      <section className="container mx-auto flex h-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <Alert
          className="w-full max-w-xl border-red-200 bg-red-50 text-red-700"
          variant="destructive"
        >
          <AlertCircle aria-hidden className="h-5 w-5" />
          <AlertTitle>出退勤情報を取得できませんでした</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "通信状況をご確認のうえ、再度お試しください。"}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} variant="outline">
          再読み込み
        </Button>
      </section>
    );
  }

  return (
    <section className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600">出退勤</p>
        <h1 className="font-bold text-3xl text-slate-900 tracking-tight">
          ワンクリックで打刻を記録
        </h1>
        <p className="text-slate-600">
          {data.employee.lastName} {data.employee.firstName}{" "}さん、本日の打刻状況を確認してから操作してください。
        </p>
      </header>

      <StampCard
        autoDismissDelay={6000}
        isLoading={isStamping}
        message={message}
        onDismissMessage={clearMessage}
        onStamp={handleStamp}
      />
    </section>
  );
};
