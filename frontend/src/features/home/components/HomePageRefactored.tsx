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
  const { data, isLoading } = useDashboard();
  const {
    handleStamp,
    isLoading: isStamping,
    message,
    messageStatus,
    clearMessage,
  } = useStamp();

  if (isLoading || !data) {
    return <PageLoader label="ダッシュボードを読み込み中" />;
  }

  return (
    <section className="space-y-8 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
      <HomeHero
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        data-testid="home-dashboard-grid"
      >
        <StampCard
          className="bg-white/90"
          isLoading={isStamping}
          message={message}
          messageStatus={messageStatus}
          onDismissMessage={clearMessage}
          onStamp={handleStamp}
        />
        <NewsCard
          className="bg-white/90"
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
  <header
    className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-white px-6 py-8 shadow-lg shadow-sky-100/60"
    data-testid="home-hero"
  >
    <div className="relative z-10 space-y-3">
      <p className="font-medium text-sky-600 text-sm uppercase tracking-wide">
        ようこそ
      </p>
      <h1 className="font-semibold text-3xl text-slate-900 tracking-tight sm:text-4xl">
        おはようございます、{lastName} {firstName} さん
      </h1>
      <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
        今日の業務予定と最新のお知らせを確認できます。必要に応じて出勤・退勤の打刻を行ってください。
      </p>
    </div>
    <div
      aria-hidden="true"
      className="-right-12 -top-12 absolute h-32 w-32 rounded-full bg-sky-200/60 blur-3xl"
    />
  </header>
);
