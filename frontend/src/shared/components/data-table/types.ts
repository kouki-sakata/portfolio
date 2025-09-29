import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";

export type DataTableProps<TData, TValue = unknown> = {
  /**
   * テーブルのカラム定義
   */
  columns: ColumnDef<TData, TValue>[];

  /**
   * テーブルに表示するデータ
   */
  data: TData[];

  /**
   * ページネーション状態（サーバーサイドページネーション用）
   */
  pagination?: PaginationState;

  /**
   * ページネーション変更時のコールバック
   */
  onPaginationChange?: (pagination: PaginationState) => void;

  /**
   * 総レコード数（サーバーサイドページネーション用）
   */
  totalCount?: number;

  /**
   * ローディング状態
   */
  loading?: boolean;

  /**
   * 行選択を有効にするか
   */
  enableRowSelection?: boolean;

  /**
   * 選択された行が変更されたときのコールバック
   */
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  /**
   * グローバルフィルターを有効にするか
   */
  enableGlobalFilter?: boolean;

  /**
   * カラムの表示制御を有効にするか
   */
  enableColumnVisibility?: boolean;

  /**
   * テーブルの高さを固定するか
   */
  fixedHeight?: string;

  /**
   * 空データ時のメッセージ
   */
  emptyMessage?: string;

  /**
   * 行クリック時のコールバック
   */
  onRowClick?: (row: TData) => void;
};

export type DataTableState = {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  globalFilter: string;
};

export type DataTableColumnHeaderProps<TData, TValue = unknown> = {
  column: Column<TData, TValue>;
  title: string;
};

export type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  totalCount?: number;
};

export type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
};

export type DataTableFacetedFilterProps<TData, TValue = unknown> = {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

/**
 * ソート方向の型
 */
export type SortDirection = "asc" | "desc";

/**
 * フィルターオペレーターの型
 */
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "lessThan"
  | "lessThanOrEqual"
  | "greaterThan"
  | "greaterThanOrEqual";

/**
 * カラムフィルターの型
 */
export type ColumnFilterValue = {
  id: string;
  value: unknown;
  operator?: FilterOperator;
};
