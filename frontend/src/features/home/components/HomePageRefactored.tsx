import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/shared/components/layout/PageLoader";

import { useDashboard } from "../hooks/useDashboard";
import { useStamp } from "../hooks/useStamp";
import { NewsCard } from "./NewsCard";
import { StampCard } from "./StampCard";

/**
 * リファクタリング後のHomePageコンポーネント
 * Single Responsibility: UIの調整とコンポーネントの組み立てのみ
 * Dependency Inversion: カスタムフックのインターフェースに依存
 */
export const HomePageRefactored = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { handleStamp, isLoading: isStamping, message, clearMessage } =
    useStamp();

  const handleRetry = () => {
    refetch().catch(() => {
      // 再試行時の追加処理は不要
    });
  };

  if (isLoading) {
    return <PageLoader label="ダッシュボードを読み込み中" />;
  }

  if (isError || !data) {
    return (
      <section className="container mx-auto flex h-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <Alert
          className="w-full max-w-xl border-red-200 bg-red-50 text-red-700"
          variant="destructive"
        >
          <AlertCircle aria-hidden className="h-5 w-5" />
          <AlertTitle>ダッシュボードを読み込めませんでした</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "時間をおいて再度お試しください。"}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} variant="outline">
          再読み込み
        </Button>
      </section>
    );
  }

  return (
    <section className="home container mx-auto max-w-5xl px-4 py-6">
      <HomeHero
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <StampCard
          autoDismissDelay={6000}
          className="home-card"
          isLoading={isStamping}
          message={message}
          onDismissMessage={clearMessage}
          onStamp={handleStamp}
        />
        <NewsCard
          className="home-card"
          isLoading={false}
          newsItems={data.news}
        />
      </div>
    </section>
  );
};

/**
 * ヒーローセクション コンポーネント
 * Single Responsibility: ヒーローセクションの表示のみ
 */
type HomeHeroProps = {
  firstName: string;
  lastName: string;
};

const HomeHero = ({ firstName, lastName }: HomeHeroProps) => (
  <header className="home-hero mb-8">
    <h1 className="home-hero__title mb-2 font-bold text-2xl text-gray-900 md:text-3xl">
      おはようございます、{lastName} {firstName} さん
    </h1>
    <p className="home-hero__subtitle text-gray-600">
      今日も素敵な一日を過ごしましょう。
    </p>
  </header>
);
