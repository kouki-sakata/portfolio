import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileMetadataFormValues } from "@/features/profile/types";

// biome-ignore lint/suspicious/noControlCharactersInRegex: XSS対策のため制御文字を意図的に検出
const FORBIDDEN_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/;

const MIN_SUBMIT_SPINNER_DURATION_MS = 200;

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
  location: createFieldSchema(256, "勤務地"),
  manager: createFieldSchema(256, "上長"),
  workStyle: z.enum(["remote", "hybrid", "onsite"]),
  scheduleStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
  scheduleEnd: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
  scheduleBreakMinutes: z.number().min(0, "0以上の数値を入力してください"),
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
  const {
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileMetadataFormValues>({
    resolver: zodResolver(profileMetadataSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const isMountedRef = useRef(true);
  const [isPendingSubmit, setIsPendingSubmit] = useState(false);
  const pendingSubmitStartedAtRef = useRef<number | null>(null);
  const pendingDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isProcessing = isSubmitting || isPendingSubmit;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      pendingSubmitStartedAtRef.current = null;
      if (pendingDelayTimerRef.current) {
        clearTimeout(pendingDelayTimerRef.current);
        pendingDelayTimerRef.current = null;
      }
    },
    []
  );

  const waitForMinimumProcessingTime = () => {
    const startedAt = pendingSubmitStartedAtRef.current;

    if (startedAt === null) {
      return Promise.resolve();
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed >= MIN_SUBMIT_SPINNER_DURATION_MS) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      pendingDelayTimerRef.current = setTimeout(() => {
        pendingDelayTimerRef.current = null;
        resolve();
      }, MIN_SUBMIT_SPINNER_DURATION_MS - elapsed);
    });
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsPendingSubmit(true);
    pendingSubmitStartedAtRef.current = Date.now();

    try {
      await onSubmit(values);
    } finally {
      await waitForMinimumProcessingTime();
      pendingSubmitStartedAtRef.current = null;

      if (isMountedRef.current) {
        setIsPendingSubmit(false);
      }
    }
  });

  return (
    <form
      aria-label="プロフィール編集フォーム"
      className="grid gap-4 py-4"
      onSubmit={handleFormSubmit}
    >
      <fieldset className="grid gap-4" disabled={isProcessing}>
        <div className="grid gap-2">
          <Label htmlFor="profile-department">部署</Label>
          <Input
            data-testid="department-input"
            id="profile-department"
            {...register("department")}
            placeholder="例: プロダクト開発部"
          />
          {errors.department ? (
            <p className="text-destructive text-sm">
              {errors.department.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-employee-number">社員番号</Label>
          <Input
            id="profile-employee-number"
            {...register("employeeNumber")}
            placeholder="例: EMP-0001"
          />
          {errors.employeeNumber ? (
            <p className="text-destructive text-sm">
              {errors.employeeNumber.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-address">住所</Label>
          <Input
            id="profile-address"
            {...register("address")}
            placeholder="例: 東京都千代田区丸の内1-1-1"
          />
          {errors.address ? (
            <p className="text-destructive text-sm">{errors.address.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-location">勤務地</Label>
            <Input
              id="profile-location"
              {...register("location")}
              placeholder="例: 大阪/梅田 (JST)"
            />
            {errors.location ? (
              <p className="text-destructive text-sm">
                {errors.location.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-manager">上長</Label>
            <Input
              id="profile-manager"
              {...register("manager")}
              placeholder="例: 田中 太郎"
            />
            {errors.manager ? (
              <p className="text-destructive text-sm">
                {errors.manager.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="profile-work-style">勤務形態</Label>
            <Select
              defaultValue={defaultValues.workStyle}
              onValueChange={(value) =>
                setValue("workStyle", value as "remote" | "hybrid" | "onsite")
              }
            >
              <SelectTrigger id="profile-work-style">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">フルリモート</SelectItem>
                <SelectItem value="hybrid">ハイブリッド</SelectItem>
                <SelectItem value="onsite">出社</SelectItem>
              </SelectContent>
            </Select>
            {errors.workStyle ? (
              <p className="text-destructive text-sm">
                {errors.workStyle.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-schedule-start">始業</Label>
            <Input
              id="profile-schedule-start"
              {...register("scheduleStart")}
              placeholder="09:30"
            />
            {errors.scheduleStart ? (
              <p className="text-destructive text-sm">
                {errors.scheduleStart.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-schedule-end">終業</Label>
            <Input
              id="profile-schedule-end"
              {...register("scheduleEnd")}
              placeholder="18:30"
            />
            {errors.scheduleEnd ? (
              <p className="text-destructive text-sm">
                {errors.scheduleEnd.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-break-minutes">休憩(分)</Label>
          <Input
            id="profile-break-minutes"
            type="number"
            {...register("scheduleBreakMinutes", { valueAsNumber: true })}
            placeholder="60"
          />
          {errors.scheduleBreakMinutes ? (
            <p className="text-destructive text-sm">
              {errors.scheduleBreakMinutes.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-activity-note">メモ</Label>
          <Textarea
            id="profile-activity-note"
            {...register("activityNote")}
            placeholder="担当領域や連絡事項を記録できます"
            rows={4}
          />
          {errors.activityNote ? (
            <p className="text-destructive text-sm">
              {errors.activityNote.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Button className="rounded-2xl" disabled={isProcessing} type="submit">
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                data-testid="spinner"
              />
              保存中…
            </span>
          ) : (
            "保存"
          )}
        </Button>
        {onCancel ? (
          <Button
            className="rounded-2xl"
            disabled={isProcessing}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            キャンセル
          </Button>
        ) : null}
      </div>
    </form>
  );
};
