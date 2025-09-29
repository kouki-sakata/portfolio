import { z } from "zod";

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

/**
 * ログインフォームの型定義（Zodスキーマから自動推論）
 */
export type LoginFormData = z.infer<typeof loginSchema>;
