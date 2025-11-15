import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Plus, List, CheckCircle, XCircle, Clock, Settings } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand: (command: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSelectCommand }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="コマンドを入力..." />
      <CommandList>
        <CommandEmpty>コマンドが見つかりません</CommandEmpty>
        <CommandGroup heading="アクション">
          <CommandItem onSelect={() => onSelectCommand("new-request")}>
            <Plus className="mr-2 h-4 w-4" />
            <span>新規申請を作成</span>
          </CommandItem>
          <CommandItem onSelect={() => onSelectCommand("view-all")}>
            <List className="mr-2 h-4 w-4" />
            <span>全ての申請を表示</span>
          </CommandItem>
          <CommandItem onSelect={() => onSelectCommand("view-pending")}>
            <Clock className="mr-2 h-4 w-4" />
            <span>保留中の申請を表示</span>
          </CommandItem>
          <CommandItem onSelect={() => onSelectCommand("view-approved")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>承認済みの申請を表示</span>
          </CommandItem>
          <CommandItem onSelect={() => onSelectCommand("view-rejected")}>
            <XCircle className="mr-2 h-4 w-4" />
            <span>却下された申請を表示</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="設定">
          <CommandItem onSelect={() => onSelectCommand("settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>設定を開く</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
