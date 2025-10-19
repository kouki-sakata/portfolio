import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NewsResponse } from "@/types";

type PublishedNewsCardProps = {
  news: NewsResponse;
  className?: string;
};

const getBadgeVariant = (
  category: string
): "destructive" | "default" | "secondary" => {
  switch (category) {
    case "重要":
      return "destructive";
    case "システム":
      return "default";
    case "一般":
      return "secondary";
    default:
      return "secondary";
  }
};

export const PublishedNewsCard = ({
  news,
  className,
}: PublishedNewsCardProps) => (
  <Card
    className={cn(
      "flex h-full flex-col transition-shadow hover:shadow-md",
      className
    )}
  >
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="line-clamp-2 font-semibold text-lg">
          {news.title}
        </CardTitle>
        <Badge variant={getBadgeVariant(news.category)}>{news.category}</Badge>
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
