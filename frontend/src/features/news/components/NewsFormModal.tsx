import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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

const newsLabelSchema = z.enum(["IMPORTANT", "SYSTEM", "GENERAL"]);

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
    .max(100, { message: "タイトルは100文字以内で入力してください" }),
  content: z
    .string()
    .min(1, { message: "内容は必須です" })
    .max(1000, { message: "内容は1000文字以内で入力してください" }),
  label: newsLabelSchema,
  releaseFlag: z.boolean(),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

type NewsFormModalProps = {
  mode: "create" | "edit";
  news?: NewsResponse;
  open: boolean;
  onClose: () => void;
};

const labelOptions = [
  { value: "IMPORTANT" as const, display: "重要" },
  { value: "SYSTEM" as const, display: "システム" },
  { value: "GENERAL" as const, display: "一般" },
];

const defaultValues: NewsFormValues = {
  newsDate: "",
  title: "",
  content: "",
  label: "GENERAL",
  releaseFlag: false,
};

const newsDateErrorId = "newsDate-error";
const titleErrorId = "title-error";
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
        title: news.title ?? "",
        content: news.content,
        label: news.label ?? "GENERAL",
        releaseFlag: news.releaseFlag,
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
    } catch (_error) {
      // ミューテーションでハンドリング済み
      // エラーは上位のエラーハンドリングで処理される
    }
  });

  const dialogTitle = mode === "create" ? "お知らせを作成" : "お知らせを編集";
  const newsDateError = form.formState.errors.newsDate?.message;
  const titleError = form.formState.errors.title?.message;
  const contentError = form.formState.errors.content?.message;
  const newsDateDescribedBy = newsDateError ? newsDateErrorId : undefined;
  const titleDescribedBy = titleError ? titleErrorId : undefined;
  const contentDescribedBy = contentError ? contentErrorId : undefined;
  const releaseFlagLabelId = "releaseFlag-label";
  const releaseFlagValue = form.watch("releaseFlag");

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
            <Label htmlFor="title">タイトル</Label>
            <Input
              aria-describedby={titleDescribedBy}
              aria-invalid={form.formState.errors.title ? "true" : "false"}
              id="title"
              maxLength={100}
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p
                aria-live="polite"
                className="text-destructive text-sm"
                id={titleErrorId}
                role="alert"
              >
                {titleError}
              </p>
            ) : null}
          </div>

          <Controller
            control={form.control}
            name="label"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>ラベル</Label>
                <div className="flex flex-wrap gap-4">
                  {labelOptions.map((option) => (
                    <label
                      className="flex items-center gap-2"
                      key={option.value}
                    >
                      <input
                        checked={field.value === option.value}
                        className="h-4 w-4 border-neutral-300 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={() => field.onChange(option.value)}
                        type="radio"
                        value={option.value}
                      />
                      <span
                        className={
                          field.value === option.value ? "font-medium" : ""
                        }
                      >
                        {option.display}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="releaseFlag"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="releaseFlag" id={releaseFlagLabelId}>
                  公開設定
                </Label>
                <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
                  <div>
                    <p className="font-medium">
                      {releaseFlagValue ? "公開中" : "下書き"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {releaseFlagValue
                        ? "保存すると公開一覧に即時反映されます。"
                        : "保存しても公開に切り替わりません。"}
                    </p>
                  </div>
                  <input
                    aria-checked={field.value}
                    aria-labelledby={releaseFlagLabelId}
                    checked={field.value}
                    className="h-5 w-10 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[checked=true]:bg-primary"
                    data-checked={field.value ? "true" : "false"}
                    id="releaseFlag"
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.checked)}
                    role="switch"
                    type="checkbox"
                  />
                </div>
              </div>
            )}
          />

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
