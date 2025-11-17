import { z } from "zod";

const TIME_PATTERN = /^([0-1]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (value?: string | null) => {
  if (!(value && TIME_PATTERN.test(value))) {
    return null;
  }
  const [hours, minutes] = value.split(":");
  return (
    Number.parseInt(hours ?? "0", 10) * 60 + Number.parseInt(minutes ?? "0", 10)
  );
};

const isChronological = (data: {
  requestedInTime?: string | null;
  requestedOutTime?: string | null;
  requestedBreakStartTime?: string | null;
  requestedBreakEndTime?: string | null;
  requestedIsNightShift?: boolean;
}) => {
  const inMinutes = toMinutes(data.requestedInTime);
  const outMinutes = toMinutes(data.requestedOutTime);

  if (inMinutes !== null && outMinutes !== null) {
    const adjustedOut =
      data.requestedIsNightShift && outMinutes <= inMinutes
        ? outMinutes + 24 * 60
        : outMinutes;
    if (adjustedOut <= inMinutes) {
      return false;
    }
  }

  const breakStart = toMinutes(data.requestedBreakStartTime);
  const breakEnd = toMinutes(data.requestedBreakEndTime);

  if (breakStart !== null && breakEnd !== null && breakEnd <= breakStart) {
    return false;
  }

  return true;
};

const timeField = z
  .string()
  .regex(TIME_PATTERN)
  .or(z.literal(""))
  .nullable()
  .optional();

export const stampRequestCreateSchema = z
  .object({
    stampHistoryId: z.number(),
    requestedInTime: timeField,
    requestedOutTime: timeField,
    requestedBreakStartTime: timeField,
    requestedBreakEndTime: timeField,
    requestedIsNightShift: z.boolean().optional(),
    reason: z.string().min(1, "理由は必須です"),
  })
  .refine(isChronological, {
    message: "時刻の前後関係を確認してください",
    path: ["requestedOutTime"],
  });

export const stampRequestCancellationSchema = z.object({
  reason: z
    .string()
    .min(10, "10文字以上500文字以下で理由を入力してください")
    .max(500, "10文字以上500文字以下で理由を入力してください"),
});

export const stampRequestApprovalNoteSchema = z.object({
  approvalNote: z
    .string()
    .max(500, "500文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

export const stampRequestRejectionSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, "理由は10文字以上500文字以下で入力してください")
    .max(500, "理由は10文字以上500文字以下で入力してください"),
});
