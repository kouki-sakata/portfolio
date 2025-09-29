import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { fetchStampHistory } from "@/features/stampHistory/api";
import type { StampHistoryResponse } from "@/features/stampHistory/types";
import { PageLoader } from "@/shared/components/layout/PageLoader";

const STAMP_HISTORY_KEY = ["stamp-history"] as const;

export const StampHistoryPage = () => {
  const [filters, setFilters] = useState<{ year?: string; month?: string }>({});

  const query = useQuery<StampHistoryResponse>({
    queryKey: [...STAMP_HISTORY_KEY, filters],
    queryFn: () => fetchStampHistory(filters),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await query.refetch();
  };

  if (query.isLoading) {
    return <PageLoader label="打刻履歴を読み込み中" />;
  }

  if (query.isError) {
    return <p>履歴を取得できませんでした。</p>;
  }

  const data: StampHistoryResponse = query.data ?? {
    selectedYear: filters.year ?? "",
    selectedMonth: filters.month ?? "",
    years: [],
    months: [],
    entries: [],
  };

  const selectedYear: string = filters.year ?? data.selectedYear;
  const selectedMonth: string = filters.month ?? data.selectedMonth;

  return (
    <section className="history">
      <header className="history__header">
        <h1>打刻履歴</h1>
        <p>対象年月を指定して打刻履歴を確認できます。</p>
      </header>

      <form
        className="history__filters"
        onSubmit={(event) => {
          handleSubmit(event).catch(() => {
            // エラーハンドリングは handleSubmit 内で処理済み
          });
        }}
      >
        <label className="history__label" htmlFor="year">
          年
        </label>
        <select
          className="history__select"
          id="year"
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, year: event.target.value }));
          }}
          value={selectedYear}
        >
          {data.years.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>

        <label className="history__label" htmlFor="month">
          月
        </label>
        <select
          className="history__select"
          id="month"
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, month: event.target.value }));
          }}
          value={selectedMonth}
        >
          {data.months.map((monthOption) => (
            <option key={monthOption} value={monthOption}>
              {monthOption}
            </option>
          ))}
        </select>

        <button className="button" disabled={query.isRefetching} type="submit">
          {query.isRefetching ? "更新中…" : "検索"}
        </button>
      </form>

      <div className="history__table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>日付</th>
              <th>曜日</th>
              <th>出勤時刻</th>
              <th>退勤時刻</th>
              <th>更新日時</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.length === 0 ? (
              <tr>
                <td className="history-table__empty" colSpan={5}>
                  対象期間の打刻はありません。
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => (
                <tr
                  key={`${entry.year ?? "----"}-${entry.month ?? "--"}-${entry.day ?? "--"}`}
                >
                  <td>
                    {entry.year}/{entry.month}/{entry.day}
                  </td>
                  <td>{entry.dayOfWeek}</td>
                  <td>{entry.inTime ?? "-"}</td>
                  <td>{entry.outTime ?? "-"}</td>
                  <td>{entry.updateDate ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
