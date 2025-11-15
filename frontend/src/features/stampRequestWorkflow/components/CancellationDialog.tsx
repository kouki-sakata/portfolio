import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelStampRequestMutation } from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import { stampRequestCancellationSchema } from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";

type CancellationDialogProps = {
  requestId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CancellationForm = {
  reason: string;
};

export const CancellationDialog = ({
  requestId,
  open,
  onOpenChange,
}: CancellationDialogProps) => {
  const mutation = useCancelStampRequestMutation();
  const form = useForm<CancellationForm>({
    resolver: zodResolver(stampRequestCancellationSchema),
    defaultValues: { reason: "" },
  });

  const handleSubmitForm = async (values: CancellationForm) => {
    await mutation.mutateAsync({
      requestId,
      reason: values.reason,
    });
    onOpenChange(false);
    form.reset({ reason: "" });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申請を取り消す</DialogTitle>
          <DialogDescription>
            申請を取り消す理由を10文字以上で入力してください。
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmitForm)}
        >
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">取消理由</Label>
            <Textarea
              aria-label="取消理由"
              id="cancel-reason"
              placeholder="例: 誤って重複申請したため取り消します。"
              rows={4}
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.reason.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              閉じる
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              取消を確定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
