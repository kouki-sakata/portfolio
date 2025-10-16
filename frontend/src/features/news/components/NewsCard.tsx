import type { CheckedState } from "@radix-ui/react-checkbox";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTogglePublishMutation } from "@/features/news/hooks/useNews";
import { cn } from "@/lib/utils";
import type { NewsResponse } from "@/types";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

type NewsCardProps = {
  className?: string;
  news: NewsResponse;
  onEdit?: (news: NewsResponse) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (news: NewsResponse, next: boolean) => void;
};

const truncateContent = (content: string, maxLength = 160): string => {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength)}…`;
};

export const NewsCard = ({
  className,
  news,
  onEdit,
  selectable = false,
  selected = false,
  onSelectionChange,
}: NewsCardProps) => {
  const toggleMutation = useTogglePublishMutation();

  const handleEdit = () => {
    onEdit?.(news);
  };

  const handleToggle = async () => {
    await toggleMutation.mutateAsync({
      id: news.id,
      releaseFlag: !news.releaseFlag,
    });
  };

  const handleSelectChange = (next: CheckedState) => {
    if (!selectable) {
      return;
    }
    const checked = next === true;
    onSelectionChange?.(news, checked);
  };

  const status = news.releaseFlag
    ? ({ label: "公開中", variant: "default" } as const)
    : ({ label: "下書き", variant: "secondary" } as const);

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          {selectable ? (
            <Checkbox
              aria-label={`${news.content}を選択`}
              checked={selected}
              onCheckedChange={handleSelectChange}
            />
          ) : null}
          <div className="flex w-full items-start justify-between gap-2">
            <CardTitle className="font-semibold text-base">
              {news.newsDate}
            </CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          最終更新: {new Date(news.updateDate).toLocaleString("ja-JP")}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {truncateContent(news.content)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={handleEdit} size="sm" type="button" variant="outline">
          編集
        </Button>
        <Button
          disabled={toggleMutation.isPending}
          onClick={handleToggle}
          size="sm"
          type="button"
          variant="secondary"
        >
          公開状態を切り替え
        </Button>
        <DeleteConfirmDialog news={news} />
      </CardFooter>
    </Card>
  );
};
