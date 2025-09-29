import { useCallback } from "react";

import type { EmployeeSummary } from "@/features/auth/types";
import { useEmployeeColumns } from "@/features/employees/hooks/useEmployeeColumns";
import { DataTable } from "@/shared/components/data-table";

type EmployeeTableProps = {
  data: EmployeeSummary[];
  loading?: boolean;
  onEdit?: (employee: EmployeeSummary) => void;
  onDelete?: (employeeId: number) => void;
  onSelectionChange?: (selectedIds: number[]) => void;
};

export function EmployeeTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  onSelectionChange,
}: EmployeeTableProps) {
  // カラム定義の取得
  const columns = useEmployeeColumns({ onEdit, onDelete });

  // 行選択の変更ハンドラー
  const handleRowSelectionChange = useCallback(
    (selection: Record<string, boolean>) => {
      if (onSelectionChange) {
        const selectedIds = Object.keys(selection)
          .filter((key) => selection[key])
          .map((key) => data[Number.parseInt(key, 10)]?.id)
          .filter(Boolean);
        onSelectionChange(selectedIds);
      }
    },
    [data, onSelectionChange]
  );

  return (
    <div className="w-full space-y-4">
      {/* データテーブル */}
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="従業員データがありません"
        enableColumnVisibility
        enableGlobalFilter
        enableRowSelection
        loading={loading}
        onRowSelectionChange={handleRowSelectionChange}
      />
    </div>
  );
}
