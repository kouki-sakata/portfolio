import type { EmployeeSummary } from "@/features/auth/types";
import type { NewsResponse } from "@/types";

/**
 * テストユーザーを作成するファクトリ
 */
export const createTestUser = (
  overrides?: Partial<EmployeeSummary>
): EmployeeSummary => ({
  id: 1,
  firstName: "太郎",
  lastName: "山田",
  email: "test.user@example.com",
  admin: false,
  ...overrides,
});

/**
 * 管理者ユーザーを作成するファクトリ
 */
export const createAdminUser = (
  overrides?: Partial<EmployeeSummary>
): EmployeeSummary => ({
  id: 1,
  firstName: "太郎",
  lastName: "山田",
  email: "admin.user@example.com",
  admin: true,
  ...overrides,
});

/**
 * 従業員リストを作成するファクトリ
 */
export const createEmployeeList = (
  count: number,
  options?: { startId?: number; adminCount?: number }
): EmployeeSummary[] => {
  const startId = options?.startId ?? 10;
  const adminCount = options?.adminCount ?? 0;
  const employees: EmployeeSummary[] = [];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const isAdmin = i < adminCount;
    employees.push({
      id,
      firstName: `太郎${i + 1}`,
      lastName: `社員${i + 1}`,
      email: `employee${id}@example.com`,
      admin: isAdmin,
    });
  }

  return employees;
};

/**
 * ニュースアイテムを作成するファクトリ
 */
export const createNewsItem = (
  overrides?: Partial<NewsResponse>
): NewsResponse => {
  const now = new Date().toISOString();
  return {
    id: 1,
    title: "テストニュース",
    content: "これはテスト用のニュース記事です。",
    newsDate: now.slice(0, 10),
    label: "GENERAL",
    releaseFlag: false,
    updateDate: now,
    ...overrides,
  };
};

/**
 * ニュースアイテムリストを作成するファクトリ
 */
export const createNewsItemList = (
  count: number,
  options?: { startId?: number; publishedCount?: number }
): NewsResponse[] => {
  const startId = options?.startId ?? 1;
  const publishedCount = options?.publishedCount ?? 0;
  const items: NewsResponse[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const isPublished = i < publishedCount;
    items.push({
      id,
      title: `テストニュース${id}`,
      content: `これはテスト用のニュース記事${id}です。`,
      newsDate: now.slice(0, 10),
      label: "GENERAL",
      releaseFlag: isPublished,
      updateDate: now,
    });
  }

  return items;
};

/**
 * テスト用環境変数
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin.user@example.com",
    password: process.env.E2E_ADMIN_PASSWORD ?? "AdminPass123!",
  },
  user: {
    email: process.env.E2E_USER_EMAIL ?? "test.user@example.com",
    password: process.env.E2E_USER_PASSWORD ?? "TestPass123!",
  },
  invalid: {
    email: "invalid@example.com",
    password: process.env.E2E_INVALID_PASSWORD ?? "WrongPassword!",
  },
} as const;

/**
 * 打刻タイプ
 */
export const STAMP_TYPES = {
  ATTENDANCE: "1", // 出勤
  DEPARTURE: "2", // 退勤
  BREAK_START: "3", // 休憩開始
  BREAK_END: "4", // 休憩終了
} as const;

/**
 * 深夜勤務フラグ
 */
export const NIGHT_WORK_FLAGS = {
  OFF: "0",
  ON: "1",
} as const;

/**
 * テスト用の打刻リクエストを作成
 */
export const createStampRequest = (
  stampType: (typeof STAMP_TYPES)[keyof typeof STAMP_TYPES],
  nightWorkFlag: (typeof NIGHT_WORK_FLAGS)[keyof typeof NIGHT_WORK_FLAGS] = NIGHT_WORK_FLAGS.OFF
) => ({
  stampType,
  stampTime: new Date().toISOString(),
  nightWorkFlag,
});
