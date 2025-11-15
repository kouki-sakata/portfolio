import { Badge } from "@/components/ui/badge";
import type { StampRequestStatus } from "@/features/stampRequestWorkflow/types";
import { cn } from "@/shared/utils/cn";

type RequestStatusBadgeProps = {
  status: StampRequestStatus;
  className?: string;
  ariaHidden?: boolean;
};

const STATUS_STYLES: Record<
  StampRequestStatus,
  { label: string; className: string }
> = {
  NONE: {
    label: "未申請",
    className: "bg-slate-200 text-slate-700",
  },
  NEW: {
    label: "新規",
    className: "bg-sky-100 text-sky-800",
  },
  PENDING: {
    label: "審査中",
    className: "bg-amber-100 text-amber-900",
  },
  APPROVED: {
    label: "承認済み",
    className: "bg-emerald-100 text-emerald-800",
  },
  REJECTED: {
    label: "却下",
    className: "bg-rose-100 text-rose-900",
  },
  CANCELLED: {
    label: "取消済み",
    className: "bg-slate-300 text-slate-800",
  },
};

export const RequestStatusBadge = ({
  status,
  className,
  ariaHidden,
}: RequestStatusBadgeProps) => {
  const style = STATUS_STYLES[status];
  return (
    <Badge
      aria-label={style.label}
      aria-hidden={ariaHidden}
      className={cn(
        "h-6 rounded-full px-3 py-1 text-xs font-semibold",
        style.className,
        className
      )}
      role="status"
      variant="outline"
    >
      {style.label}
    </Badge>
  );
};
