import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  useCreateNewsMutation,
  useUpdateNewsMutation,
} from "@/features/news/hooks/useNews";
import type { NewsResponse } from "@/types";

const newsFormSchema = z.object({
  newsDate: z
    .string()
    .min(1, { message: "お知らせ日付は必須です" })
    .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
      message: "お知らせ日付はYYYY-MM-DD形式で入力してください",
    })
    .refine((date) => !Number.isNaN(Date.parse(date)), {
      message: "有効な日付を入力してください",
    }),
  content: z
    .string()
    .min(1, { message: "内容は必須です" })
    .max(1000, { message: "内容は1000文字以内で入力してください" }),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

type NewsFormModalProps = {
  mode: "create" | "edit";
  news?: NewsResponse;
  open: boolean;
  onClose: () => void;
};

const defaultValues: NewsFormValues = {
  newsDate: "",
  content: "",
};

const newsDateErrorId = "newsDate-error";
const contentErrorId = "content-error";

export const NewsFormModal = ({
  mode,
  news,
  open,
  onClose,
}: NewsFormModalProps) => {
  const createMutation = useCreateNewsMutation();
  const updateMutation = useUpdateNewsMutation();

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      return;
    }

    if (mode === "edit" && news) {
      form.reset({
        newsDate: news.newsDate,
        content: news.content,
      });
      return;
    }

    if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [form, mode, news, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (typeof window === "undefined") {
      form.setFocus("newsDate");
      return;
    }

    const timer = window.setTimeout(() => {
      form.setFocus("newsDate");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, open]);

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
      } else if (mode === "edit" && news) {
        await updateMutation.mutateAsync({ id: news.id, data: values });
      }

      onClose();
      form.reset(defaultValues);
    } catch (error) {
      // ミューテーションでハンドリング済みだが、開発時のデバッグのためログ出力
      console.error("News form submission error:", {
        mode,
        newsId: news?.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const dialogTitle = mode === "create" ? "お知らせを作成" : "お知らせを編集";
  const newsDateError = form.formState.errors.newsDate?.message;
  const contentError = form.formState.errors.content?.message;
  const newsDateDescribedBy = newsDateError ? newsDateErrorId : undefined;
  const contentDescribedBy = contentError ? contentErrorId : undefined;

  return (
    <Dialog onOpenChange={(next) => !next && onClose()} open={open}>
      <DialogContent className="sm:-translate-x-1/2 sm:-translate-y-1/2 top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none bg-background p-6 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            必須項目を入力して「保存」をクリックしてください。
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-1 flex-col gap-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newsDate">お知らせ日付</Label>
            <Input
              aria-describedby={newsDateDescribedBy}
              aria-invalid={form.formState.errors.newsDate ? "true" : "false"}
              id="newsDate"
              type="date"
              {...form.register("newsDate")}
            />
            {form.formState.errors.newsDate ? (
              <p
                aria-live="polite"
                className="text-destructive text-sm"
                id={newsDateErrorId}
                role="alert"
              >
                {newsDateError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              aria-describedby={contentDescribedBy}
              aria-invalid={form.formState.errors.content ? "true" : "false"}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="content"
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p
                aria-live="polite"
                className="text-destructive text-sm"
                id={contentErrorId}
                role="alert"
              >
                {contentError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              className="h-12 min-h-11 sm:h-9"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              キャンセル
            </Button>
            <Button
              className="h-12 min-h-11 sm:h-9"
              disabled={isSubmitting}
              type="submit"
            >
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
