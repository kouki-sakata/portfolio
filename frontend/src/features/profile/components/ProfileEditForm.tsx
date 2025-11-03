import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileMetadataFormValues } from "@/features/profile/types";

const FORBIDDEN_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/;

const createFieldSchema = (
  max: number,
  fieldLabel: string,
  allowMultiline = false
) =>
  z
    .string()
    .transform((value) => value.trim())
    .superRefine((value, ctx) => {
      if (value.length > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldLabel}は${max}文字以内で入力してください`,
        });
      }

      if (FORBIDDEN_CHAR_PATTERN.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "スクリプトや制御文字は入力できません",
        });
      }

      if (!allowMultiline && value.includes("\n")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "改行は使用できません",
        });
      }
    });

const profileMetadataSchema = z.object({
  address: createFieldSchema(256, "住所"),
  department: createFieldSchema(256, "部署"),
  employeeNumber: createFieldSchema(256, "社員番号"),
  activityNote: createFieldSchema(1000, "活動メモ", true),
});

export type ProfileEditFormProps = {
  defaultValues: ProfileMetadataFormValues;
  onSubmit: (values: ProfileMetadataFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export const ProfileEditForm = ({
  defaultValues,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) => {
  const form = useForm<ProfileMetadataFormValues>({
    resolver: zodResolver(profileMetadataSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form
      aria-label="プロフィール編集フォーム"
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <fieldset className="grid gap-6" disabled={isSubmitting}>
        <div className="grid gap-2">
          <Label htmlFor="profile-department">部署</Label>
          <Input
            data-testid="department-input"
            id="profile-department"
            {...form.register("department")}
            placeholder="例: プロダクト開発部"
          />
          {form.formState.errors.department ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.department.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-employee-number">社員番号</Label>
          <Input
            id="profile-employee-number"
            {...form.register("employeeNumber")}
            placeholder="例: EMP-0001"
          />
          {form.formState.errors.employeeNumber ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.employeeNumber.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-address">住所</Label>
          <Input
            id="profile-address"
            {...form.register("address")}
            placeholder="例: 東京都千代田区丸の内1-1-1"
          />
          {form.formState.errors.address ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.address.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-activity-note">活動メモ</Label>
          <Textarea
            id="profile-activity-note"
            {...form.register("activityNote")}
            placeholder="担当領域や連絡事項を記録できます"
            rows={4}
          />
          {form.formState.errors.activityNote ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.activityNote.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            onClick={onCancel}
            type="button"
            variant="outline"
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        ) : null}
        <Button
          disabled={isSubmitting}
          type="submit"
          variant="default"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                data-testid="spinner"
              />
              更新中…
            </span>
          ) : (
            "更新する"
          )}
        </Button>
      </div>
    </form>
  );
};
