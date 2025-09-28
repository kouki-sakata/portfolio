import { PageLoader } from '@/shared/components/layout/PageLoader'
import { StampCard } from './StampCard'
import { NewsSection } from './NewsSection'
import { useStamp } from '../hooks/useStamp'
import { useDashboard } from '../hooks/useDashboard'

/**
 * リファクタリング後のHomePageコンポーネント
 * Single Responsibility: UIの調整とコンポーネントの組み立てのみ
 * Dependency Inversion: カスタムフックのインターフェースに依存
 */
export const HomePageRefactored = () => {
  const { data, isLoading } = useDashboard()
  const { handleStamp, isLoading: isStamping, message } = useStamp()

  if (isLoading || !data) {
    return <PageLoader label="ダッシュボードを読み込み中" />
  }

  return (
    <section className="home">
      <HomeHero
        firstName={data.employee.firstName}
        lastName={data.employee.lastName}
      />

      <div className="home-grid">
        <StampCard
          onStamp={handleStamp}
          isLoading={isStamping}
          message={message}
        />
        <NewsSection
          news={data.news}
          isLoading={false}
        />
      </div>
    </section>
  )
}

/**
 * ヒーローセクション コンポーネント
 * Single Responsibility: ヒーローセクションの表示のみ
 */
interface HomeHeroProps {
  firstName: string
  lastName: string
}

const HomeHero = ({ firstName, lastName }: HomeHeroProps) => (
  <header className="home-hero">
    <h1 className="home-hero__title">
      おはようございます、{lastName} {firstName} さん
    </h1>
    <p className="home-hero__subtitle">
      今日も素敵な一日を過ごしましょう。
    </p>
  </header>
)