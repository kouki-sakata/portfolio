import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
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
import { stampRequestRejectionSchema } from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";
import type {
  StampRequestBulkOperationResult,
  StampRequestBulkPayload,
} from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";

export type BulkRejectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestIds: number[];
  requestCount: number;
  onCompleted?: () => void;
  mutation: UseMutationResult<
    StampRequestBulkOperationResult,
    unknown,
    StampRequestBulkPayload
  >;
};

type BulkRejectionFormValues = {
  rejectionReason: string;
};

export const BulkRejectionDialog = ({
  open,
  onOpenChange,
  requestIds,
  requestCount,
  onCompleted,
  mutation,
}: BulkRejectionDialogProps) => {
  const form = useForm<BulkRejectionFormValues>({
    resolver: zodResolver(stampRequestRejectionSchema),
    defaultValues: { rejectionReason: "" },
  });

  const handleSubmitForm = async (values: BulkRejectionFormValues) => {
    if (!requestIds.length) {
      toast({
        title: "却下対象がありません",
        description: "申請を選択してから実行してください。",
        variant: "destructive",
      });
      return;
    }

    try {
      await mutation.mutateAsync({
        requestIds,
        rejectionReason: values.rejectionReason,
      });
      form.reset({ rejectionReason: "" });
      onCompleted?.();
      onOpenChange(false);
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "操作を完了できませんでした。";
      toast({
        title: "一括却下に失敗しました",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>選択申請を却下する</DialogTitle>
          <DialogDescription>
            {requestCount > 0
              ? `${requestCount}件の申請を一括で却下します。`
              : "申請を選択してください。"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmitForm)}
        >
          <div className="space-y-2">
            <Label htmlFor="bulk-rejection-reason">却下理由</Label>
            <Textarea
              aria-label="却下理由"
              id="bulk-rejection-reason"
              placeholder="例）証跡と一致しないため却下します。"
              rows={4}
              {...form.register("rejectionReason")}
            />
            {form.formState.errors.rejectionReason ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.rejectionReason.message}
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
            <Button
              disabled={mutation.isPending || !requestIds.length}
              type="submit"
              variant="destructive"
            >
              却下を確定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
