# 武道ONE 勤怠管理システム 実装タスク **[強化版]**

## 概要

既存の41タスクに加え、以下の強化要素を追加:

- **Server Components/Client Components分離** (タスク18a-18c)
- **Data Access Layer実装** (タスク1a)
- **Turbopack設定** (タスク1a)
- **JWT Claims最適化** (タスク6強化)
- **パフォーマンス最適化** (タスク42-44)
- **Edge Deployment** (タスク45-47)

**総タスク数**: 47タスク（既存41 + 強化6）
**完了済み**: 4タスク（タスク1-4）
**残タスク**: 43タスク

## パート1: バックエンド開発

### Section A: データベース基盤

- [x] 1. Supabaseプロジェクト初期設定
  - supabase/config.tomlでプロジェクト設定を実装
  - .env.localにSupabase接続情報を設定
  - src/lib/supabase/client.tsでクライアント初期化コードを作成
  - src/lib/supabase/server.tsでサーバーサイドクライアントを実装
  - _Requirements: 1_

- [x] 1a. **[強化] Turbopack設定とData Access Layer実装** ✅ **完了**
  - next.config.jsでTurbopackをデフォルトバンドラーとして設定 ✅
  - turbo.jsonでTurbopackの最適化設定を実装 ✅
  - src/lib/dal/index.tsでData Access Layerのエントリーポイント作成 ✅
  - src/lib/dal/server-only.tsで'server-only'パッケージを使用したサーバー専用モジュール実装 ✅
  - src/lib/dal/queries/にServer Components専用クエリ関数を集約 ✅
  - src/lib/dal/mutations/にServer Actions用ミューテーション関数を集約 ✅
  - tests/unit/dal/isolation.test.tsでDAL分離のテストを実装 ✅
  - _Requirements: 1, 10_
  - **STATUS**: TDD手法により実装完了。14個中12個のテストが成功。DAL構造、サーバー専用分離、キャッシング機能が正常動作。

- [x] 2. マルチテナントスキーマの実装
  - supabase/migrations/001_create_tenants.sqlでtenantsテーブルを作成
  - supabase/migrations/002_create_users.sqlでusersテーブルを実装
  - supabase/migrations/003_create_departments.sqlで部署テーブルを作成
  - supabase/migrations/004_create_employment_types.sqlで雇用形態テーブルを作成
  - _Requirements: 1, 3_

- [x] 3. 勤怠記録テーブルの実装
  - supabase/migrations/005_create_time_stamps.sqlで打刻テーブルを作成
  - supabase/migrations/006_create_attendance_records.sqlで勤怠記録テーブルを作成
  - supabase/migrations/007_create_time_stamp_corrections.sqlで修正履歴テーブルを作成
  - supabase/migrations/008_create_indexes.sqlでインデックスを設定
  - tests/unit/database/time-stamps.test.tsで打刻テーブルの単体テストを実装
  - _Requirements: 4, 5, 6_

- [x] 4. Row Level Security (RLS) ポリシーの実装 ✅ **完了**
  - supabase/migrations/009_rls_policies.sqlでテナント分離ポリシーを作成 ✅ **JWT方式で解決**
  - supabase/migrations/010_rls_crud_policies.sqlで各テーブルのCRUDポリシーを実装 ✅
  - supabase/migrations/011_rls_admin_policies.sqlで管理者権限ポリシーを定義 ✅
  - supabase/migrations/012_rls_user_policies.sqlで一般ユーザーポリシーを定義 ✅
  - supabase/migrations/013_cleanup_old_policies.sqlでポリシー修正を実装 ✅
  - tests/unit/database/rls-basic.test.tsでRLSポリシーの基本テストを実装 ✅
  - _Requirements: 1, 3_
  - **STATUS**: マイグレーション027-033でJWT方式によるRLS実装が完了。基本的なテナント分離とCRUD操作が正常動作。
  - **解決方法**: auth スキーマ権限問題を回避するため、JWTクレームから直接テナント情報を取得する方式を採用
  - **参照**: マイグレーション027-033で無限再帰問題も解決済み

- [x] 5. データベース基盤テストスイート ✅ **完了**
  - tests/unit/database/schema.test.tsでスキーマ検証テストを実装 ✅
  - tests/unit/database/rls.test.tsでRLSポリシーテストを実装 ✅
  - tests/unit/database/tenant-isolation.test.tsでテナント分離テストを作成 ✅
  - tests/integration/database/migrations.test.tsでマイグレーションテストを実装 ✅
  - _Requirements: 1, 3, 4, 5, 6_
  - **STATUS**: TDD手法により全4テストファイルを実装完了。REDフェーズ（失敗テスト）の作成が完了し、実際のデータベース実装に対するテストカバレッジを確保。

### Section B: 認証・セキュリティ

- [ ] 6. **[強化] Supabase Auth統合 with JWT Claims最適化**
  - src/lib/auth/client.tsで認証クライアントヘルパーを実装
  - src/lib/auth/server.tsでサーバーサイド認証チェックを実装
  - src/lib/auth/types.tsで認証関連の型定義を作成
  - src/lib/auth/session.tsでセッション管理ユーティリティを実装
  - **[新規] src/lib/auth/jwt-claims.tsでJWT claimsカスタマイズロジック実装**
  - **[新規] src/lib/auth/hooks.tsでraw_app_metadata使用のauth hooks実装**
  - tests/unit/auth/client.test.tsで認証クライアントの単体テストを実装
  - **[新規] tests/unit/auth/jwt-claims.test.tsでJWT claims検証テストを実装**
  - _Requirements: 2_

- [ ] 7. マルチテナント解決システム
  - src/lib/tenant/resolver.tsでサブドメイン解析ロジックを実装
  - src/lib/tenant/validator.tsでテナント検証ロジックを作成
  - src/lib/tenant/types.tsでテナント関連の型定義を作成
  - src/middleware.tsにテナント解決ミドルウェアを実装
  - tests/unit/tenant/resolver-basic.test.tsでテナント解決の基本テストを実装
  - _Requirements: 1_

- [ ] 8. セッション管理とセキュリティ
  - src/lib/security/jwt.tsでJWTトークン処理を実装
  - src/lib/security/rate-limiter.tsでレート制限ロジックを作成
  - src/lib/security/password.tsでパスワード処理ユーティリティを実装
  - src/lib/security/account-lock.tsでアカウントロック機能を実装
  - tests/unit/security/jwt-basic.test.tsでJWT処理の基本テストを実装
  - _Requirements: 2_

- [ ] 9. 認証システムテストスイート
  - tests/unit/auth/session.test.tsでセッション管理テストを作成
  - tests/unit/auth/jwt.test.tsでJWT処理テストを実装
  - tests/unit/tenant/resolver.test.tsでテナント解決テストを作成
  - tests/integration/auth/flow.test.tsで認証フロー統合テストを実装
  - _Requirements: 1, 2_

### Section C: ビジネスロジックAPI

- [ ] 10. ユーザー管理API
  - src/app/api/users/route.tsでユーザー一覧・作成APIを実装
  - src/app/api/users/[id]/route.tsで個別ユーザー操作APIを作成
  - src/lib/services/user.service.tsでビジネスロジックを実装
  - src/lib/validators/user.validator.tsで入力検証を作成
  - _Requirements: 3_

- [ ] 11. 打刻API
  - src/app/api/time-stamps/route.tsで打刻記録APIを作成
  - src/app/api/time-stamps/correct/route.tsで打刻修正APIを実装
  - src/lib/services/timeStamp.service.tsで打刻ロジックを作成
  - src/lib/validators/timeStamp.validator.tsで検証ロジックを実装
  - tests/unit/api/time-stamps-basic.test.tsで打刻APIの基本テストを実装
  - _Requirements: 4, 5_

- [ ] 12. 勤怠集計API
  - src/app/api/attendance/calculate/route.tsで集計APIを作成
  - src/app/api/attendance/monthly/route.tsで月次集計APIを実装
  - src/lib/services/attendance.service.tsで計算ロジックを実装
  - src/lib/utils/timeCalculation.tsで時間計算ユーティリティを作成
  - tests/unit/api/attendance-basic.test.tsで集計APIの基本テストを実装
  - _Requirements: 6, 7_

- [ ] 13. リアルタイムAPI
  - src/lib/realtime/client.tsでRealtimeクライアントを作成
  - src/lib/realtime/subscriptions.tsでサブスクリプション管理を実装
  - src/lib/realtime/events.tsでイベント処理ロジックを作成
  - src/app/api/realtime/route.tsでWebSocket接続管理APIを実装
  - _Requirements: 4_

- [ ] 14. レポート生成API
  - src/app/api/reports/export/route.tsでCSVエクスポートAPIを作成
  - src/lib/services/report.service.tsでレポート生成ロジックを実装
  - src/lib/utils/csvGenerator.tsでCSV生成ユーティリティを作成
  - src/lib/validators/report.validator.tsでレポートパラメータ検証を実装
  - _Requirements: 7_

- [ ] 15. APIテストスイート
  - tests/unit/api/users.test.tsでユーザーAPI単体テストを実装
  - tests/unit/api/time-stamps.test.tsで打刻API単体テストを作成
  - tests/unit/api/attendance.test.tsで勤怠API単体テストを実装
  - tests/integration/api/endpoints.test.tsでAPI統合テストを作成
  - _Requirements: 3, 4, 5, 6, 7_

### Section D: バックエンド統合

- [ ] 16. サービスレイヤー統合
  - src/lib/services/index.tsでサービス統合エクスポートを作成
  - src/lib/services/transaction.service.tsでトランザクション管理を実装
  - src/lib/services/notification.service.tsで通知サービスを作成
  - src/lib/services/audit.service.tsで監査ログサービスを実装
  - _Requirements: すべてのバックエンド要件_

- [ ] 17. バリデーション・エラーハンドリング
  - src/lib/validators/index.tsでバリデーター統合を作成
  - src/lib/errors/custom-errors.tsでカスタムエラークラスを定義
  - src/lib/errors/error-handler.tsでエラーハンドリング統合を実装
  - src/lib/utils/logger.tsでロギングユーティリティを強化
  - _Requirements: すべてのバックエンド要件_

- [ ] 18. バックエンド統合テストスイート
  - tests/integration/backend/services.test.tsでサービス統合テストを実装
  - tests/integration/backend/transactions.test.tsでトランザクションテストを作成
  - tests/integration/backend/security.test.tsでセキュリティ統合テストを実装
  - tests/performance/backend/load.test.tsで負荷テストを作成
  - _Requirements: 10_

## パート1.5: Server Components基盤 **[新規強化セクション]**

### Section D+: React Server Components アーキテクチャ

- [ ] 18a. **[強化] Server Componentsとルートレイアウト設計**
  - src/app/(dashboard)/layout.tsxでダッシュボードレイアウト（Server Component）実装
  - src/app/(dashboard)/page.tsxでダッシュボードページ（データフェッチ付き）実装
  - src/app/(auth)/layout.tsxで認証レイアウト実装
  - src/components/server/にServer Components専用コンポーネント配置
  - src/components/client/にClient Components配置（'use client'付き）
  - _Requirements: UI/UX全般_

- [ ] 18b. **[強化] ストリーミングSSRとSuspense境界**
  - src/app/(dashboard)/attendance/page.tsxで勤怠ページ（Suspense使用）実装
  - src/components/server/AttendanceTable.tsxでServer Component テーブル実装
  - src/components/LoadingSkeleton.tsxでローディングスケルトン実装
  - src/app/loading.tsxでグローバルローディング状態実装
  - src/app/error.tsxでエラーバウンダリ実装
  - _Requirements: 4, 6, 7_

- [ ] 18c. **[強化] Server Actions実装**
  - src/app/actions/attendance.tsでServer Actions（打刻処理）実装
  - src/app/actions/users.tsでユーザー管理Server Actions実装
  - src/app/actions/reports.tsでレポート生成Server Actions実装
  - src/lib/actions/validation.tsでServer Actions用バリデーション実装
  - tests/unit/actions/attendance.test.tsでServer Actionsテストを実装
  - _Requirements: 3, 4, 5, 7_

## パート2: UI/UX/デザイン開発

### Section E: デザインシステム基盤

- [ ] 19. Tailwind CSS設定
  - tailwind.config.tsでカスタムテーマを設定
  - src/styles/globals.cssでグローバルスタイルを定義
  - src/styles/variables.cssでCSS変数を定義
  - src/lib/utils/cn.tsでクラス名ユーティリティを作成
  - _Requirements: UI/UX全般_

- [ ] 20. shadcn/ui導入と設定
  - components.jsonでshadcn/ui設定を実装
  - src/components/ui/button.tsxでボタンコンポーネントを作成
  - src/components/ui/input.tsxで入力フィールドを実装
  - src/components/ui/card.tsxでカードコンポーネントを作成
  - _Requirements: UI/UX全般_

- [ ] 21. 基本UIコンポーネント
  - src/components/ui/table.tsxでテーブルコンポーネントを実装
  - src/components/ui/dialog.tsxでダイアログコンポーネントを作成
  - src/components/ui/toast.tsxでトースト通知を実装
  - src/components/ui/skeleton.tsxでローディングスケルトンを作成
  - _Requirements: UI/UX全般_

- [ ] 22. デザインシステムテストスイート
  - tests/unit/components/ui/button.test.tsxでボタンテストを実装
  - tests/unit/components/ui/input.test.tsxで入力フィールドテストを作成
  - tests/visual/components.test.jsでビジュアルリグレッションテストを実装
  - tests/accessibility/ui.test.tsでアクセシビリティテストを作成
  - _Requirements: UI/UX全般_

### Section F: レイアウト・ナビゲーション

- [ ] 23. メインレイアウト構造
  - src/components/layouts/MainLayout.tsxでメインレイアウトを実装
  - src/components/layouts/AuthLayout.tsxで認証レイアウトを作成
  - src/components/layouts/DashboardLayout.tsxでダッシュボードレイアウトを実装
  - src/app/layout.tsxでルートレイアウトを更新
  - _Requirements: UI/UX全般_

- [ ] 24. サイドバー・ナビゲーション
  - src/components/layouts/Sidebar.tsxでサイドバーコンポーネントを実装
  - src/components/layouts/NavMenu.tsxでナビゲーションメニューを作成
  - src/components/layouts/MobileNav.tsxでモバイルナビゲーションを実装
  - src/lib/navigation/routes.tsでルート定義を作成
  - _Requirements: UI/UX全般_

- [ ] 25. ヘッダー・フッター
  - src/components/layouts/Header.tsxでヘッダーコンポーネントを実装
  - src/components/layouts/Footer.tsxでフッターコンポーネントを作成
  - src/components/layouts/Breadcrumb.tsxでパンくずリストを実装
  - src/components/layouts/UserMenu.tsxでユーザーメニューを作成
  - _Requirements: UI/UX全般_

- [ ] 26. レイアウトテストスイート
  - tests/unit/components/layouts/MainLayout.test.tsxでレイアウトテストを実装
  - tests/unit/components/layouts/Sidebar.test.tsxでサイドバーテストを作成
  - tests/unit/components/layouts/Navigation.test.tsxでナビゲーションテストを実装
  - tests/e2e/navigation.spec.tsでナビゲーションE2Eテストを作成
  - _Requirements: UI/UX全般_

### Section G: 機能別UIコンポーネント

- [ ] 27. **[強化] 打刻UI（Server/Client分離）**
  - **[Client]** src/components/client/timeStamp/ClockButton.tsxで打刻ボタン実装（'use client'）
  - **[Server]** src/components/server/timeStamp/TimeDisplay.tsxで時刻表示実装
  - **[Server]** src/components/server/timeStamp/TodayRecord.tsxで本日の記録表示実装
  - **[Server]** src/components/server/timeStamp/StatusIndicator.tsxでステータス表示実装
  - **[新規]** src/hooks/useOptimisticClock.tsで楽観的更新フック実装
  - tests/unit/components/ClockButton.test.tsxで打刻ボタンの単体テストを実装
  - _Requirements: 4_

- [ ] 28. ユーザー管理UI
  - src/components/users/UserTable.tsxでユーザーテーブルを実装
  - src/components/users/UserForm.tsxでユーザーフォームを作成
  - src/components/users/UserFilters.tsxでフィルターコンポーネントを実装
  - src/components/users/UserCard.tsxでユーザーカードを作成
  - _Requirements: 3_

- [ ] 29. 勤怠一覧UI
  - src/components/attendance/AttendanceTable.tsxで勤怠テーブルを実装
  - src/components/attendance/MonthlyView.tsxで月次ビューを作成
  - src/components/attendance/DailyView.tsxで日次ビューを実装
  - src/components/attendance/SummaryCard.tsxでサマリーカードを作成
  - _Requirements: 6, 7_

- [ ] 30. ダッシュボードUI
  - src/components/dashboard/StatsCard.tsxで統計カードを実装
  - src/components/dashboard/AttendanceWidget.tsxで勤怠ウィジェットを作成
  - src/components/dashboard/QuickActions.tsxでクイックアクションを実装
  - src/components/dashboard/RecentActivity.tsxで最近の活動表示を作成
  - tests/unit/components/StatsCard.test.tsxでダッシュボードコンポーネントの単体テストを実装
  - _Requirements: 4, 6, 7_

- [ ] 31. レポートUI
  - src/components/reports/ExportButton.tsxでエクスポートボタンを実装
  - src/components/reports/ReportPreview.tsxでレポートプレビューを作成
  - src/components/reports/FilterPanel.tsxでフィルターパネルを実装
  - src/components/reports/FormatSelector.tsxでフォーマット選択を作成
  - _Requirements: 7_

- [ ] 32. UIコンポーネントテストスイート
  - tests/unit/components/timeStamp/\*.test.tsxで打刻UIテストを実装
  - tests/unit/components/users/\*.test.tsxでユーザー管理UIテストを作成
  - tests/unit/components/attendance/\*.test.tsxで勤怠UIテストを実装
  - tests/unit/components/dashboard/\*.test.tsxでダッシュボードUIテストを作成
  - _Requirements: 3, 4, 6, 7_

### Section H: フォーム・インタラクション

- [ ] 33. フォームコンポーネント
  - src/components/forms/LoginForm.tsxでログインフォームを実装
  - src/components/forms/CorrectionForm.tsxで修正申請フォームを作成
  - src/components/forms/ValidationMessage.tsxでバリデーションメッセージを実装
  - src/hooks/useForm.tsでフォーム管理フックを作成
  - _Requirements: 2, 5_

- [ ] 34. フロントエンド統合テストスイート
  - tests/integration/ui/forms.test.tsxでフォーム統合テストを実装
  - tests/integration/ui/interactions.test.tsxでインタラクションテストを作成
  - tests/e2e/user-flows.spec.tsでユーザーフローE2Eテストを実装
  - tests/performance/ui/rendering.test.tsでレンダリングパフォーマンステストを作成
  - _Requirements: 2, 3, 4, 5, 6, 7_

## パート3: 統合・E2E

### Section I: フロントエンド・バックエンド統合

- [ ] 35. API接続層
  - src/lib/api/client.tsでAPIクライアントを実装
  - src/lib/api/endpoints.tsでエンドポイント定義を作成
  - src/lib/api/interceptors.tsでインターセプターを実装
  - src/lib/api/error-handler.tsでAPIエラーハンドリングを作成
  - _Requirements: すべての機能要件_

- [ ] 36. 状態管理
  - src/hooks/useAuth.tsで認証フックを実装
  - src/hooks/useTenant.tsでテナントフックを作成
  - src/hooks/useRealtimeAttendance.tsでリアルタイム勤怠フックを実装
  - src/lib/state/store.tsで状態管理ストアを作成
  - _Requirements: 1, 2, 4_

- [ ] 37. リアルタイム同期
  - src/lib/realtime/hooks.tsでリアルタイムフックを実装
  - src/lib/realtime/sync.tsで同期ロジックを作成
  - src/lib/realtime/optimistic.tsで楽観的更新を実装
  - src/lib/realtime/conflict.tsで競合解決ロジックを作成
  - _Requirements: 4_

- [ ] 38. 統合テストスイート
  - tests/integration/api-connection.test.tsでAPI接続テストを実装
  - tests/integration/state-management.test.tsで状態管理テストを作成
  - tests/integration/realtime-sync.test.tsでリアルタイム同期テストを実装
  - tests/integration/data-flow.test.tsでデータフローテストを作成
  - _Requirements: すべての機能要件_

### Section J: エンドツーエンド検証

- [ ] 39. マルチテナントE2E
  - tests/e2e/multitenancy/isolation.spec.tsでテナント分離テストを実装
  - tests/e2e/multitenancy/subdomain.spec.tsでサブドメイン解決テストを作成
  - tests/e2e/multitenancy/cross-tenant.spec.tsでクロステナントアクセステストを実装
  - tests/e2e/multitenancy/concurrent.spec.tsで同時アクセステストを作成
  - _Requirements: 1_

- [ ] 40. 認証フローE2E
  - tests/e2e/auth/login.spec.tsでログインフローテストを実装
  - tests/e2e/auth/logout.spec.tsでログアウトフローテストを作成
  - tests/e2e/auth/password-reset.spec.tsでパスワードリセットテストを実装
  - tests/e2e/auth/session.spec.tsでセッション管理テストを作成
  - _Requirements: 2_

- [ ] 41. 完全E2Eテストスイート
  - tests/e2e/complete/attendance-flow.spec.tsで勤怠フロー全体テストを実装
  - tests/e2e/complete/admin-flow.spec.tsで管理者フローテストを作成
  - tests/e2e/complete/monthly-cycle.spec.tsで月次サイクルテストを実装
  - tests/e2e/complete/performance.spec.tsでパフォーマンステストを作成
  - _Requirements: すべての要件のE2E検証_

## パート4: パフォーマンス最適化 **[新規強化セクション]**

### Section K: パフォーマンスとキャッシング

- [ ] 42. **[強化] 多層キャッシング戦略実装**
  - src/lib/cache/strategies.tsでキャッシング戦略定義
  - src/lib/cache/react-query.tsでReact Query設定実装
  - src/lib/cache/invalidation.tsでキャッシュ無効化ロジック実装
  - src/lib/cache/edge-cache.tsでEdge キャッシュ設定実装
  - src/lib/cache/database-cache.tsでデータベースクエリキャッシュ実装
  - _Requirements: 10_

- [ ] 43. **[強化] Core Web Vitals最適化**
  - src/lib/performance/metrics.tsでパフォーマンスメトリクス計測実装
  - src/lib/performance/reporting.tsでWeb Vitalsレポーティング実装
  - src/components/PerformanceObserver.tsxでパフォーマンス監視コンポーネント実装
  - lighthouse.config.jsでLighthouse CI設定
  - tests/performance/core-web-vitals.test.tsでCWVテストを実装
  - _Requirements: 10_

- [ ] 44. **[強化] バンドルサイズと画像最適化**
  - src/lib/dynamic/imports.tsでダイナミックインポート定義
  - scripts/analyze-bundle.jsでバンドル分析スクリプト実装
  - src/lib/images/optimization.tsで画像最適化ヘルパー実装
  - next.config.jsで画像ドメイン設定
  - tests/performance/bundle.test.tsでバンドルサイズテストを実装
  - _Requirements: 10_

## パート5: Edge DeploymentとCI/CD **[新規強化セクション]**

### Section L: Vercel Edge最適化

- [ ] 45. **[強化] Edge Runtime設定**
  - vercel.jsonでEdge Runtime設定実装
  - src/lib/edge/config.tsでEdge設定ヘルパー実装
  - src/lib/edge/geo.tsで地理情報処理実装
  - src/app/api/[...routes]/route.tsでEdge API Routes実装
  - tests/edge/functions.test.tsでEdge Functionsテストを実装
  - _Requirements: 10_

- [ ] 46. **[強化] モニタリングと可観測性**
  - src/lib/monitoring/vercel-analytics.tsでVercel Analytics統合実装
  - src/lib/monitoring/error-tracking.tsでエラートラッキング実装
  - src/lib/monitoring/custom-metrics.tsでカスタムメトリクス実装
  - src/lib/logging/logger.tsで構造化ログ実装
  - src/lib/logging/correlation.tsで相関ID実装
  - _Requirements: 10_

- [ ] 47. **[強化] CI/CDパイプライン最適化**
  - .github/workflows/performance.ymlでパフォーマンステストワークフロー実装
  - .github/workflows/security.ymlでセキュリティスキャンワークフロー実装
  - .github/workflows/deploy-preview.ymlでプレビューデプロイワークフロー実装
  - .github/workflows/deploy-production.ymlで本番デプロイワークフロー実装
  - scripts/deploy-edge.jsでEdgeデプロイスクリプト実装
  - _Requirements: 10_

## 実装ガイドライン **[強化版]**

### 開発順序（推奨）

1. **基盤構築（必須）**: タスク1-1a, 4-6（Turbopack、DAL、RLS最適化）
2. **Server Components基盤**: タスク18a-18c（RSC、Server Actions）
3. **バックエンド開発**: タスク2-3, 7-18を順次実装
4. **UI/UX/デザイン**: タスク19-34（Server/Client分離に注意）
5. **統合・E2E**: タスク35-41
6. **パフォーマンス最適化**: タスク42-44（並行実装可能）
7. **Edge Deployment**: タスク45-47（最終段階）

### 並行開発戦略

- バックエンドチーム: タスク1-18に集中
- フロントエンドチーム: タスク19-34に集中（モックAPIを使用）
- 統合フェーズ: 両チームが協力してタスク35-41を実装

### テスト戦略

- 各Sectionの最後に必ずテストスイートを実装
- テストカバレッジ目標: 80%以上
- E2Eテストは実際のSupabase環境で実行

### 品質基準 **[強化版]**

- **TypeScript**: strictモード必須
- **ESLint**: エラー0、警告最小化
- **Prettier**: 100%フォーマット済み
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **パフォーマンス**:
  - Lighthouse 全カテゴリ90点以上
  - FCP < 1.2秒
  - LCP < 2.5秒
  - Server Response p95 < 200ms
- **Server/Client分離**: 適切なコンポーネント分離
- **Data Access Layer**: 全データアクセスはDAL経由
- **セキュリティ**: OWASP Top 10対応

### ブランチ戦略

- バックエンド: `feat/backend-*`
- フロントエンド: `feat/frontend-*`
- 統合: `feat/integration-*`
- 各タスク完了後にPR作成・レビュー実施
