import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue = unknown> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue = unknown>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const renderSortIcon = () => {
    const sortDirection = column.getIsSorted();
    if (sortDirection === "desc") {
      return <ArrowDownIcon className="ml-2 size-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUpIcon className="ml-2 size-4" />;
    }
    return <ChevronsUpDownIcon className="ml-2 size-4" />;
  };

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
            {renderSortIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => column.toggleSorting(false)}
          >
            <ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
            昇順
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => column.toggleSorting(true)}
          >
            <ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
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
