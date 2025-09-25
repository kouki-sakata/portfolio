export interface StampHistoryEntry {
  id: number | null
  year: string | null
  month: string | null
  day: string | null
  dayOfWeek: string | null
  inTime: string | null
  outTime: string | null
  updateDate: string | null
}

export interface StampHistoryResponse {
  selectedYear: string
  selectedMonth: string
  years: string[]
  months: string[]
  entries: StampHistoryEntry[]
}
