import { Briefcase, Building2, Clock, Globe, Mail, User2 } from "lucide-react";
import { useMemo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ExtendedProfileOverviewViewModel } from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

export type ProfileOverviewCardProps = {
  overview: ExtendedProfileOverviewViewModel;
  className?: string;
};

const ensureString = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  return trimmed;
};

const normalizeField = (value: string | null | undefined) => {
  const normalized = ensureString(value);
  return normalized.length > 0 ? normalized : null;
};

const formatJoinedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getStatusLabel = (
  status: ExtendedProfileOverviewViewModel["status"]
): string => {
  const labels = {
    active: "稼働中",
    leave: "休職中",
    inactive: "停止",
  };
  return labels[status];
};

const getWorkStyleLabel = (
  workStyle: ExtendedProfileOverviewViewModel["workStyle"]
): string => {
  const labels = {
    remote: "フルリモート",
    hybrid: "ハイブリッド",
    onsite: "出社",
  };
  return labels[workStyle];
};

const getInitials = (fullName: string): string => {
  const parts = fullName.split(" ");
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[1];
    if (!(first && last)) {
      return "??";
    }
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
};

export const ProfileOverviewCard = ({
  overview,
  className,
}: ProfileOverviewCardProps) => {
  const joinedDate = useMemo(
    () => formatJoinedDate(overview.joinedAt),
    [overview.joinedAt]
  );

  const initials = useMemo(
    () => getInitials(overview.fullName),
    [overview.fullName]
  );

  const statusVariant = overview.status === "active" ? "default" : "secondary";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/60 shadow-sm",
        className
      )}
      data-testid="profile-overview-card"
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage alt={overview.fullName} src={overview.avatarUrl} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{overview.fullName}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge className="rounded-full" variant="secondary">
              {normalizeField(overview.department) ?? "未所属"}
            </Badge>
            <span className="text-muted-foreground text-xs">
              入社 {joinedDate}
            </span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4" />
          {overview.email}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4" />
          {normalizeField(overview.department) ?? "未所属"}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User2 className="h-4 w-4" />
          上長: {normalizeField(overview.manager) ?? "未設定"}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4" />
          勤務形態: {getWorkStyleLabel(overview.workStyle)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          就業: {overview.schedule.start} - {overview.schedule.end}（休憩{" "}
          {overview.schedule.breakMinutes}分）
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4" />
          {normalizeField(overview.location) ?? "未設定"}
        </div>
        <div className="pt-2">
          <Label className="text-muted-foreground text-xs">メモ</Label>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {normalizeField(overview.activityNote) ??
              "メモはまだ登録されていません"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Badge className="rounded-full" variant={statusVariant}>
          {getStatusLabel(overview.status)}
        </Badge>
        <span className="text-muted-foreground text-xs">
          社員番号: {normalizeField(overview.employeeNumber) ?? "未設定"}
        </span>
      </CardFooter>
    </Card>
  );
};
