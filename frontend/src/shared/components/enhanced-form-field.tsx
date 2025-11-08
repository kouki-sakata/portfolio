/**
 * EnhancedFormField コンポーネント
 * React Hook FormのFormFieldを拡張し、リアルタイムバリデーション、
 * 視覚的フィードバック、アクセシビリティ強化を提供
 */

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
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  children: (
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>,
    fieldState: { error?: { message?: string } }
  ) => React.ReactElement;
};

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
    {description && <FormDescription>{description}</FormDescription>}
    <FormMessage />
  </>
);

EnhancedFormFieldContentInner.displayName = "EnhancedFormFieldContent";

const EnhancedFormFieldContent = memo(
  EnhancedFormFieldContentInner
) as typeof EnhancedFormFieldContentInner;

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
