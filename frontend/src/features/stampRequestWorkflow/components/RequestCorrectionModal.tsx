import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StampHistoryEntry } from "@/features/stampHistory/types";
import { useCreateStampRequestMutation } from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import { stampRequestCreateSchema } from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";
import type { StampRequestCreatePayload } from "@/features/stampRequestWorkflow/types";

type RequestCorrectionModalProps = {
  entry: StampHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RequestCorrectionForm = {
  stampHistoryId: number;
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
  stampHistoryId: values.stampHistoryId,
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
    await mutation.mutateAsync(normalizePayload(values));
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>打刻修正リクエスト</DialogTitle>
          <DialogDescription>
            選択した打刻レコードの修正内容と理由を入力してください。
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(handleSubmitForm)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestedInTime">出勤時刻</Label>
              <Input
                aria-label="出勤時刻"
                id="requestedInTime"
                type="time"
                {...form.register("requestedInTime")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedOutTime">退勤時刻</Label>
              <Input
                aria-label="退勤時刻"
                id="requestedOutTime"
                type="time"
                {...form.register("requestedOutTime")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedBreakStartTime">休憩開始</Label>
              <Input
                aria-label="休憩開始"
                id="requestedBreakStartTime"
                type="time"
                {...form.register("requestedBreakStartTime")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedBreakEndTime">休憩終了</Label>
              <Input
                aria-label="休憩終了"
                id="requestedBreakEndTime"
                type="time"
                {...form.register("requestedBreakEndTime")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">修正理由</Label>
            <Textarea
              aria-label="修正理由"
              id="reason"
              placeholder="修正が必要な理由を詳しく記入してください"
              rows={4}
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            ) : null}
          </div>

          {form.formState.errors.requestedOutTime ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.requestedOutTime.message}
            </p>
          ) : null}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              キャンセル
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              リクエスト送信
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
