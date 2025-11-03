import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/shared/utils/cn";

export type MiniStatProps = {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: string;
  variant?: "primary" | "warning" | "success" | "info";
  className?: string;
};

const variantStyles = {
  primary: "border-primary/30 bg-primary/5 text-primary",
  warning: "border-orange-500/30 bg-orange-500/5 text-orange-700",
  success: "border-green-600/30 bg-green-600/5 text-green-700",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-700",
};

export const MiniStat = ({
  className,
  icon: Icon,
  title,
  trend,
  value,
  variant = "primary",
}: MiniStatProps) => (
  <Card
    className={cn(
      "p-4 transition-shadow hover:shadow-md",
      variantStyles[variant],
      className
    )}
    data-testid="mini-stat"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground text-xs">{title}</p>
        <p className="font-semibold text-2xl tracking-tight">{value}</p>
        {trend && (
          <p className="flex items-center gap-1 text-muted-foreground text-xs">
            {trend}
          </p>
        )}
      </div>
      <Icon className="h-4 w-4 opacity-70" />
    </div>
  </Card>
);
