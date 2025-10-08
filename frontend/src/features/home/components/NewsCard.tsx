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
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        );
      }

      if (newsItems.length === 0) {
        return (
          <CardDescription className="py-8 text-center text-slate-500">
            現在表示できるお知らせはありません。
          </CardDescription>
        );
      }

      return (
        <ul className="space-y-4">
          {newsItems.map((news) => (
            <li
              className="border-slate-200/80 border-b pb-3 last:border-0 last:pb-0"
              key={news.id}
            >
              <div className="space-y-1">
                <time
                  className="text-slate-500 text-xs"
                  dateTime={news.newsDate}
                >
                  {news.newsDate}
                </time>
                <p className="text-slate-700 text-sm leading-relaxed">
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
        className={cn(
          "w-full border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="font-semibold text-lg text-slate-900">
            最新のお知らせ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-600 text-sm">
          {renderContent()}
        </CardContent>
      </Card>
    );
  }
);

NewsCard.displayName = "NewsCard";
