import { memo } from "react";

/**
 * ニュース項目の型
 */
export type NewsItem = {
  id: number;
  newsDate: string;
  content: string;
};

/**
 * NewsSectionのProps
 * Interface Segregation: ニュース表示に必要な情報のみ
 */
export type NewsSectionProps = {
  news: NewsItem[];
  isLoading?: boolean;
};

/**
 * NewsSectionプレゼンテーション コンポーネント
 * Single Responsibility: ニュース表示のみを担当
 */
export const NewsSection = memo(
  ({ news, isLoading = false }: NewsSectionProps) => {
    if (isLoading) {
      return (
        <article className="home-card">
          <header className="home-card__header">
            <h2 className="home-card__title">最新のお知らせ</h2>
          </header>
          <div className="home-news-list">
            <p className="home-news-list__empty">読み込み中...</p>
          </div>
        </article>
      );
    }

    return (
      <article className="home-card">
        <header className="home-card__header">
          <h2 className="home-card__title">最新のお知らせ</h2>
        </header>
        <ul className="home-news-list">
          {news.length === 0 ? (
            <li className="home-news-list__empty">
              現在表示できるお知らせはありません。
            </li>
          ) : (
            news.map((item) => (
              <li className="home-news-list__item" key={item.id}>
                <time className="home-news-list__date">{item.newsDate}</time>
                <p className="home-news-list__content">{item.content}</p>
              </li>
            ))
          )}
        </ul>
      </article>
    );
  }
);

NewsSection.displayName = "NewsSection";
