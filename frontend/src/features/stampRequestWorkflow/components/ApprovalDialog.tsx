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
import { useApproveRequestMutation } from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import {
  stampRequestApprovalNoteSchema,
} from "@/features/stampRequestWorkflow/schemas/stampRequestSchema";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";

export type ApprovalDialogProps = {
  request: StampRequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ApprovalFormValues = {
  approvalNote?: string;
};

export const ApprovalDialog = ({ request, open, onOpenChange }: ApprovalDialogProps) => {
  const mutation = useApproveRequestMutation();
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(stampRequestApprovalNoteSchema),
    defaultValues: { approvalNote: "" },
  });

  if (!request) {
    return null;
  }

  const handleSubmitForm = async (values: ApprovalFormValues) => {
    try {
      await mutation.mutateAsync({
        requestId: request.id,
        approvalNote: values.approvalNote,
      });
      onOpenChange(false);
      form.reset({ approvalNote: "" });
    } catch (error) {
      const description = isConflictError(error)
        ? "他の管理者が更新しました。最新の状態を確認してください。"
        : "承認処理に失敗しました。";
      toast({
        title: "承認に失敗しました",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申請を承認する</DialogTitle>
          <DialogDescription>
            変更内容と理由を確認し、必要に応じて承認メモを追加してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">従業員</span>
              <span className="font-semibold">{request.employeeName ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ステータス</span>
              <span>{request.status}</span>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground text-xs">勤務時間</p>
            <div className="flex flex-col gap-2">
              <span>原本: {formatRange(request.originalInTime, request.originalOutTime)}</span>
              <span>修正案: {formatRange(request.requestedInTime, request.requestedOutTime)}</span>
            </div>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground text-xs">理由</p>
            <p className="mt-2 whitespace-pre-wrap">{request.reason}</p>
          </div>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(handleSubmitForm)}
          >
            <div className="space-y-2">
              <Label htmlFor="approval-note">承認メモ</Label>
              <Textarea
                id="approval-note"
                placeholder="承認に関する補足があれば入力してください"
                rows={3}
                {...form.register("approvalNote")}
              />
              {form.formState.errors.approvalNote ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.approvalNote.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                閉じる
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                承認を確定
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const formatRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return "--";
  }
  return `${start} - ${end}`;
};

const isConflictError = (error: unknown): boolean => {
  if (typeof error === "object" && error !== null) {
    return (error as { status?: number }).status === 409;
  }
  return false;
};
