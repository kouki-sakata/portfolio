import { z } from "zod";

/**
 * 従業員スキーマのベース定義（リファインメントなし）
 *
 * @remarks
 * このベーススキーマは、createEmployeeSchemaとupdateEmployeeSchemaの基礎として使用されます。
 * リファインメントを適用する前にスキーマを拡張するため、ZodEffects型の問題を回避できます。
 */
const baseEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "名は必須です" })
    .max(50, { message: "名は50文字以内で入力してください" }),
  lastName: z
    .string()
    .min(1, { message: "姓は必須です" })
    .max(50, { message: "姓は50文字以内で入力してください" }),
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
  admin: z.boolean(),
});

/**
 * 新規作成用Zodスキーマ（passwordは必須）
 *
 * @remarks
 * baseEmployeeSchemaを拡張してpasswordフィールドを必須に上書きします。
 */
export const createEmployeeSchema = baseEmployeeSchema.extend({
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください" })
    .max(100, { message: "パスワードは100文字以内で入力してください" }),
});

/**
 * 更新用Zodスキーマ（passwordは任意）
 *
 * @remarks
 * 更新時はpasswordを変更する場合のみ入力すればよいため、baseEmployeeSchemaをそのまま使用します。
 */
export const updateEmployeeSchema = baseEmployeeSchema;

/**
 * 従業員フォーム用Zodバリデーションスキーマ
 *
 * @remarks
 * 汎用フォーム用のスキーマ。必要に応じてリファインメントを追加できます。
 * 現在は updateEmployeeSchema と同じ定義です。
 */
export const employeeFormSchema = baseEmployeeSchema;

/**
 * TypeScript型の自動推論
 */
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type CreateEmployeeValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeValues = z.infer<typeof updateEmployeeSchema>;
