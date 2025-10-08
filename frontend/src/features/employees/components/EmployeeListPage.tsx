import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
} from "@/shared/components/loading/skeletons/SkeletonVariants";
import type { EmployeeSummary } from "../../auth/types";
import {
  useCreateEmployee,
  useDeleteEmployees,
  useUpdateEmployee,
} from "../hooks/useEmployeeMutations";
import { useEmployees } from "../hooks/useEmployees";
import type { EmployeeFormValues } from "../schemas/employeeSchema";
import { EmployeeForm } from "./EmployeeForm";
import { EmployeeTable } from "./EmployeeTable";

type FormMode = "create" | "update" | null;

/**
 * 従業員一覧画面コンポーネント
 *
 * @remarks
 * - useEmployeesフックでデータフェッチング
 * - EmployeeTableコンポーネントで一覧表示
 * - EmployeeFormコンポーネントで作成/更新
 * - 一括削除機能
 *
 * タスク12の実装要件:
 * - ✅ EmployeeListPageコンポーネント
 * - ✅ useEmployeesQueryでデータフェッチ
 * - ✅ 検索フィルター（DataTableに統合済み）
 * - ✅ 一括選択と削除機能
 */
export function EmployeeListPage() {
  const { toast } = useToast();

  // データフェッチング
  const { data, isLoading, isError } = useEmployees();

  // Mutations
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployees();

  // フォーム状態管理
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeSummary | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // 新規作成モード
  const handleCreateNew = () => {
    setFormMode("create");
    setEditingEmployee(null);
  };

  // 編集モード
  const handleEdit = (employee: EmployeeSummary) => {
    setFormMode("update");
    setEditingEmployee(employee);
  };

  // フォームキャンセル
  const handleCancelForm = () => {
    setFormMode(null);
    setEditingEmployee(null);
  };

  // フォーム送信
  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password as string,
          admin: values.admin,
        });
        toast({
          title: "成功",
          description: "従業員を登録しました",
        });
      } else if (formMode === "update" && editingEmployee) {
        await updateMutation.mutateAsync({
          id: editingEmployee.id,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password || undefined,
          admin: values.admin,
        });
        toast({
          title: "成功",
          description: "従業員情報を更新しました",
        });
      }
      setFormMode(null);
      setEditingEmployee(null);
    } catch (error) {
      toast({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 単一削除
  const handleDelete = async (employeeId: number) => {
    // TODO: カスタムダイアログに置き換える
    if (!confirm("この従業員を削除しますか？")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(employeeId);
      toast({
        title: "成功",
        description: "従業員を削除しました",
      });
    } catch (_error) {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 一括削除
  const handleBulkDelete = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "警告",
        description: "削除する従業員を選択してください",
        variant: "destructive",
      });
      return;
    }

    // TODO: カスタムダイアログに置き換える
    if (
      !confirm(
        `選択した${selectedEmployeeIds.length}名の従業員を削除しますか？`
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(selectedEmployeeIds);
      toast({
        title: "成功",
        description: `${selectedEmployeeIds.length}名の従業員を削除しました`,
      });
      setSelectedEmployeeIds([]);
    } catch (_error) {
      toast({
        title: "エラー",
        description: "一括削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  // ローディング状態
  if (isLoading || !data) {
    return <EmployeeListSkeleton />;
  }

  // エラー状態
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 font-bold text-2xl">エラーが発生しました</h2>
          <p className="text-muted-foreground">
            従業員情報の読み込みに失敗しました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">従業員管理</h1>
          <p className="text-muted-foreground">
            従業員の登録・更新・削除を行えます
          </p>
        </div>
        <div className="flex gap-2">
          {selectedEmployeeIds.length > 0 && (
            <Button
              disabled={deleteMutation.isPending}
              onClick={handleBulkDelete}
              variant="destructive"
            >
              選択した{selectedEmployeeIds.length}名を削除
            </Button>
          )}
          <Button onClick={handleCreateNew}>新規登録</Button>
        </div>
      </div>

      {/* フォーム表示エリア */}
      {formMode && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-xl">
            {formMode === "create" ? "新規登録" : "従業員情報の編集"}
          </h2>
          <EmployeeForm
            defaultValues={editingEmployee ?? undefined}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            mode={formMode}
            onCancel={handleCancelForm}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* テーブル */}
      <EmployeeTable
        data={data.employees}
        loading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onSelectionChange={setSelectedEmployeeIds}
      />
    </div>
  );
}

const EmployeeListSkeleton = () => (
  <div
    className="container mx-auto space-y-6 py-6"
    data-testid="employee-list-skeleton"
  >
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-28" />
    </div>

    <SkeletonCard className="bg-card" />

    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <SkeletonForm className="max-w-3xl" fields={3} showButton />
    </div>

    <SkeletonTable className="bg-card" columns={5} rows={5} showHeader />
  </div>
);
