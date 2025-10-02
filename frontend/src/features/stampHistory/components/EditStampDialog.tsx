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
import { useUpdateStampMutation } from "@/features/stampHistory/hooks/useStampHistoryMutations";
import {
  type EditStampFormData,
  EditStampSchema,
  type StampHistoryEntry,
} from "@/features/stampHistory/types";

type EditStampDialogProps = {
  entry: StampHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditStampDialog = ({
  entry,
  open,
  onOpenChange,
}: EditStampDialogProps) => {
  const mutation = useUpdateStampMutation();

  const form = useForm<EditStampFormData>({
    resolver: zodResolver(EditStampSchema),
    defaultValues: {
      id: entry?.id ?? 0,
      inTime: entry?.inTime ?? "",
      outTime: entry?.outTime ?? "",
    },
  });

  // Reset form when entry changes
  if (entry && form.getValues().id !== entry.id) {
    form.reset({
      id: entry.id ?? 0,
      inTime: entry.inTime ?? "",
      outTime: entry.outTime ?? "",
    });
  }

  const onSubmit = (data: EditStampFormData) => {
    mutation.mutate(
      {
        id: data.id,
        inTime: data.inTime || undefined,
        outTime: data.outTime || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!entry) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>打刻編集</DialogTitle>
          <DialogDescription>
            {entry.year}/{entry.month}/{entry.day}の打刻を編集します
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              form
                .handleSubmit(onSubmit)(event)
                .catch(() => {
                  // エラーハンドリングはmutation内で処理済み
                });
            }}
          >
            <FormField
              control={form.control}
              name="inTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出勤時刻</FormLabel>
                  <FormControl>
                    <Input placeholder="09:00" type="time" {...field} />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>退勤時刻</FormLabel>
                  <FormControl>
                    <Input placeholder="18:00" type="time" {...field} />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
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
                {mutation.isPending ? "更新中..." : "更新"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
