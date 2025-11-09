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

  const handleClick = () => {
    const currentSort = column.getIsSorted();

    if (currentSort === false) {
      // ソートされていない → 降順
      column.toggleSorting(true);
    } else if (currentSort === "desc") {
      // 降順 → 昇順
      column.toggleSorting(false);
    } else {
      // 昇順 → 降順
      column.toggleSorting(true);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        className="-ml-3 h-8"
        size="sm"
        variant="ghost"
        onClick={handleClick}
      >
        <span>{title}</span>
        <SortIcon direction={column.getIsSorted()} />
      </Button>
    </div>
  );
}
