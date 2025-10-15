# TeamDevelop Bravo 製品概要

## 製品概要

React + Spring Boot SPAベースのモバイルフレンドリーな勤怠管理システム。PostgreSQLマイグレーション完了、モダンな技術スタックで再構築。

## コア機能

### 認証・勤怠管理
- セッションベース認証（8時間有効、CSRF保護）
- Web打刻、履歴管理、月次集計
- CSV出力（Shift-JIS with BOM対応）

### 従業員・ダッシュボード
- TanStack Tableによる高性能検索・ソート
- レスポンシブダッシュボード（お知らせ・打刻統合）
- ロールベースアクセス制御

### お知らせ・ログ管理
- お知らせ登録・公開管理・削除
- システムログ照会・検索・監査証跡
- DataTables統合による大量データ表示

## 主要な価値提案

### 技術的優位性
- React 19 + Spring Boot 3.4によるモダンSPA
- PostgreSQL 16 + MyBatisのスケーラブル設計
- TypeScript 5.8 strict mode（Branded Types、Template Literal Types活用）
- OpenAPI駆動開発（フロント/バック型同期）
- shadcn/ui@canary + Tailwind CSS 4
- Biome統合によるコード品質管理
- React Query 5キャッシング、Vite 7コード分割
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
- ✅ お知らせ管理機能スキーマ移行完了（2025-10-15）
- ✅ お知らせ管理REST APIとOpenAPI型同期の実装（2025-10-15）

### 開発中/計画中
- 🔄 E2Eテスト拡充（継続中）
- 📋 管理者分析ダッシュボード、勤怠承認ワークフロー
- 📋 外部システム連携API、プッシュ通知、生体認証

---
*Last Updated: 2025-10-15 (News REST API統合)*
