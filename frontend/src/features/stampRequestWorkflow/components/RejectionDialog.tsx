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
import { useRejectRequestMutation } from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import {
  stampRequestRejectionSchema,
} from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";

export type RejectionDialogProps = {
  request: StampRequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type RejectionFormValues = {
  rejectionReason: string;
};

export const RejectionDialog = ({ request, open, onOpenChange }: RejectionDialogProps) => {
  const mutation = useRejectRequestMutation();
  const form = useForm<RejectionFormValues>({
    resolver: zodResolver(stampRequestRejectionSchema),
    defaultValues: { rejectionReason: "" },
  });

  if (!request) {
    return null;
  }

  const handleSubmitForm = async (values: RejectionFormValues) => {
    try {
      await mutation.mutateAsync({
        requestId: request.id,
        rejectionReason: values.rejectionReason,
      });
      onOpenChange(false);
      form.reset({ rejectionReason: "" });
    } catch (error) {
      const description = isConflictError(error)
        ? "他の管理者が処理済みのため却下できませんでした。"
        : "却下処理に失敗しました。";
      toast({
        title: "却下に失敗しました",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申請を却下する</DialogTitle>
          <DialogDescription>
            却下理由を10文字以上で入力し、申請者へ通知します。
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmitForm)}>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">却下理由</Label>
            <Textarea
              aria-label="却下理由"
              id="rejection-reason"
              placeholder="証跡と一致しないため却下します。"
              rows={4}
              {...form.register("rejectionReason")}
            />
            {form.formState.errors.rejectionReason ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.rejectionReason.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              閉じる
            </Button>
            <Button disabled={mutation.isPending} type="submit" variant="destructive">
              却下を確定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const isConflictError = (error: unknown): boolean => {
  if (typeof error === "object" && error !== null) {
    return (error as { status?: number }).status === 409;
  }
  return false;
};
