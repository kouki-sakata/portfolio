import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStampHistoryExport } from "../hooks/useStampHistoryExport";
import type { ExportFormat, StampHistoryEntry } from "../types";
import { ExportProgress } from "./ExportProgress";

type ExportDialogProps = {
  entries: StampHistoryEntry[];
  disabled?: boolean;
};

export const ExportDialog = ({
  entries,
  disabled = false,
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");

  const { exportData, isExporting, progress } = useStampHistoryExport({
    onSuccess: () => {
      // エクスポート完了後にダイアログを閉じる
      setTimeout(() => setOpen(false), 1000);
    },
  });

  const handleExport = () => {
    exportData({ entries, format });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled || entries.length === 0} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          CSV出力
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>打刻履歴をエクスポート</DialogTitle>
          <DialogDescription>
            表示中の{entries.length}件のデータをファイルに出力します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="format">出力形式</Label>
            <Select
              disabled={isExporting}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              value={format}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (カンマ区切り)</SelectItem>
                <SelectItem value="tsv">TSV (タブ区切り)</SelectItem>
                <SelectItem value="excel-csv">Excel用CSV (BOM付き)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isExporting && <ExportProgress progress={progress} />}
        </div>

        <DialogFooter>
          <Button
            disabled={isExporting}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            キャンセル
          </Button>
          <Button disabled={isExporting} onClick={handleExport}>
            {isExporting ? "エクスポート中..." : "エクスポート"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
