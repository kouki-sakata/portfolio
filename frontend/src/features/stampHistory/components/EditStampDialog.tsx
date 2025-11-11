import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createStamp, updateStamp } from "@/features/stampHistory/api";
import {
  type EditStampFormData,
  EditStampSchema,
  type StampHistoryEntry,
} from "@/features/stampHistory/types";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/shared/api/errors";
import { queryKeys } from "@/shared/utils/queryUtils";

type EditStampDialogProps = {
  entry: StampHistoryEntry | null;
  year?: string;
  month?: string;
  day?: string;
  employeeId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditStampDialog = ({
  entry,
  year,
  month,
  day,
  employeeId,
  open,
  onOpenChange,
}: EditStampDialogProps) => {
  const queryClient = useQueryClient();
  const isCreateMode = !entry?.id;

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

  // Reset form when dialog opens or entry changes
  useEffect(() => {
    if (open) {
      form.reset({
        id: entry?.id ?? 0,
        inTime: entry?.inTime ?? "",
        outTime: entry?.outTime ?? "",
        breakStartTime: entry?.breakStartTime ?? "",
        breakEndTime: entry?.breakEndTime ?? "",
        isNightShift: entry?.isNightShift ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id, open]);

  const createMutation = useMutation({
    mutationFn: createStamp,
    onError: (error) => {
      let errorMessage = "打刻の作成に失敗しました";
      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "打刻を作成しました",
      });
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stampHistory.all,
      });
    },
  });

  const updateMutation = useMutation({
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
    onError: (error, _variables, context) => {
      // エラー時はロールバック
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      // エラーメッセージを抽出
      let errorMessage = "打刻の更新に失敗しました";
      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: "エラー",
        description: errorMessage,
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
    if (isCreateMode) {
      // 新規作成モード
      if (!year || !month || !day || !employeeId) {
        toast({
          title: "エラー",
          description: "日付情報が不足しています",
          variant: "destructive",
        });
        return;
      }

      createMutation.mutate({
        employeeId,
        year,
        month,
        day,
        inTime: data.inTime || undefined,
        outTime: data.outTime || undefined,
        breakStartTime: data.breakStartTime || undefined,
        breakEndTime: data.breakEndTime || undefined,
        ...(data.isNightShift !== undefined && { isNightShift: data.isNightShift }),
      });
    } else {
      // 編集モード
      if (!entry?.id) {
        toast({
          title: "エラー",
          description: "編集対象のIDが不足しています",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate({
        id: entry.id,
        inTime: data.inTime || undefined,
        outTime: data.outTime || undefined,
        // 空文字列も送信する（|| を使わない）
        breakStartTime: data.breakStartTime,
        breakEndTime: data.breakEndTime,
        ...(data.isNightShift !== undefined && { isNightShift: data.isNightShift }),
      });
    }
  };

  const mutation = isCreateMode ? createMutation : updateMutation;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "打刻新規作成" : "打刻編集"}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? `${year}/${month}/${day}の打刻を作成します`
              : `${entry?.year}/${entry?.month}/${entry?.day}の打刻を編集します`}
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
                {mutation.isPending
                  ? (isCreateMode ? "作成中..." : "更新中...")
                  : (isCreateMode ? "作成" : "更新")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
