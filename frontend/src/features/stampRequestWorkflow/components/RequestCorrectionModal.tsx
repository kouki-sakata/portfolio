import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import type { StampHistoryEntry } from "@/features/stampHistory/types";
import { useCreateStampRequestMutation } from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import { stampRequestCreateSchema } from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";
import type { StampRequestCreatePayload } from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";

type RequestCorrectionModalProps = {
  entry: StampHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RequestCorrectionForm = {
  stampHistoryId?: number | null;
  requestedInTime?: string | null;
  requestedOutTime?: string | null;
  requestedBreakStartTime?: string | null;
  requestedBreakEndTime?: string | null;
  requestedIsNightShift?: boolean;
  reason: string;
};

const toFormValues = (entry: StampHistoryEntry): RequestCorrectionForm => ({
  stampHistoryId: entry.id ?? 0,
  requestedInTime: entry.inTime ?? "",
  requestedOutTime: entry.outTime ?? "",
  requestedBreakStartTime: entry.breakStartTime ?? "",
  requestedBreakEndTime: entry.breakEndTime ?? "",
  requestedIsNightShift: Boolean(entry.isNightShift),
  reason: "",
});

const normalizePayload = (
  values: RequestCorrectionForm
): StampRequestCreatePayload => ({
  stampHistoryId:
    values.stampHistoryId === 0 ? null : (values.stampHistoryId ?? null),
  requestedInTime: values.requestedInTime || null,
  requestedOutTime: values.requestedOutTime || null,
  requestedBreakStartTime: values.requestedBreakStartTime || null,
  requestedBreakEndTime: values.requestedBreakEndTime || null,
  requestedIsNightShift: values.requestedIsNightShift ?? false,
  reason: values.reason,
});

export const RequestCorrectionModal = ({
  entry,
  open,
  onOpenChange,
}: RequestCorrectionModalProps) => {
  const mutation = useCreateStampRequestMutation();
  const form = useForm<RequestCorrectionForm>({
    resolver: zodResolver(stampRequestCreateSchema),
    defaultValues: entry ? toFormValues(entry) : undefined,
    mode: "onSubmit",
  });

  useEffect(() => {
    form.register("requestedIsNightShift");

    return () => {
      form.unregister("requestedIsNightShift");
    };
  }, [form]);

  useEffect(() => {
    if (entry && open) {
      form.reset(toFormValues(entry));
    }
  }, [entry, form, open]);

  if (!entry) {
    return null;
  }

  const handleSubmitForm = async (values: RequestCorrectionForm) => {
    try {
      await mutation.mutateAsync(normalizePayload(values));
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const description = isConflictError(error)
        ? "既に同じ申請が存在します。最新の状態を確認してください。"
        : "申請に失敗しました。";
      toast({
        title: "申請に失敗しました",
        description,
        variant: "destructive",
      });
    }
  };

  const getSubmitButtonText = () => {
    if (mutation.isPending) {
      return "申請中...";
    }
    return "申請を送信";
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>打刻修正申請</DialogTitle>
          <DialogDescription>
            {entry.year}/{entry.month}/{entry.day}
            の打刻修正を申請します。承認されると反映されます。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              form
                .handleSubmit(handleSubmitForm)(event)
                .catch(() => {
                  // エラーハンドリングはmutation内で処理済み
                });
            }}
          >
            <FormField
              control={form.control}
              name="requestedInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出勤時刻</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="09:00"
                      type="time"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>退勤時刻</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="18:00"
                      type="time"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedBreakStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩開始時刻</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12:00"
                      type="time"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedBreakEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩終了時刻</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="13:00"
                      type="time"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedIsNightShift"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>夜勤</FormLabel>
                    <FormDescription>
                      夜勤の場合はチェックしてください
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>修正理由</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="修正が必要な理由を記入してください"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>承認の判断材料となります</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                キャンセル
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {getSubmitButtonText()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * エラーが409 Conflict かどうかを判定します。
 */
const isConflictError = (error: unknown): boolean => {
  if (typeof error === "object" && error !== null) {
    return (error as { status?: number }).status === 409;
  }
  return false;
};
