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
- ロールベースアクセス制御

### お知らせ・ログ管理
- お知らせCRUD・公開切り替え・バルク操作（REST API完全実装）
- システムログ照会・検索・監査証跡
- React Queryによる楽観的更新・キャッシュ管理

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
- ✅ お知らせ管理機能完全実装（2025-10-17）
  - REST API（CRUD、公開管理、バルク削除/公開切り替え）
  - Reactコンポーネント（NewsManagementPage、選択状態管理）
  - バルクAPI：部分成功対応、最大100件処理
  - Zod バリデーション、React Query統合、包括的テスト完備
- ✅ 打刻履歴管理機能完全実装
  - REST API（履歴取得、編集・削除）
  - SOLID原則サービス分離（StampHistoryPersistence、OutTimeAdjuster等）
  - カスタムフック統合（useStampHistoryExport）
  - CSV/TSV/Excel-CSVバッチエクスポート（大量データ対応）
  - 月次統計計算、編集・削除ダイアログ、包括的テスト完備
- ✅ モダンUI Feature Flag レイヤー整備（2025-10-20）
  - `/api/public/feature-flags` エンドポイント + FeatureFlagService でプロファイル別フラグを提供
  - FeatureFlagProvider + UI Wrapper で shadcn/ui とカスタムUIを安全にトグル
  - ModernUI/Legacy プロファイルの統合テスト（MockMvc）で常時 true を保証
- ✅ グローバルエラーハンドリング基盤
  - GlobalErrorHandler + Toast + error-logger による例外分類と通知整流
  - authEvents + QueryClient エラーフックで 401/403 を自動リダイレクト & セッションリセット
  - RouteLoader でプリフェッチと権限制御（redirect + トースト）を共通化

### 開発中/計画中
- 🔄 E2Eテスト拡充（継続中）
  - お知らせ管理 Playwright テスト完備（news-management.spec.ts）
- 📋 管理者分析ダッシュボード、勤怠承認ワークフロー
- 📋 外部システム連携API、プッシュ通知、生体認証

---
*Last Updated: 2025-10-26 (お知らせ管理UI完成版とView Model/TanStack Tableパターンを反映)*
