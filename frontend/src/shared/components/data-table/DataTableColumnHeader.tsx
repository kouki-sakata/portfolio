import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            size="sm"
            variant="ghost"
          >
            <span>{title}</span>
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => column.toggleSorting(false)}
          >
            <SpriteIcon
              className="mr-2 size-3.5 text-muted-foreground/70"
              decorative
              name="arrow-up"
            />
            昇順
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => column.toggleSorting(true)}
          >
            <SpriteIcon
              className="mr-2 size-3.5 text-muted-foreground/70"
              decorative
              name="arrow-down"
            />
            降順
          </DropdownMenuItem>
          {column.getIsSorted() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => column.clearSorting()}
              >
                ソート解除
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
