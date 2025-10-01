/**
 * EnhancedFormField コンポーネント
 * React Hook FormのFormFieldを拡張し、リアルタイムバリデーション、
 * 視覚的フィードバック、アクセシビリティ強化を提供
 */

import { AlertCircle } from "lucide-react";
import { memo } from "react";
import type {
  Control,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  Path,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type EnhancedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> = {
  /**
   * React Hook Form のコントロール
   */
  control: Control<TFieldValues>;

  /**
   * フィールド名（FieldPath型）
   */
  name: FieldPath<TFieldValues>;

  /**
   * フィールドのラベル
   */
  label: string;

  /**
   * フィールドの説明テキスト（オプション）
   */
  description?: string;

  /**
   * 入力コンポーネントをレンダリングする関数
   * fieldとfieldStateを受け取り、入力コンポーネントを返す
   */
  children: (
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>,
    fieldState: { error?: { message?: string } }
  ) => React.ReactElement;
};

/**
 * EnhancedFormFieldContent - useFormField フックを使用する内部コンポーネント
 *
 * @remarks
 * このコンポーネントはメモ化されており、props が変更されない限り再レンダリングされません。
 * FormControl が aria-invalid および aria-describedby 属性を自動的に処理します。
 */
const EnhancedFormFieldContentInner = <
  TFieldValues extends FieldValues = FieldValues,
>({
  field,
  fieldState,
  description,
  children,
}: {
  field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  fieldState: { error?: { message?: string } };
  description?: string;
  children: (
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>,
    fieldState: { error?: { message?: string } }
  ) => React.ReactElement;
}) => (
  <>
    <FormControl>{children(field, fieldState)}</FormControl>
    {fieldState.error && (
      <AlertCircle
        aria-hidden="true"
        className="pointer-events-none absolute top-9 right-3 h-4 w-4 text-destructive"
        role="img"
      />
    )}
    {description && <FormDescription>{description}</FormDescription>}
    <FormMessage />
  </>
);

EnhancedFormFieldContentInner.displayName = "EnhancedFormFieldContent";

// メモ化バージョン
const EnhancedFormFieldContent = memo(
  EnhancedFormFieldContentInner
) as typeof EnhancedFormFieldContentInner;

/**
 * EnhancedFormField コンポーネント
 *
 * 機能:
 * - リアルタイムバリデーションフィードバック
 * - エラー時の視覚的フィードバック（アイコン、赤枠）
 * - アクセシビリティ強化（aria-invalid、aria-describedby）
 * - shadcn/ui FormFieldパターン準拠
 *
 * @remarks
 * このコンポーネントは React Hook Form の FormField をラップし、
 * 以下の機能を追加します：
 * - エラーアイコンの自動表示
 * - aria-invalid 属性の自動設定
 * - aria-describedby 属性の自動設定
 *
 * @example
 * ```tsx
 * <EnhancedFormField
 *   control={form.control}
 *   name="email"
 *   label="メールアドレス"
 *   description="有効なメールアドレスを入力してください"
 * >
 *   {(field) => (
 *     <Input {...field} type="email" />
 *   )}
 * </EnhancedFormField>
 * ```
 */
export function EnhancedFormField<
  TFieldValues extends FieldValues = FieldValues,
>({
  control,
  name,
  label,
  description,
  children,
}: EnhancedFormFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="relative">
          <FormLabel>{label}</FormLabel>
          <EnhancedFormFieldContent
            description={description}
            field={field}
            fieldState={fieldState}
          >
            {children}
          </EnhancedFormFieldContent>
        </FormItem>
      )}
    />
  );
}

EnhancedFormField.displayName = "EnhancedFormField";
