# TeamDevelop Bravo 技術スタック

## アーキテクチャ

- **タイプ**: モノリシックSPA（Spring Boot API + React SPA）
- **データベース**: PostgreSQL 16（MyBatis 3.0.4）
- **原則**: RESTful API、OpenAPI 3.0準拠、型安全性（TypeScript + Zod）

## フロントエンド

### コアスタック
- React 19.1.1、TypeScript 5.8.3（strict mode）
- Vite 7.1.7、React Router 7.9.2
- React Query 5.90.2（staleTime: 5分、gcTime: 10分）
- TanStack Table 8.21.3（Headless UI）
- shadcn/ui@canary（React 19対応、Radix UI）
- Tailwind CSS 4.1.13

### TypeScript高度な型活用
- satisfies演算子、Branded Types（ID誤用防止）
- Template Literal Types、型述語関数

### 開発ツール
- Biome 2.2.4（ESLint/Prettier統合）
- Vitest 3.2.4（500+ tests）、MSW 2.11.3
- Playwright 1.49.1（E2E）
- @hey-api/openapi-ts（型自動生成）

### 主要コマンド
```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run lint         # Biomeリント
npm run test         # Vitestテスト
npm run test:e2e     # Playwright E2E
npm run generate:api # OpenAPI型生成
```

### フロントエンド設計パターン

- **View Model変換**: APIレスポンスからUI専用モデルへの変換、派生データ生成（`deriveTitle`/`deriveCategory`）、型安全な拡張（`NewsViewModel = NewsResponse & { ... }`）。Profile用に3つの変換関数（`createOverviewViewModel`/`createMetadataFormValues`/`createActivityViewModel`）を提供し、Nullable値のデフォルト処理とEnum制約を実装
- **TanStack Table統合**: カラム定義のフック化（`useNewsColumns`）、選択チェックUI標準化（`DataTableSelectionCheckbox`）、レスポンシブ対応、複数ソート・フィルタ。選択状態管理は `RowSelectionState` とID配列を同期し、Set型による高速検索とバルク操作後の部分成功対応を実装
- **React Query楽観的更新**: `onMutate`でキャッシュ直接更新、`onError`でロールバック、`onSettled`でサーバー再検証、複数キャッシュキー同時無効化、バルク操作の部分成功処理
- **ホーム打刻クロック同期**: `useHomeClock` が JST固定（`formatLocalTimestamp` + Day.js timezone）のISOタイムスタンプを供給、UI/ロジック分離、フェールオーバー処理、遅延吸収
- **Feature Flag管理**: `FeatureFlagProvider` が `/api/public/feature-flags` から取得しローカルストレージ同期、`ui-wrapper/*` でフォールバックUI提供、段階的ロールアウト対応
- **認証ガード**: `AdminGuard` が認証取得中に `LoadingSpinner` 表示、未認証は `/signin` へ、非管理者は `/` へリダイレクト、DOM構造を汚染しない Fragment 返却
- **エラーハンドリング**: `GlobalErrorHandler` が API 例外を識別（認証/権限/ネットワーク/バリデーション）、Toast 表示とロギング一元管理、`authEvents` で401/403をエスカレート、React Query の QueryCache と統合
- **Repository パターン**: `IHttpClient` で HTTP 層を抽象化、Zod スキーマで API 応答検証、`RepositoryError` に正規化（`TIMEOUT`/`NETWORK_ERROR`/`SERVER_ERROR`）、依存逆転の原則 (DIP) を満たす
- **プロフィール統計**: `useProfileStatisticsQuery` → `ProfileStatisticsData` → Recharts 3.3.0 で6か月推移を可視化、`constants/chartStyles.ts` でテーマ統一、Skeleton と空状態カード実装

## バックエンド

### 主要スタック
- Java 21、Spring Boot 3.4.3、Spring Security 6.4
- MyBatis 3.0.4
- PostgreSQL 16、HikariCP
- Springdoc OpenAPI 2.6.0

### MyBatis実装パターン
- **動的SQL使い分け**: シンプルなクエリはアノテーションベース（`@Delete` + `<script>`、`@Select` + `<foreach>`）、複雑な更新ロジックはXML定義（`bulkUpdate*`、条件分岐）、一括操作は `<foreach>` で動的IN句生成
- **ResultMap定義**: snake_case→camelCase変換を一元管理、型安全なマッピング
- **列マッピングの明示**: `SELECT *` を避け、各カラムを明示し `AS` でDTOプロパティへマッピング

### サービス層アーキテクチャ（SOLID原則）
- **ファサードパターン**: EmployeeService、NewsManageService（読み取り専用の統合ポイント）
- **単一責任の原則**: Query/Command分離（CQRS）
- **専門サービス分離**: 認証（AuthenticationService、AuthSessionService）、従業員（QueryService、CommandService、CacheService）、打刻（StampService、StampEditService、StampHistoryService、StampDeleteService、StampOutputService + サブコンポーネント）、お知らせ（NewsManage系の Registration/Release/Deletion/Bulk* サービス）
- **Controller層での組み立て**: 複数の専門サービスを注入し、エンドポイントごとに適切なサービスを呼び出す

### DDDアプローチの段階的導入（Profile機能、2025-11-03）
**注**: 既存機能（News, StampHistory）はMyBatis + 従来型Serviceパターンを継続。Profile機能は新しいDDDアプローチの実験場。
- **Application Service層**: `ProfileAppService` がユースケースをオーケストレーション、トランザクション境界を制御（権限チェック → データ取得 → ドメインロジック適用 → 永続化 → 監査ログ記録）
- **Domain Model層**（service/profile/model/）: Aggregate（`ProfileAggregate`）、Value Objects（`ProfileMetadataDocument`、`ProfileWorkScheduleDocument`）、Command/Query Objects（`ProfileMetadataUpdateCommand`、`ProfileActivityQuery`）、Change Tracking（`ProfileChangeSet`）
- **Repository層**: `ProfileMetadataRepository` が JdbcTemplate 経由で PostgreSQL JSONB を直接操作、Document パターンで JSONB スキーマを型安全に管理
- **アクセス制御と監査**: `enforceAccessメソッド` で自己アクセス/管理者権限を検証、`ProfileAuditService` が閲覧・更新イベントを `profile_activity_log` に記録
- **DDDを採用すべきタイミング**: ✅ 複雑なビジネスルール、頻繁に変わる要件、監査証跡が重要、柔軟なデータ構造 / ❌ シンプルなCRUD、安定したスキーマ → 従来型（MyBatis）を継続

### API層の実装パターン
- **REST Controller層**: record DTO + Bean Validation（`@NotBlank`, `@Pattern`, `@Size`）で入力検証。`SecurityUtil#getCurrentEmployeeId()`で操作者取得、`@PreAuthorize`でロール制御
- **Form Bridge パターン**: 既存のForm型（`ListForm`, `NewsManageForm`, `HomeForm`）でService層と接続
- **型同期**: OpenAPI 3.0スキーマ → `@hey-api/openapi-ts`でTypeScript型自動生成。Backend Bean Validation と Frontend Zod スキーマで同一ルール・メッセージ
- **バルクAPI設計**: 部分成功レスポンス（`successCount`, `failureCount`, `results[]`）、上限設定（最大100件）、事前検証とトランザクション管理、個別の成否とエラーメッセージを返却
- **バルクAPIエラー戦略**: `extractRootCause`メソッドでネストされた例外の根本原因を抽出、バリデーションエラー（IllegalArgumentException）とシステムエラーを分離処理、部分成功時のログ出力、`ResponseStatusException`で適切なHTTPステータス返却（400/500）
- **Map型レスポンス変換パターン**（打刻履歴）: Service層が `List<Map<String, Object>>` でカレンダー形式データ返却、Controller層が record DTO（`StampHistoryEntryResponse`）に型安全変換

### スキーマ正規化とJSONB戦略

#### 勤務スケジュールの正規化（V6マイグレーション、2025-11-13）
- **通常カラム化完了**: `employee.schedule_start/end/break_minutes` へ移行、`profile_metadata.schedule` ブロックは削除済み
- **集計クエリ**: `StampHistoryMapper.findMonthlyStatistics` が通常カラム経由で参照（JSONB依存を解消）
- **GINインデックス**: `log_history.detail` に `jsonb_path_ops` 追加（監査ログ検索の高速化）

#### JSONB活用指針
- **✅ 使用推奨**: 柔軟なスキーマ（監査ログ、メタデータ補助情報）、頻繁に変わるスキーマ、ネストされた構造
- **❌ 使用非推奨**: 頻繁な集計対象、インデックス必須項目、JOIN条件に使用する項目
- **移行戦略**: `docs/issues/jsonb-dependency-reduction.md` 参照

### セキュリティ
- セッションベース認証（8時間）、CSRF保護（Cookie + X-XSRF-TOKEN）
- BCryptパスワードハッシング、MyBatisパラメータバインディング

### Gradleタスク
```bash
./gradlew build      # フルビルド
./gradlew test       # テスト（Testcontainers）
./gradlew bootRun    # Spring Boot起動
```

## データベース設計

### スキーマ戦略
- **PostgreSQL 16**: 高度な JSONB サポート、GIN インデックス、トリガー機能
- **MyBatis 3.0.4（従来機能）+ Repository（DDD機能）のハイブリッド**: 既存機能は MyBatis、新機能（Profile）は JdbcTemplate + Repository パターン
- **正規化判断基準**: 頻繁な集計対象は通常カラム化（V6マイグレーション参照）、柔軟なスキーマはJSONB活用

### マイグレーション管理
- **Flyway**: バージョン管理された SQL マイグレーション（`src/main/resources/db/migration/`）
- **マイグレーション履歴**:
  - V1~V3: 初期スキーマ・データ・夜勤フラグ
  - V4: パフォーマンスインデックス（13個）
  - V5: `stamp_date` 正規化（DATE型導入 + トリガー双方向同期）
  - V6: JSONB依存削減（勤務スケジュール通常カラム化）
- **トランザクション制御**: Flyway:Transactional=false（DDL自動コミット対応）
- **運用Runbook**: `docs/runbooks/performance-index-rollout.md`、`docs/runbooks/stamp-date-migration.md`

### インデックス設計
- **B-Tree インデックス**: 単一カラム（`idx_employee_name_search`）、複合カラム（`idx_log_history_daily_check`）
- **GIN インデックス**: JSONB カラム（`log_history.detail` に `jsonb_path_ops`）
- **部分インデックス**: 条件付きインデックス（`idx_stamp_history_stamp_date` は `stamp_date IS NOT NULL`）
- **インデックス命名規則**: `idx_<table>_<column(s)>_<type>`

## テスト戦略

- **単体テスト**: JUnit 5 / Vitest（80%+ カバレッジ）。Controller は `@WebMvcTest` + MockBean、React は Testing Library + MSW
- **統合テスト**: Spring Boot Test + Testcontainers / MSW。モック削減方針（実DBテスト強化、2025-10-15）
- **E2Eテスト**: Playwright（主要フロー）。ファクトリ関数でテストデータ生成、MSWモックサーバー（開発中）
- **契約テスト**: OpenAPI4j 1.0.7
- **パフォーマンステスト**: Lighthouse CI

## パフォーマンス最適化

### インデックス戦略
- **V4マイグレーション**（2025-10-XX）: 13個のインデックス追加
  - `idx_log_history_update_date_desc`: 監査ログの日付降順検索
  - `idx_log_history_daily_check`: 日次チェック（year/month/day複合）
  - `idx_employee_name_search`: 従業員名検索（部分一致対応）
  - `idx_stamp_history_year_month`: 打刻履歴の年月検索
  - その他9個のインデックス
- **V5_1マイグレーション**（2025-10-XX）: `stamp_history.stamp_date` インデックス（DATE型での高速検索）
- **V6マイグレーション**（2025-11-13）: `log_history.detail` に GIN インデックス（`jsonb_path_ops`）

### N+1クエリ解消パターン
- **バッチフェッチパターン**: `StampHistoryMapper#getStampHistoryByYearMonthEmployeeIds` による一括取得
- **CSV出力最適化**: `StampOutputService` が従業員ごとのループを廃止（100従業員×1か月で100クエリ→1クエリに削減）
- **カレンダーテーブル展開**: JOINで全日付を埋め、欠損日を補完
- **実績**: 従来の従業員ループを廃止し、単一クエリで全データを取得する設計に変更

### 計測・監視
- **Lighthouse CI**: フロントエンドパフォーマンス自動計測（LCP、TTI、バンドルサイズ）
- **EXPLAIN (ANALYZE, BUFFERS)**: クエリ実行計画の分析とボトルネック特定
- **運用Runbook**: `docs/runbooks/performance-index-rollout.md`、`docs/runbooks/stamp-date-migration.md`
- **パフォーマンスドキュメント**: `docs/performance-tuning.md` に詳細な計測結果

## パフォーマンス目標

- LCP: 1.5秒、TTI: 2秒、バンドル: 300KB以下
- API: p95 200ms、DB: p95 50ms、稼働率: 99.9%

## CI/CD

- **ci.yml**: フロントlint/test/build、バックテスト、Docker、SonarCloud / **feature.yml**: 命名規則、OWASPスキャン

## 環境・ポート

- **開発**: 8080（API）、5173（Vite）、5432（PostgreSQL）
- **プロファイル**: dev（Swagger有効）、test（Testcontainers）、prod（最適化）

---
*Last Updated: 2025-11-13 (JSONB依存削減、パフォーマンス最適化、データベース設計を追記)*
