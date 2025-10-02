import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteStampMutation } from "@/features/stampHistory/hooks/useStampHistoryMutations";
import type { StampHistoryEntry } from "@/features/stampHistory/types";

type DeleteStampDialogProps = {
  entry: StampHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DeleteStampDialog = ({
  entry,
  open,
  onOpenChange,
}: DeleteStampDialogProps) => {
  const mutation = useDeleteStampMutation();

  const handleDelete = () => {
    if (entry?.id) {
      mutation.mutate(
        { id: entry.id },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>打刻削除の確認</AlertDialogTitle>
          <AlertDialogDescription>
            {entry.year}/{entry.month}/{entry.day}の打刻を削除します。
            <br />
            この操作は取り消せません。本当に削除しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={handleDelete}
          >
            {mutation.isPending ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
