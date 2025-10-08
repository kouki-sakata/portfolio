import { memo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeNewsItem } from "@/features/home/types";
import { cn } from "@/lib/utils";

/**
 * NewsCardのProps
 * Interface Segregation: 必要最小限のプロパティ
 */
export type NewsCardProps = {
  newsItems: HomeNewsItem[];
  isLoading?: boolean;
  className?: string;
};

/**
 * NewsCardプレゼンテーション コンポーネント
 * Single Responsibility: ニュース表示のみを担当
 */
export const NewsCard = memo(
  ({ newsItems, isLoading = false, className }: NewsCardProps) => {
    const renderContent = () => {
      if (isLoading) {
        return (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        );
      }

      if (newsItems.length === 0) {
        return (
          <CardDescription className="py-8 text-center text-muted-foreground">
            現在表示できるお知らせはありません。
          </CardDescription>
        );
      }

      return (
        <ul className="home-news-list">
          {newsItems.map((news) => (
            <li className="home-news-list__item" key={news.id}>
              <time className="home-news-list__date" dateTime={news.newsDate}>
                {news.newsDate}
              </time>
              <p className="home-news-list__content">{news.content}</p>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="home-card__header">
          <CardTitle className="home-card__title text-[color:inherit]">
            最新のお知らせ
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-[1] space-y-2">
          {renderContent()}
        </CardContent>
      </Card>
    );
  }
);

NewsCard.displayName = "NewsCard";
