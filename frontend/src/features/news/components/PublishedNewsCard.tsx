import type { KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsCategoryBadgeVariant } from "@/features/news/lib/categoryBadge";
import type { NewsViewModel } from "@/features/news/lib/newsViewModel";
import { cn } from "@/lib/utils";

type PublishedNewsCardProps = {
  news: NewsViewModel;
  className?: string;
  onSelect?: (news: NewsViewModel) => void;
};

export const PublishedNewsCard = ({
  news,
  className,
  onSelect,
}: PublishedNewsCardProps) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(news);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(news);
    }
  };

  const isInteractive = Boolean(onSelect);

  return (
    <Card
      aria-label={
        isInteractive ? `${news.title}の詳細モーダルを開く` : undefined
      }
      className={cn(
        "flex h-full flex-col transition-shadow hover:shadow-md",
        isInteractive &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-2 font-semibold text-lg">
            {news.title}
          </CardTitle>
          <Badge
            contrastLevel="aa"
            variant={getNewsCategoryBadgeVariant(news.category)}
          >
            {news.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <time>{news.newsDate}</time>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
          {news.content}
        </p>
      </CardContent>
    </Card>
  );
};
