import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { EmployeeSummary } from "@/features/auth/types";
import {
  DataTableColumnHeader,
  DataTableSelectionCheckbox,
} from "@/shared/components/data-table";

type UseEmployeeColumnsProps = {
  onEdit?: (employee: EmployeeSummary) => void;
  onDelete?: (employeeId: number) => void;
};

export function useEmployeeColumns({
  onEdit,
  onDelete,
}: UseEmployeeColumnsProps = {}) {
  return useMemo<ColumnDef<EmployeeSummary>[]>(
    () => [
      {
        id: "select",
        size: 50,
        minSize: 50,
        maxSize: 50,
        header: ({ table }) => (
          <DataTableSelectionCheckbox
            aria-label="全て選択"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <DataTableSelectionCheckbox
            aria-label="行を選択"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        size: 80,
        minSize: 60,
        maxSize: 100,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => <div>{row.getValue("id")}</div>,
      },
      {
        id: "fullName",
        accessorFn: (row) => `${row.lastName} ${row.firstName}`,
        size: 150,
        minSize: 120,
        maxSize: 200,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="氏名" />
        ),
        cell: ({ row }) => {
          const employee = row.original;
          return (
            <div className="flex space-x-2">
              <span className="truncate font-medium">
                {employee.lastName} {employee.firstName}
              </span>
            </div>
          );
        },
        filterFn: (row, _id, value) => {
          const fullName = `${row.original.lastName} ${row.original.firstName}`;
          return fullName.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: "email",
        size: 250,
        minSize: 200,
        maxSize: 350,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="メールアドレス" />
        ),
        cell: ({ row }) => (
          <div className="truncate">
            <a
              className="text-primary hover:underline"
              href={`mailto:${row.getValue("email")}`}
            >
              {row.getValue("email")}
            </a>
          </div>
        ),
      },
      {
        accessorKey: "admin",
        size: 100,
        minSize: 80,
        maxSize: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ロール" />
        ),
        cell: ({ row }) => {
          const isAdmin = row.getValue("admin") as boolean;
          return (
            <div className="flex items-center">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs ${
                  isAdmin
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isAdmin ? "管理者" : "一般"}
              </span>
            </div>
          );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        id: "actions",
        size: 150,
        minSize: 120,
        maxSize: 180,
        header: "操作",
        cell: ({ row }) => {
          const employee = row.original;

          return (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => onEdit(employee)}
                  type="button"
                >
                  編集
                </button>
              )}
              {onDelete && (
                <button
                  className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={() => onDelete(employee.id)}
                  type="button"
                >
                  削除
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit, onDelete]
  );
}
