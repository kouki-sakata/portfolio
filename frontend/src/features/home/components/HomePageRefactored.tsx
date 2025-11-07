import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  type HomeClockState,
  useHomeClock,
} from "@/features/home/hooks/useHomeClock";
import { usePublishedNewsQuery } from "@/features/news/hooks/useNews";
import { SkeletonCard } from "@/shared/components/loading/skeletons/SkeletonVariants";
import { useBreakToggle } from "../hooks/useBreakToggle";
import { useDashboard } from "../hooks/useDashboard";
import { useStamp } from "../hooks/useStamp";
import type { HomeNewsItem } from "../types";
import { HomeClockPanel } from "./HomeClockPanel";
import { NewsCard } from "./NewsCard";
import { StampCard } from "./StampCard";
import { AttendanceSnapshotCard } from "./AttendanceSnapshotCard";

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
  const { toggleBreak, isLoading: isBreakToggling } = useBreakToggle(
    undefined,
    {
      timestampProvider: clockState.captureTimestamp,
    }
  );
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
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
      </div>
    );
  }

  if (isLoading || !data) {
    return <HomeDashboardSkeleton clockState={clockState} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <section className="home container mx-auto px-4 py-6">
        <HomeHero
          firstName={data.employee.firstName}
          lastName={data.employee.lastName}
        />

        <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <StampCard
              className="home-card"
              clockState={clockState}
              isLoading={isStamping}
              isToggling={isBreakToggling}
              onCaptureTimestamp={clockState.captureTimestamp}
              onStamp={handleStamp}
              onToggleBreak={() => toggleBreak()}
              showSkeleton={false}
              snapshot={data.attendance}
              status={stampStatus}
            />
            <AttendanceSnapshotCard
              className="home-card"
              isLoading={isStamping && !data.attendance}
              isToggling={isBreakToggling}
              onToggleBreak={() => toggleBreak()}
              snapshot={data.attendance}
            />
          </div>
          <NewsCard
            className="home-card"
            isLoading={publishedNewsQuery.isLoading}
            manageHref={data.employee.admin ? "/news-management" : undefined}
            newsItems={publishedNews}
          />
        </div>
      </section>
    </div>
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

const HomeHero = ({ lastName, firstName }: HomeHeroProps) => (
  <header className="home-hero mb-8 rounded-3xl bg-gradient-to-r bg-white/70 from-sky-100 to-indigo-100 px-10 py-8 shadow-sm backdrop-blur-sm">
    <p className="text-muted-foreground text-sm">
      今日も素敵な一日を過ごしましょう。
    </p>
    <h1 className="mt-2 font-bold text-3xl text-gray-900 tracking-tight">
      おはようございます、{lastName} {firstName} さん
    </h1>
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
      <div className="home-grid grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <SkeletonCard className="home-card" />
        <SkeletonCard className="home-card" />
      </div>
    </section>
  );
};
