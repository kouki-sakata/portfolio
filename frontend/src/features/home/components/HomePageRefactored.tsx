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
    <section className="home container mx-auto px-4 py-8 lg:py-10">
      <HomeHero
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div className="home-grid">
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
  <header className="home-hero">
    <h1 className="home-hero__title">
      おはようございます、{lastName} {firstName} さん
    </h1>
    <p className="home-hero__subtitle">
      今日も素敵な一日を過ごしましょう。
    </p>
  </header>
);
