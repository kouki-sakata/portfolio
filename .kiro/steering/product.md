# TeamDevelop Bravo 製品概要

## 製品概要

React + Spring Boot SPAベースのモバイルフレンドリーな勤怠管理システム。PostgreSQLマイグレーション完了、モダンな技術スタックで再構築。

## コア機能

### 認証・勤怠管理
- セッションベース認証（8時間有効、CSRF保護）
- Web打刻（ATTENDANCE/DEPARTURE、夜勤対応、二重打刻防止）
- 打刻履歴管理（月次集計、編集・削除、カレンダー表示）
- CSV/TSV/Excel-CSV大量データエクスポート（Shift-JIS with BOM、バッチ処理最大1000件）

### 従業員・ダッシュボード
- TanStack Tableによる高性能検索・ソート
- レスポンシブダッシュボード（お知らせ・打刻統合）
- ホームダッシュボードのリアルタイム時刻パネル（JST固定クロック + 打刻カード連携）
- ロールベースアクセス制御

### お知らせ・ログ管理
- お知らせCRUD・公開切り替え・バルク操作（管理者専用、REST API完全実装）
- ロールベース表示（ADMIN: 全操作、EMPLOYEE: 閲覧のみ）
- システムログ照会・検索・監査証跡
- React Queryによる楽観的更新・キャッシュ管理
- TanStack Table統合（ソート・フィルタ・行選択）

### プロフィール管理
- ユーザープロフィール閲覧・編集（従業員自身/管理者）
- メタデータ管理（JSONB格納、部署・住所・勤務スタイル・勤務時間等）
- アクティビティ履歴（閲覧・更新の監査証跡、ページネーション対応）
- ロールベースアクセス制御（自身は閲覧・編集可、管理者は全員アクセス可）
- DDD（Domain-Driven Design）アーキテクチャによる柔軟な実装

### 勤怠申請ワークフロー（2025-11-15 E2E実装）
- `StampRequestRestController` が `/api/stamp-requests` 以下に作成・個人一覧・保留一覧・詳細・承認/却下/取消・バルク承認/却下エンドポイントを提供し、Spring Securityで `hasRole('ADMIN')` を強制。`StampRequestListResponse/StampRequestResponse` でUI専用フィールド（氏名、epoch timestamp）まで返却する。
- `StampRequestRegistrationService`（理由/時刻/重複検証）、`ApprovalService`（PENDINGのみ更新）、`CancellationService`、`BulkOperationService`（MAX 50件 + 部分成功）、`QueryService`（検索/ソート/名前キャッシュ）が `StampRequestStore` 経由で MyBatis とインメモリを差し替え可能にし、テストと本番で同一ファサードを保つ。
- Flyway `V7__create_stamp_request_table.sql` が `stamp_request_status` ENUM、スナップショット列、`idx_stamp_request_employee_status` + `idx_stamp_request_status_created` + partial unique index を追加し、`update_stamp_request_updated_at` トリガーで監査フィールドを自動更新。
- React側は `RequestCorrectionModal`/`RequestStatusBadge` を打刻一覧と共有し、`MyRequestsPage`（3ペイン + ⌘K）、`PendingRequestsRoute`（管理者向けフィルタ + Rechartsなしリスト）が `useWorkflowFilters` + `useMyStampRequestsQuery` + `invalidateWorkflowCaches` で stampHistory と stampRequests の Cache 一貫性を保つ。

## 主要な価値提案

### 技術的優位性
- React 19 + Spring Boot 3.4によるモダンSPA
- PostgreSQL 16 + MyBatisのスケーラブル設計
- TypeScript 5.8 strict mode（Branded Types、Template Literal Types活用）
- OpenAPI駆動開発（フロント/バック型同期）
- shadcn/ui@canary + Tailwind CSS 4
- Biome統合によるコード品質管理
- React Query 5キャッシング、Vite 7コード分割
- Feature Flag API + React Context による shadcn/ui 切替（フォールバックUI付きで段階導入を可能にする）
- GlobalErrorHandler + QueryClient エラーフックで一貫した Toast/リダイレクト制御
- 500+ ユニットテスト（Vitest、Playwright E2E）

### ビジネス価値
- 業務効率化、コンプライアンス対応
- 勤怠データ自動化によるコスト削減

## パフォーマンス目標

- ページ読み込み: 2秒以内
- API応答時間: p95 200ms以内
- 同時接続: 1000ユーザー以上
- バンドルサイズ: JavaScript 300KB以下

## 実装状況

### 完了済み
- ✅ React 19 SPA化、PostgreSQL 16移行、Docker Compose環境
- ✅ 認証・従業員・打刻API完全実装
- ✅ React Router 7、shadcn/ui@canary、Tailwind CSS 4
- ✅ Biome統合、TanStack Table、OpenAPI型生成
- ✅ React Query、MSW統合テスト、Playwright E2E
- ✅ パフォーマンス監視（Lighthouse CI）
- ✅ お知らせ管理機能完全実装（2025-10-28 最終更新）
  - REST API（CRUD、公開管理、バルク削除/公開切り替え）
  - ロールベースアクセス制御（@PreAuthorize、管理者専用）
  - View Model変換パターン（API型→UI型、派生データ生成）
  - TanStack Table統合（ソート・フィルタ・行選択、DataTable共通コンポーネント）
  - 選択状態管理の分離（useNewsSelection、Set型による効率的管理）
  - バルクAPI：部分成功対応、最大100件処理、失敗ID保持
  - React Query楽観的更新（onMutate/onError/onSettled）
  - Zod バリデーション（フロント/バック同期）、包括的テスト完備
- ✅ 打刻履歴管理機能完全実装
  - REST API（履歴取得、編集・削除）
  - SOLID原則サービス分離（StampHistoryPersistence、OutTimeAdjuster等）
  - カスタムフック統合（useStampHistoryExport）
  - CSV/TSV/Excel-CSVバッチエクスポート（大量データ対応）
  - 月次統計計算、編集・削除ダイアログ、包括的テスト完備
- ✅ ホーム打刻クロック機能（2025-11-03 更新）
  - useHomeClockでJSTタイムゾーン固定のISOタイムスタンプを生成
  - HomeClockPanelとStampCardで打刻直前の時刻キャプチャを共有し、API送信とUI表示の時刻差を最小化
  - クロック更新に失敗した場合はフェールオーバーメッセージへ切替え、操作をガイド
- ✅ モダンUI Feature Flag レイヤー整備（2025-10-20）
  - `/api/public/feature-flags` エンドポイント + FeatureFlagService でプロファイル別フラグを提供
  - FeatureFlagProvider + UI Wrapper で shadcn/ui とカスタムUIを安全にトグル
  - ModernUI/Legacy プロファイルの統合テスト（MockMvc）で常時 true を保証
- ✅ グローバルエラーハンドリング基盤
  - GlobalErrorHandler + Toast + error-logger による例外分類と通知整流
  - authEvents + QueryClient エラーフックで 401/403 を自動リダイレクト & セッションリセット
  - RouteLoader でプリフェッチと権限制御（redirect + トースト）を共通化
- ✅ プロフィール管理機能完全実装（2025-11-03 最終更新）
  - DDD（Domain-Driven Design）アーキテクチャの採用
  - Application Service層（ProfileAppService）によるユースケース制御
  - Domain Model層（Aggregate、Value Objects、Command/Query Objects）
  - Repository層（JSONB直接操作、MyBatis不使用）
  - View Model変換パターン（3つの変換関数: Overview/Form/Activity）
  - アクティビティ履歴のページネーション対応
  - 変更差分追跡（ProfileChangeSet）と監査ログ記録
  - 包括的テストカバレッジ（8コンポーネントすべてにテスト完備）
- ✅ プロフィール勤怠統計API公開（2025-11-07）
  - `UserProfileRestController#getSelfStatistics` が `ProfileAppService#getProfileStatistics` を単一ソースとして参照し、Attendance summary + monthly breakdown を1レスポンスで返却
  - Recharts 3.3.0（ProfileSummaryCard/ProfileMonthlyDetailCard/MiniStat）が `profileApi.fetchProfileStatistics` 経由でデータ同期し、UI側は `ProfileStatisticsResponse` に依存
  - 旧 `ProfileAttendanceStatisticsService` は削除済みで、集計ロジックは `StampHistoryMapper.findMonthlyStatistics` + 通常カラム参照に収束
- ✅ 勤怠申請ワークフロー API + DB 実装（2025-11-15）
  - `StampRequestRestController` が create/my/pending/detail/approve/reject/cancel/bulk 操作を1コントローラーに集約し、Spring Securityで `@PreAuthorize`（ADMIN限定）と `SecurityUtil` を組み合わせて権限制御。
  - `StampRequestRegistrationService`/`ApprovalService`/`CancellationService`/`BulkOperationService`/`QueryService` が `StampRequestStore` 経由で MyBatis ↔ インメモリ永続化を切り替え、理由/時刻/重複検証や MAX 50 件のバルク制限をビジネスルールとして保持。
  - Flyway `V7__create_stamp_request_table.sql` が ENUM・スナップショット列・部分一意インデックス + updated_at トリガーを導入し、`StampRequestMapper.xml` + DTO（`StampRequestResponse/ListResponse`）が UI に必要な氏名/epoch timestamp を整形。MockMvc（`StampRequestRestControllerTest`）がAPIハッピーパス/権限制御を網羅。

### 開発中/計画中
- 🔄 E2Eテスト拡充（継続中）
  - お知らせ管理 Playwright テスト（news-management.spec.ts、現在スキップ状態）
- ⚠️ 勤怠申請ワークフロー OpenAPI/型同期
  - Spring Boot 側は `/api/stamp-requests/**` を公開済みだが、`openapi/openapi.yaml` に当該パス・スキーマが未登録のため `npm run generate:api` で型が生成されず、`features/stampRequestWorkflow/types.ts` が手書きで乖離。
  - Stamp request DTO を OpenAPI に追加し、contract test (`-PenableOpenApiContract`) と `@hey-api/openapi-ts`/`openapi-zod-client` の再生成を完了するまで本番公開前のギャップ扱い（specチケット化が必要）。
- 📋 管理者分析ダッシュボード、勤怠承認ワークフロー
- 📋 外部システム連携API、プッシュ通知、生体認証
- 📋 お知らせ管理のリッチテキストエディタ統合（現在はTextarea）

---
*Last Updated: 2025-11-15 (勤怠申請API実装とOpenAPIギャップ警告を反映)*
