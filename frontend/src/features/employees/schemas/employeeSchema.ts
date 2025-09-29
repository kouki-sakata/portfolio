import { z } from "zod";

/**
 * 従業員フォーム用Zodバリデーションスキーマ
 *
 * @remarks
 * - 新規作成時: passwordは必須（最小8文字）
 * - 更新時: passwordは任意（変更する場合のみ入力）
 */
export const employeeFormSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "姓は必須です" })
      .max(50, { message: "姓は50文字以内で入力してください" }),
    lastName: z
      .string()
      .min(1, { message: "名は必須です" })
      .max(50, { message: "名は50文字以内で入力してください" }),
    email: z
      .string()
      .min(1, { message: "メールアドレスは必須です" })
      .email({ message: "有効なメールアドレスを入力してください" })
      .max(255, { message: "メールアドレスは255文字以内で入力してください" }),
    password: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください" })
      .max(100, { message: "パスワードは100文字以内で入力してください" })
      .optional()
      .or(z.literal("")),
    admin: z.boolean().default(false),
  })
  .refine(
    (_data) => {
      // 新規作成時（passwordが未設定または空）の場合、passwordは必須ではない
      // この制約はフォームレベルで処理
      return true;
    },
    {
      message: "バリデーションエラー",
    }
  );

/**
 * 新規作成用Zodスキーマ（passwordは必須）
 */
export const createEmployeeSchema = employeeFormSchema.extend({
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください" })
    .max(100, { message: "パスワードは100文字以内で入力してください" }),
});

/**
 * 更新用Zodスキーマ（passwordは任意）
 */
export const updateEmployeeSchema = employeeFormSchema;

/**
 * TypeScript型の自動推論
 */
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type CreateEmployeeValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeValues = z.infer<typeof updateEmployeeSchema>;
