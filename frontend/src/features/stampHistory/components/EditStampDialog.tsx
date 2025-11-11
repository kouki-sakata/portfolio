import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { updateStamp } from "@/features/stampHistory/api";
import {
  type EditStampFormData,
  EditStampSchema,
  type StampHistoryEntry,
} from "@/features/stampHistory/types";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/shared/utils/queryUtils";

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
      breakStartTime: entry?.breakStartTime ?? "",
      breakEndTime: entry?.breakEndTime ?? "",
      isNightShift: entry?.isNightShift ?? undefined,
    },
  });

  // Reset form when entry changes
  if (entry && form.getValues().id !== entry.id) {
    form.reset({
      id: entry.id ?? 0,
      inTime: entry.inTime ?? "",
      outTime: entry?.outTime ?? "",
      breakStartTime: entry?.breakStartTime ?? "",
      breakEndTime: entry?.breakEndTime ?? "",
      isNightShift: entry?.isNightShift ?? undefined,
    });
  }

  const mutation = useMutation({
    mutationFn: updateStamp,
    onMutate: async (variables) => {
      // キャンセルして進行中のリフェッチを防ぐ
      await queryClient.cancelQueries({
        queryKey: queryKeys.stampHistory.all,
      });

      // 前の値をスナップショット
      const previousData = queryClient.getQueriesData({
        queryKey: queryKeys.stampHistory.all,
      });

      // 楽観的更新
      queryClient.setQueriesData<{ entries?: StampHistoryEntry[] }>(
        { queryKey: queryKeys.stampHistory.all },
        (old) => {
          if (!old?.entries) {
            return old;
          }
          return {
            ...old,
            entries: old.entries.map((e) =>
              e.id === variables.id
                ? {
                    ...e,
                    ...(variables.inTime !== undefined && { inTime: variables.inTime || null }),
                    ...(variables.outTime !== undefined && { outTime: variables.outTime || null }),
                    ...(variables.breakStartTime !== undefined && { breakStartTime: variables.breakStartTime || null }),
                    ...(variables.breakEndTime !== undefined && { breakEndTime: variables.breakEndTime || null }),
                    ...(variables.isNightShift !== undefined && { isNightShift: variables.isNightShift }),
                  }
                : e
            ),
          };
        }
      );

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.stampHistory.all,
      });
    },
  });

  const onSubmit = (data: EditStampFormData) => {
    mutation.mutate({
      id: data.id,
      inTime: data.inTime || undefined,
      outTime: data.outTime || undefined,
      breakStartTime: data.breakStartTime || undefined,
      breakEndTime: data.breakEndTime || undefined,
      ...(data.isNightShift !== undefined && { isNightShift: data.isNightShift }),
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

            <FormField
              control={form.control}
              name="breakStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩開始時刻</FormLabel>
                  <FormControl>
                    <Input placeholder="12:00" type="time" {...field} />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breakEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩終了時刻</FormLabel>
                  <FormControl>
                    <Input placeholder="13:00" type="time" {...field} />
                  </FormControl>
                  <FormDescription>HH:MM形式で入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isNightShift"
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
