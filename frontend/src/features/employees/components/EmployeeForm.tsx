import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EmployeeSummary } from "@/features/auth/types";
import {
  createEmployeeSchema,
  type EmployeeFormValues,
  updateEmployeeSchema,
} from "../schemas/employeeSchema";

export type EmployeeFormProps = {
  /**
   * 初期値（更新モードの場合）
   */
  defaultValues?: Partial<EmployeeSummary>;

  /**
   * フォーム送信時のコールバック
   */
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;

  /**
   * キャンセルボタンのコールバック
   */
  onCancel?: () => void;

  /**
   * 送信中の状態
   */
  isSubmitting?: boolean;

  /**
   * モード（新規作成 or 更新）
   */
  mode?: "create" | "update";
};

/**
 * 従業員作成・更新フォームコンポーネント
 *
 * @remarks
 * - React Hook Form + Zod統合
 * - shadcn/ui Formコンポーネントを使用
 * - 新規作成時はpasswordが必須、更新時は任意
 *
 * @example
 * ```tsx
 * // 新規作成
 * <EmployeeForm
 *   mode="create"
 *   onSubmit={handleCreate}
 * />
 *
 * // 更新
 * <EmployeeForm
 *   mode="update"
 *   defaultValues={employee}
 *   onSubmit={handleUpdate}
 * />
 * ```
 */
export function EmployeeForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
}: EmployeeFormProps) {
  // modeに応じて適切なスキーマを選択
  const schema =
    mode === "create" ? createEmployeeSchema : updateEmployeeSchema;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      password: "",
      admin: defaultValues?.admin ?? false,
    },
    mode: "onChange", // リアルタイムバリデーション
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleFormSubmit}>
        {/* 名 */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名</FormLabel>
              <FormControl>
                <Input placeholder="太郎" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 姓 */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓</FormLabel>
              <FormControl>
                <Input placeholder="山田" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* メールアドレス */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  placeholder="example@example.com"
                  type="email"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* パスワード */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                パスワード
                {mode === "update" && " (変更する場合のみ)"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    mode === "create"
                      ? "8文字以上で入力してください"
                      : "変更する場合のみ入力"
                  }
                  type="password"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              {mode === "update" && (
                <FormDescription>
                  空欄のままにすると、パスワードは変更されません
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 管理者権限 */}
        <FormField
          control={form.control}
          name="admin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  disabled={isSubmitting}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>管理者権限</FormLabel>
                <FormDescription>
                  管理者として登録する場合はチェックしてください
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* アクションボタン */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              disabled={isSubmitting}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              キャンセル
            </Button>
          )}
          <Button disabled={isSubmitting} type="submit">
            {(() => {
              if (isSubmitting) {
                return "処理中...";
              }
              return mode === "create" ? "登録する" : "更新する";
            })()}
          </Button>
        </div>
      </form>
    </Form>
  );
}
