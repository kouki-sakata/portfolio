import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import type { StampHistoryEntry } from "@/features/stampHistory/types";

type CalendarViewProps = {
  entries: StampHistoryEntry[];
  selectedYear: string;
  selectedMonth: string;
  onDateSelect?: (date: Date) => void;
};

type CalendarDayProps = {
  date: Date;
  stampMap: Map<string, StampHistoryEntry>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const CalendarDay = ({ date, stampMap, ...props }: CalendarDayProps) => {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const entry = stampMap.get(dateKey);
  const hasStamp = entry?.inTime || entry?.outTime;

  return (
    <button
      type="button"
      {...props}
      className={`
        ${props.className}
        ${hasStamp ? "bg-primary/10 font-semibold" : ""}relative`}
    >
      {date.getDate()}
      {hasStamp && (
        <span className="-translate-x-1/2 absolute bottom-0 left-1/2 h-1 w-1 rounded-full bg-primary" />
      )}
    </button>
  );
};

export const CalendarView = ({
  entries,
  selectedYear,
  selectedMonth,
  onDateSelect,
}: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // 打刻データを日付でマッピング
  const stampMap = new Map<string, StampHistoryEntry>();
  for (const entry of entries) {
    if (entry.year && entry.month && entry.day) {
      const key = `${entry.year}-${entry.month.padStart(2, "0")}-${entry.day.padStart(2, "0")}`;
      stampMap.set(key, entry);
    }
  }

  // 選択された年月の初日を取得
  const year = Number.parseInt(selectedYear, 10);
  const month = Number.parseInt(selectedMonth, 10) - 1; // 0-indexed
  const currentMonth = new Date(year, month, 1);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  // 選択された日付の打刻情報を取得
  const selectedEntry = selectedDate
    ? stampMap.get(
        `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      )
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">カレンダー表示</h3>
        <Calendar
          className="rounded-md border"
          components={{
            Day: (props) => (
              <CalendarDay {...props} date={props.day.date} stampMap={stampMap} />
            ),
          }}
          mode="single"
          month={currentMonth}
          onSelect={handleDateSelect}
          selected={selectedDate}
        />
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">詳細情報</h3>

        {selectedDate && selectedEntry ? (
          <div className="space-y-4">
            <div>
              <span className="text-muted-foreground text-sm">日付</span>
              <p className="font-medium text-lg">
                {selectedEntry.year}/{selectedEntry.month}/{selectedEntry.day}（
                {selectedEntry.dayOfWeek}）
              </p>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">出勤時刻</span>
              <p className="font-medium text-lg">
                {selectedEntry.inTime || "未打刻"}
              </p>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">退勤時刻</span>
              <p className="font-medium text-lg">
                {selectedEntry.outTime || "未打刻"}
              </p>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">更新日時</span>
              <p className="font-medium text-lg">
                {selectedEntry.updateDate || "-"}
              </p>
            </div>
          </div>
        ) : selectedDate ? (
          <p className="text-muted-foreground">
            この日付の打刻記録はありません
          </p>
        ) : (
          <p className="text-muted-foreground">
            カレンダーから日付を選択してください
          </p>
        )}
      </Card>
    </div>
  );
};
