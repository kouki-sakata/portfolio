import { memo } from "react";

import { Badge } from "@/components/ui/badge";
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
            <li
              className="rounded-xl border border-slate-200/60 bg-white/90 p-4 shadow-sm"
              key={news.id}
            >
              <div className="flex items-center justify-between text-xs">
                <time className="text-slate-500" dateTime={news.newsDate}>
                  {news.newsDate}
                </time>
                <Badge variant="outline">お知らせ</Badge>
              </div>
              <p className="mt-2 font-medium text-slate-800 text-sm leading-relaxed">
                {news.content}
              </p>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Card
        className={cn(
          "w-full border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-md",
          className
        )}
        data-testid="news-card"
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-semibold text-slate-900 text-xl">
            最新のお知らせ
            <Badge aria-hidden="true" variant="secondary">
              更新
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-700">
          {renderContent()}
          <p className="text-slate-500 text-xs">
            最新ニュースはホーム画面にのみ表示されます。詳細は通知センターから確認してください。
          </p>
        </CardContent>
      </Card>
    );
  }
);

NewsCard.displayName = "NewsCard";
