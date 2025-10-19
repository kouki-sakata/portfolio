import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsResponse } from "@/types";

type PublishedNewsGridProps = {
  news: NewsResponse[];
  isLoading?: boolean;
  maxItems?: number;
};

const PREVIEW_LENGTH = 160;

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const preview = (content: string) => {
  if (content.length <= PREVIEW_LENGTH) {
    return content;
  }
  return `${content.slice(0, PREVIEW_LENGTH)}…`;
};

export const PublishedNewsGrid = ({
  news,
  isLoading = false,
  maxItems = 4,
}: PublishedNewsGridProps) => {
  if (isLoading) {
    const skeletonKeys = Array.from(
      { length: Math.max(maxItems, 1) },
      (_item, order) => `published-skeleton-${order}`
    );

    return (
      <section className="space-y-3" data-testid="published-news-skeleton">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {skeletonKeys.map((key) => (
            <Card key={key}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const publishedNews = news.filter((item) => item.releaseFlag);

  if (publishedNews.length === 0) {
    return (
      <section className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          現在公開中のお知らせはありません。
        </p>
      </section>
    );
  }

  const items = publishedNews.slice(0, Math.max(maxItems, 1));

  return (
    <section aria-label="公開中のお知らせ" className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">公開中のお知らせ</h2>
          <p className="text-muted-foreground text-sm">
            最近公開されたお知らせを最大{maxItems}件表示しています。
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {items.map((item) => (
          <Card className="h-full" key={item.id}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={item.newsDate}>
                  {formatDate(item.newsDate)}
                </time>
              </div>
              <CardTitle className="line-clamp-2 font-semibold text-base">
                {preview(item.content)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                {item.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
