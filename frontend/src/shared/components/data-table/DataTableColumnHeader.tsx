import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

type DataTableColumnHeaderProps<TData, TValue = unknown> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

const SortIcon = ({ direction }: { direction: "asc" | "desc" | false }) => {
  if (direction === "desc") {
    return <SpriteIcon className="ml-2 size-4" decorative name="arrow-down" />;
  }
  if (direction === "asc") {
    return <SpriteIcon className="ml-2 size-4" decorative name="arrow-up" />;
  }
  return (
    <SpriteIcon className="ml-2 size-4" decorative name="chevrons-up-down" />
  );
};

export function DataTableColumnHeader<TData, TValue = unknown>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleToggleSort = () => {
    const currentSort = column.getIsSorted();
    if (currentSort === "desc") {
      column.toggleSorting(false); // 降順 → 昇順
    } else if (currentSort === "asc") {
      column.clearSorting(); // 昇順 → ソート解除
    } else {
      column.toggleSorting(true); // 未ソート → 降順（デフォルト）
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        className="-ml-3 h-8"
        onClick={handleToggleSort}
        size="sm"
        type="button"
        variant="ghost"
      >
        <span>{title}</span>
        <SortIcon direction={column.getIsSorted()} />
      </Button>
    </div>
  );
}
