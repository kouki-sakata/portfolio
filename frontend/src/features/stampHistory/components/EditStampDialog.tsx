import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@/components/ui/toast";
import { updateStamp } from "@/features/stampHistory/api";
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
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
    mutationFn: updateStamp,
    onMutate: async (variables) => {
      // キャンセルして進行中のリフェッチを防ぐ
      await queryClient.cancelQueries({ queryKey: ["stamp-history"] });

      // 前の値をスナップショット
      const previousData = queryClient.getQueriesData({
        queryKey: ["stamp-history"],
      });

      // 楽観的更新
      queryClient.setQueriesData({ queryKey: ["stamp-history"] }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          entries: old.entries?.map((e: StampHistoryEntry) =>
            e.id === variables.id
              ? { ...e, inTime: variables.inTime, outTime: variables.outTime }
              : e
          ),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // エラー時はロールバック
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast({
        title: "エラー",
        description: "打刻の更新に失敗しました",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "打刻を更新しました",
      });
      onOpenChange(false);
    },
    onSettled: () => {
      // 成功・失敗に関わらずキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["stamp-history"] });
    },
  });

  const onSubmit = (data: EditStampFormData) => {
    mutation.mutate({
      id: data.id,
      inTime: data.inTime || undefined,
      outTime: data.outTime || undefined,
    });
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
