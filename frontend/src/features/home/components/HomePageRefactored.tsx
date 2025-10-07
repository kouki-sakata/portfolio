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
  const { handleStamp, isLoading: isStamping, message } = useStamp();

  if (isLoading || !data) {
    return <PageLoader label="ダッシュボードを読み込み中" />;
  }

  return (
    <section className="home container mx-auto px-4 py-6">
      <HomeHero
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StampCard
          className="home-card"
          isLoading={isStamping}
          message={message}
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
