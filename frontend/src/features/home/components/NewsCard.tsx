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
        <ul className="space-y-4">
          {newsItems.map((news) => (
            <li className="border-b pb-3 last:border-0 last:pb-0" key={news.id}>
              <div className="space-y-1">
                <time
                  className="text-slate-500 text-xs"
                  dateTime={news.newsDate}
                >
                  {news.newsDate}
                </time>
                <p className="text-slate-900 text-sm leading-relaxed">
                  {news.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Card
        aria-busy={isLoading}
        className={cn("w-full bg-card text-card-foreground", className)}
      >
        <CardHeader>
          <CardTitle className="font-semibold text-lg text-slate-900">
            最新のお知らせ
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            重要なお知らせを新着順で表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    );
  }
);

NewsCard.displayName = "NewsCard";
