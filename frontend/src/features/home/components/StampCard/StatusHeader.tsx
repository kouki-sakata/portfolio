import { Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import type { AttendanceStatusMeta } from "@/features/home/types";

type StatusHeaderProps = {
  statusMeta: AttendanceStatusMeta | undefined;
  nightWork: boolean;
  isLoading: boolean;
  onToggleNightWork: () => void;
};

export const StatusHeader = ({
  statusMeta,
  nightWork,
  isLoading,
  onToggleNightWork,
}: StatusHeaderProps) => (
  <div className="flex flex-row items-center justify-between gap-4">
    <CardTitle className="flex items-center gap-2 font-semibold text-lg">
      <Badge className="rounded-full px-3 py-1 text-xs shadow-sm transition-all duration-300">
        {statusMeta ? statusMeta.label : "未登録"}
      </Badge>
      ワンクリック打刻
    </CardTitle>
    <Button
      aria-checked={nightWork}
      aria-label={`夜勤扱いとして登録(現在: ${nightWork ? "ON" : "OFF"})`}
      className="gap-1 text-xs"
      disabled={isLoading}
      onClick={onToggleNightWork}
      role="switch"
      size="sm"
      variant={nightWork ? "default" : "outline"}
    >
      <Moon aria-hidden="true" className="h-4 w-4" /> 夜勤扱い
    </Button>
  </div>
);
