import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  type HomeClockState,
  useHomeClock,
} from "@/features/home/hooks/useHomeClock";
import { usePublishedNewsQuery } from "@/features/news/hooks/useNews";
import { SkeletonCard } from "@/shared/components/loading/skeletons/SkeletonVariants";

import { useDashboard } from "../hooks/useDashboard";
import { useStamp } from "../hooks/useStamp";
import type { HomeNewsItem } from "../types";
import { HomeClockPanel } from "./HomeClockPanel";
import { NewsCard } from "./NewsCard";
import { StampCard } from "./StampCard";

/**
 * リファクタリング後のHomePageコンポーネント
 * Single Responsibility: UIの調整とコンポーネントの組み立てのみ
 * Dependency Inversion: カスタムフックのインターフェースに依存
 */
export const HomePageRefactored = () => {
  const clockState = useHomeClock();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const {
    handleStamp,
    isLoading: isStamping,
    status: stampStatus,
  } = useStamp();
  const publishedNewsQuery = usePublishedNewsQuery({
    refetchInterval: 30_000,
  });

  const publishedNews = useMemo<HomeNewsItem[]>(() => {
    const items = publishedNewsQuery.data?.news ?? [];

    const toTime = (value: string) => {
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    return [...items]
      .sort((a, b) => toTime(b.newsDate) - toTime(a.newsDate))
      .slice(0, 5)
      .map(
        ({
          id,
          newsDate,
          title,
          content,
          label,
          releaseFlag,
          updateDate,
        }): HomeNewsItem => ({
          id,
          newsDate,
          title,
          content,
          label,
          releaseFlag,
          updateDate,
        })
      );
  }, [publishedNewsQuery.data?.news]);

  if (isError) {
    return (
      <section className="home container mx-auto px-4 py-6">
        <HomeClockPanel className="mb-6" state={clockState} variant="hero" />
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
          <p className="font-semibold text-destructive text-lg">
            ダッシュボードを読み込めませんでした。
          </p>
          {error instanceof Error ? (
            <p className="max-w-md text-muted-foreground text-sm">
              {error.message}
            </p>
          ) : null}
          <button
            className="inline-flex items-center justify-center rounded-md border border-primary/40 px-4 py-2 font-medium text-primary text-sm transition-colors hover:bg-primary/10"
            onClick={() => {
              refetch().catch(() => {
                // 再取得失敗時はそのまま
              });
            }}
            type="button"
          >
            再読み込み
          </button>
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return <HomeDashboardSkeleton clockState={clockState} />;
  }

  return (
    <section className="home container mx-auto px-4 py-6">
      <HomeHero
        clockState={clockState}
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StampCard
          className="home-card"
          clockState={clockState}
          isLoading={isStamping}
          onCaptureTimestamp={clockState.captureTimestamp}
          onStamp={handleStamp}
          showSkeleton={false}
          status={stampStatus}
        />
        <NewsCard
          className="home-card"
          isLoading={publishedNewsQuery.isLoading}
          manageHref={data.employee.admin ? "/news-management" : undefined}
          newsItems={publishedNews}
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
  clockState: HomeClockState;
};

const HomeHero = ({ lastName, firstName, clockState }: HomeHeroProps) => (
  <header className="home-hero mb-8 space-y-4">
    <h1 className="home-hero__title mb-2 font-bold text-2xl text-gray-900 md:text-3xl">
      おはようございます、{lastName} {firstName} さん
    </h1>
    <p className="home-hero__subtitle text-gray-600">
      今日も素敵な一日を過ごしましょう。
    </p>
    <HomeClockPanel state={clockState} variant="hero" />
  </header>
);

export const HomeDashboardSkeleton = ({
  clockState: override,
}: {
  clockState?: HomeClockState;
}) => {
  const fallbackClock = useHomeClock();
  const derivedClock = override ?? fallbackClock;

  return (
    <section
      className="home container mx-auto px-4 py-6"
      data-testid="home-dashboard-skeleton"
    >
      <div className="home-hero mb-8 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 py-10">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="mx-auto flex w-full max-w-xl justify-center pb-6">
          <HomeClockPanel
            className="max-w-sm"
            state={derivedClock}
            variant="hero"
          />
        </div>
      </div>
      <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard className="home-card" />
        <SkeletonCard className="home-card" />
      </div>
    </section>
  );
};
