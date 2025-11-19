import { AlertCircle, Clock, Coffee, LogOut } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isPastOrToday } from "@/features/stampHistory/lib/dateUtils";
import {
  getDayOfWeekColor,
  getOvertimeBadgeVariant,
  renderBreakTimeCell,
  renderOptionalTime,
  renderOvertimeCell,
} from "@/features/stampHistory/lib/formatters";
import type { StampHistoryEntry } from "@/features/stampHistory/types";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { cn } from "@/shared/utils/cn";

export type StampHistoryCardProps = {
  entry: StampHistoryEntry;
  onRequestCorrection?: (entry: StampHistoryEntry) => void;
};

export const StampHistoryCard = memo<StampHistoryCardProps>(
  ({ entry, onRequestCorrection }) => {
    const dayOfWeekColor = getDayOfWeekColor(entry.dayOfWeek);
    const overtimeBadgeVariant = getOvertimeBadgeVariant(entry.overtimeMinutes);

    return (
      <li
        aria-labelledby={`stamp-card-${entry.year}-${entry.month}-${entry.day}`}
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle
              className="flex items-center justify-between text-base"
              id={`stamp-card-${entry.year}-${entry.month}-${entry.day}`}
            >
              <span className={cn("font-bold", dayOfWeekColor)}>
                {entry.year}/{entry.month}/{entry.day}
              </span>
              <Badge className="ml-2" variant="outline">
                {entry.dayOfWeek}
              </Badge>
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-3 pt-4">
            {/* 出勤・退勤 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Clock className="h-3 w-3" />
                  <span>出勤</span>
                </div>
                <div className="font-semibold text-lg">
                  {renderOptionalTime(entry.inTime)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <LogOut className="h-3 w-3" />
                  <span>退勤</span>
                </div>
                <div className="font-semibold text-lg">
                  {renderOptionalTime(entry.outTime)}
                </div>
              </div>
            </div>

            {/* 休憩 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Coffee className="h-3 w-3" />
                  <span>休憩開始</span>
                </div>
                <div className="text-sm">
                  {renderBreakTimeCell(entry.breakStartTime)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Coffee className="h-3 w-3" />
                  <span>休憩終了</span>
                </div>
                <div className="text-sm">
                  {renderBreakTimeCell(entry.breakEndTime)}
                </div>
              </div>
            </div>

            {/* 残業 */}
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>残業</span>
              </div>
              <Badge className="font-semibold" variant={overtimeBadgeVariant}>
                {renderOvertimeCell(entry.overtimeMinutes)}
              </Badge>
            </div>

            {/* 夜勤 */}
            {entry.isNightShift && (
              <div className="flex items-center justify-center rounded-md bg-purple-100 px-3 py-2">
                <Badge className="bg-purple-700 font-semibold text-white">
                  夜勤
                </Badge>
              </div>
            )}

            {/* 更新日時 */}
            <div className="pt-2 text-muted-foreground text-xs">
              更新: {entry.updateDate ?? "-"}
            </div>

            {/* 申請ステータス */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-muted-foreground text-xs">申請:</span>
              <RequestStatusBadge status={entry.requestStatus ?? "NONE"} />
            </div>
          </CardContent>

          <Separator />

          {isPastOrToday(entry.year, entry.month, entry.day) &&
            onRequestCorrection && (
              <CardFooter className="pt-4">
                <Button
                  aria-label="修正申請"
                  className="w-full"
                  disabled={entry.requestStatus === "PENDING"}
                  onClick={() => onRequestCorrection(entry)}
                  size="sm"
                  variant="outline"
                >
                  <SpriteIcon
                    className="mr-1 h-4 w-4"
                    decorative
                    name="file-text"
                  />
                  申請
                </Button>
              </CardFooter>
            )}
        </Card>
      </li>
    );
  }
);

StampHistoryCard.displayName = "StampHistoryCard";
