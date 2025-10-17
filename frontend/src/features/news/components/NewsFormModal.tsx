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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  title: z
    .string()
    .min(1, { message: "タイトルは必須です" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),
  content: z
    .string()
    .min(1, { message: "内容は必須です" })
    .max(1000, { message: "内容は1000文字以内で入力してください" }),
  category: z.enum(["重要", "システム", "一般"], {
    // biome-ignore lint/style/useNamingConvention: Zod API requires snake_case
    required_error: "カテゴリを選択してください",
  }),
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
  title: "",
  content: "",
  category: "一般",
};

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
        title: news.title,
        content: news.content,
        category: news.category,
      });
      return;
    }

    if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [form, mode, news, open]);

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

  return (
    <Dialog onOpenChange={(next) => !next && onClose()} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            必須項目を入力して「保存」をクリックしてください。
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newsDate">お知らせ日付</Label>
            <Input
              aria-invalid={form.formState.errors.newsDate ? "true" : "false"}
              id="newsDate"
              type="date"
              {...form.register("newsDate")}
            />
            {form.formState.errors.newsDate ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.newsDate.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              aria-invalid={form.formState.errors.title ? "true" : "false"}
              id="title"
              placeholder="お知らせのタイトルを入力してください"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              aria-invalid={form.formState.errors.content ? "true" : "false"}
              autoResize
              id="content"
              maxHeight="400px"
              placeholder="お知らせの内容を入力してください"
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.content.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select
              defaultValue={form.watch("category")}
              onValueChange={(value) =>
                form.setValue("category", value as "重要" | "システム" | "一般")
              }
              value={form.watch("category")}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="重要">重要</SelectItem>
                <SelectItem value="システム">システム</SelectItem>
                <SelectItem value="一般">一般</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.category.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              キャンセル
            </Button>
            <Button disabled={isSubmitting} type="submit">
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
