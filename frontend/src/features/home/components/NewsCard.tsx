import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  manageHref?: string;
  manageLabel?: string;
};

/**
 * NewsCardプレゼンテーション コンポーネント
 * Single Responsibility: ニュース表示のみを担当
 */
export const NewsCard = memo(
  ({
    newsItems,
    isLoading = false,
    className,
    manageHref,
    manageLabel = "お知らせ管理へ",
  }: NewsCardProps) => {
    const visibleNews = useMemo(() => {
      const toTime = (value: string) => {
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
      };

      return [...newsItems]
        .sort((a, b) => toTime(b.newsDate) - toTime(a.newsDate))
        .slice(0, 5);
    }, [newsItems]);

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

      if (visibleNews.length === 0) {
        return (
          <CardDescription className="py-8 text-center text-muted-foreground">
            現在表示できるお知らせはありません。
          </CardDescription>
        );
      }

      return (
        <ul className="space-y-4">
          {visibleNews.map((news) => (
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
        className={cn(
          "w-full rounded-2xl border border-slate-100 bg-white/70 shadow-md backdrop-blur-sm transition-all hover:shadow-lg",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="font-semibold text-base text-slate-700 tracking-tight">
            最新のお知らせ
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            重要なお知らせを新着順で表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
          {manageHref ? (
            <div className="mt-6 flex justify-end">
              <Button asChild variant="outline">
                <Link to={manageHref}>{manageLabel}</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }
);

NewsCard.displayName = "NewsCard";
