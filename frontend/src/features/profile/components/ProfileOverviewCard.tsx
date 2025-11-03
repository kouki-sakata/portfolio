import { Pencil } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfileOverviewViewModel } from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

type ProfileOverviewCardVariant = "standard" | "compact";

export type ProfileOverviewCardProps = {
  overview: ProfileOverviewViewModel;
  onEdit: () => void;
  className?: string;
  variant?: ProfileOverviewCardVariant;
};

const ensureString = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  return trimmed;
};

const formatUpdatedAt = (isoLike: string): string => {
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) {
    return "最終更新: 不明";
  }

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = part("year");
  const month = part("month");
  const day = part("day");
  const hour = part("hour");
  const minute = part("minute");

  return `最終更新: ${year}年${month}月${day}日 ${hour}:${minute}`;
};

const normalizeField = (value: string | null | undefined) => {
  const normalized = ensureString(value);
  return normalized.length > 0 ? normalized : null;
};

type OverviewField = {
  key: keyof ProfileOverviewViewModel;
  label: string;
  iconLabel?: string;
};

const OVERVIEW_FIELDS: OverviewField[] = [
  { key: "fullName", label: "氏名" },
  { key: "email", label: "メールアドレス" },
  { key: "employeeNumber", label: "社員番号" },
  { key: "department", label: "部署" },
  { key: "address", label: "住所" },
];

export const ProfileOverviewCard = ({
  overview,
  onEdit,
  className,
  variant = "standard",
}: ProfileOverviewCardProps) => {
  const missingCount = useMemo(() => {
    const values = OVERVIEW_FIELDS.filter(
      ({ key }) => key !== "email" && key !== "fullName"
    ).map(({ key }) => normalizeField(overview[key]));

    return values.filter((value) => value === null).length;
  }, [overview]);

  const formattedUpdatedAt = useMemo(
    () => formatUpdatedAt(overview.updatedAt),
    [overview.updatedAt]
  );

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/60 shadow-sm",
        variant === "compact" ? "p-3 md:p-4" : "p-4 md:p-6",
        className
      )}
      data-testid="profile-overview-card"
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-balance font-semibold text-xl">
              プロフィール
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {formattedUpdatedAt}
            </CardDescription>
          </div>
          <Button
            aria-label="プロフィールを編集する"
            onClick={onEdit}
            size="sm"
            variant="outline"
          >
            <Pencil aria-hidden="true" className="mr-2 h-4 w-4" />
            編集
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {OVERVIEW_FIELDS.map(({ label, key }) => {
            const value = normalizeField(overview[key]);
            return (
              <div
                className="rounded-lg border border-border/50 bg-muted/30 p-3"
                key={key}
              >
                <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {label}
                </dt>
                <dd className="mt-2 font-semibold text-foreground text-sm">
                  {value ?? "未設定"}
                </dd>
              </div>
            );
          })}
        </dl>
        <div aria-hidden="true" className="h-px w-full bg-border/60" />
        <section className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">活動メモ</h3>
          {normalizeField(overview.activityNote) ? (
            <p className="whitespace-pre-wrap rounded-md border border-border/40 bg-background px-3 py-2 text-muted-foreground text-sm leading-relaxed">
              {ensureString(overview.activityNote)}
            </p>
          ) : (
            <p className="rounded-md border border-border/40 border-dashed bg-muted/20 px-3 py-6 text-center text-muted-foreground text-sm">
              活動メモはまだ登録されていません。プロフィール編集から記録できます。
            </p>
          )}
        </section>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full flex-col gap-2 text-muted-foreground text-xs md:flex-row md:items-center md:justify-between">
          <span data-testid="profile-overview-hint">
            氏名・メールはシステム管理者が更新します。
          </span>
          {missingCount > 0 ? (
            <span className="text-amber-600">
              プロフィール編集から登録できます。
            </span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
};
