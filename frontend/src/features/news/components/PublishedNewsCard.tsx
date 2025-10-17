import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NewsResponse } from "@/types";

type PublishedNewsCardProps = {
  news: NewsResponse;
  className?: string;
};

const truncateContent = (content: string, maxLength = 120): string => {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength)}…`;
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
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="font-semibold text-base">
          {news.newsDate}
        </CardTitle>
        <Badge variant="default">公開中</Badge>
      </div>
    </CardHeader>
    <CardContent className="flex-1">
      <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
        {truncateContent(news.content)}
      </p>
    </CardContent>
  </Card>
);
