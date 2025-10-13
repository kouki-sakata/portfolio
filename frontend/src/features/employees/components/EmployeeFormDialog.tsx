import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmployeeSummary } from "@/features/auth/types";
import type { EmployeeFormValues } from "../schemas/employeeSchema";
import { EmployeeForm } from "./EmployeeForm";

type EmployeeFormDialogProps = {
  /**
   * フォームモード
   */
  mode: "create" | "update" | null;

  /**
   * 編集対象の従業員（更新モードの場合）
   */
  employee: EmployeeSummary | null;

  /**
   * ダイアログの開閉状態
   */
  open: boolean;

  /**
   * ダイアログの開閉状態変更コールバック
   */
  onOpenChange: (open: boolean) => void;

  /**
   * フォーム送信時のコールバック
   */
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;

  /**
   * 送信中の状態
   */
  isSubmitting?: boolean;
};

/**
 * 従業員作成・編集ダイアログコンポーネント
 *
 * @remarks
 * - Radix UI Dialogを使用したモーダル表示
 * - StampHistoryPageのEditStampDialogパターンを踏襲
 * - 既存のEmployeeFormコンポーネントを再利用
 *
 * @example
 * ```tsx
 * <EmployeeFormDialog
 *   mode={formMode}
 *   employee={editingEmployee}
 *   open={formMode !== null}
 *   onOpenChange={(open) => {
 *     if (!open) {
 *       setFormMode(null);
 *       setEditingEmployee(null);
 *     }
 *   }}
 *   onSubmit={handleSubmit}
 *   isSubmitting={createMutation.isPending || updateMutation.isPending}
 * />
 * ```
 */
export const EmployeeFormDialog = ({
  mode,
  employee,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: EmployeeFormDialogProps) => {
  if (!mode) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "新規登録" : "従業員情報の編集"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "新しい従業員を登録します"
              : "従業員情報を更新します"}
          </DialogDescription>
        </DialogHeader>

        <EmployeeForm
          defaultValues={employee ?? undefined}
          isSubmitting={isSubmitting}
          mode={mode}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
