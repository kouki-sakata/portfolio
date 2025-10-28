# TeamDevelop Bravo プロジェクト構造

## ルートディレクトリ構成

```
TeamDevelopBravo-main/
├── .kiro/            # Kiro仕様駆動開発
│   ├── specs/        # 機能仕様書
│   └── steering/     # プロジェクト指針
├── frontend/         # React SPA
├── openapi/          # OpenAPI仕様（API自動生成元）
├── src/              # Javaソースコード
├── docker/           # Docker設定
├── scripts/          # 開発支援スクリプト
├── build.gradle      # Gradleビルド設定
├── docker-compose.yml
└── Dockerfile
```

## バックエンド構造 (`src/main/java/com/example/teamdev/`)

```
├── config/           # Spring設定（Security、OpenAPI、WebMvc等）
├── controller/api/   # REST APIコントローラー（NewsRestController、StampHistoryRestController等）
├── service/          # ビジネスロジック（SOLID原則準拠）
│   ├── 認証系: AuthenticationService、AuthSessionService
│   ├── 従業員: EmployeeService（ファサード）、QueryService、CommandService
│   ├── 打刻: StampService、StampEditService、StampHistoryService、StampDeleteService
│   ├── 打刻サブコンポーネント（service/stamp/）: StampHistoryPersistence、OutTimeAdjuster、TimestampConverter
│   └── お知らせ: NewsManageService（ファサード、読み取り専用）、NewsManageRegistrationService、NewsManageReleaseService、NewsManageDeletionService、NewsManageBulkDeletionService、NewsManageBulkReleaseService
├── mapper/           # MyBatisマッパー
├── dto/api/          # API用DTO（auth、employee、home、news、stamp）：ドメイン毎にサブパッケージ分割
├── entity/           # エンティティ（Employee、News、StampHistory、StampHistoryDisplay等）
├── exception/        # カスタム例外（DuplicateStampException等）
└── util/             # ユーティリティ
```

### API公開パターンの追加
- `/api/public/**` は `FeatureFlagRestController` が担当し、モダンUIフラグを匿名アクセスで提供（`FeatureFlagService` が Spring プロファイルに応じて値を決定）。
- `DebugController` は dev/test プロファイル限定で `/api/debug` を公開し、CSRF ヘッダー／Cookie の整合性やリクエストヘッダーを可視化するデバッグ専用エンドポイント。

## フロントエンド構造 (`frontend/src/`)

```
├── app/              # メインアプリケーション
│   ├── config/       # QueryClient設定
│   ├── layouts/      # AppLayout（認証ガード + レスポンシブシェル）
│   ├── providers/    # AppProviders、routeLoaders
│   └── routes.tsx
├── hooks/            # グローバルで再利用するUI/UXカスタムフック
├── components/ui/    # shadcn/uiコンポーネント
├── features/         # 機能別モジュール
│   ├── auth/         # 認証（AuthProvider、hooks、api）
│   ├── employees/    # 従業員管理
│   ├── home/         # ダッシュボード
│   ├── logManagement/ # 監査ログ・操作履歴
│   ├── news/         # お知らせ管理（完全実装済み）
│   │   ├── api/      # newsApi.ts（CRUD + バルク操作REST呼び出し）
│   │   ├── components/ # NewsManagementPage（メイン画面）、NewsFormModal（作成/編集）、BulkActionBar（バルク操作UI）、DeleteConfirmDialog（削除確認）、PublishedNewsGrid（公開中カード表示）、NewsDetailDialog（詳細表示）、NewsCard（カード表示）、PublishedNewsCard
│   │   ├── hooks/    # useNews.ts（Query/Mutation統合、React Query）、useNewsColumns.tsx（テーブルカラム定義、イベントハンドラ注入）
│   │   ├── lib/      # newsViewModel.ts（View変換、派生データ生成）、categoryBadge.ts（カテゴリ→Badge variant）
│   │   ├── routes/   # NewsManagementRoute.tsx
│   │   └── types/    # bulk.ts（バルクAPI型定義）
│   └── stampHistory/ # 打刻履歴管理
│       ├── api/      # stampApi.ts（履歴取得、編集・削除、バッチ操作）
│       ├── components/ # StampHistoryPage、MonthlyStatsCard、EditStampDialog、DeleteStampDialog、ExportDialog
│       ├── hooks/    # useStampHistoryExport（CSV/TSV/Excel-CSVエクスポート）
│       ├── lib/      # batch-processor、csv-generator、blob-downloader、summary
│       ├── routes/   # StampHistoryRoute
│       └── types/    # index.ts（MonthlyStats、ExportConfig、CSV型定義）
├── shared/           # 共通コンポーネント
│   ├── api/          # API共通設定、エラークラス
│   ├── components/   # layout、loading
│   ├── contexts/     # FeatureFlagContextなどのクロスカッティング状態
│   ├── error-handling/ # GlobalErrorHandler・ErrorBoundary（トースト + ログ統合）
│   ├── hooks/        # use-feature-flag、useOptimizedImageなどの共有フック
│   ├── lib/          # 環境変数・最適化ロジックなどの共通ライブラリ
│   ├── performance/  # パフォーマンス計測ユーティリティ
│   ├── repositories/ # IHttpClientアダプター、InterceptableHttpClient
│   └── utils/
├── schemas/          # Zodスキーマ（OpenAPI生成）
├── test/             # テストユーティリティ（MSW、setup）
└── types/            # 自動生成型定義
```

### SPAレイアウトとルーター層
- `app/layouts/AppLayout` が認証ガード、モバイルサイドバー、`NavigationProgress` を結合したシェルとして全画面を包み、レスポンシブな 2 カラム構成を維持する。
- `app/providers/routeLoaders.ts` は React Router ローダーで初期データをプリフェッチし、401/403 を `authEvents` に流してトースト通知と `redirect()` を一元化する。
- 共通 `hooks/` は toast・画像最適化など UI 体験の横断パターンをまとめ、features 配下からも import できる仕組みを提供。

### 共有基盤の拡張パターン
- `shared/contexts/FeatureFlagContext` と `shared/hooks/use-feature-flag` が `/api/public/feature-flags` をローカルストレージと同期し、UI ラッパーの分岐を制御。
- `shared/components/ui-wrapper/*` は shadcn/ui コンポーネントにフォールバック実装を被せ、段階的ロールアウトを可能にする Feature Flag トグル層。
- `shared/error-handling/` は `GlobalErrorHandler`・`ErrorBoundary`・`error-logger` を備え、API 例外を分類して Toast とロギングに反映するグローバルハンドリングを担う。
- `shared/repositories/` は `IHttpClient` インターフェース＋アダプターによる Repository パターンを提供し、Zod バリデーション付きの `AuthRepository` や `HomeRepository` が依存逆転で再利用。
- `shared/components/layout/` に AppShell / Sidebar / Header / ComingSoon などの骨格 UI を集約し、AppLayout や各ページから再利用できる。

## レイヤードアーキテクチャ

### バックエンド（SOLID原則）
- **Controller**: REST API（Spring MVC）
  - record DTO + Bean Validation（`@NotBlank`, `@Pattern`, `@Size`）
  - Form Bridge パターン（`ListForm`/`NewsManageForm`でService接続）
  - SecurityUtil経由で操作者ID取得、`@PreAuthorize`でロール制御
  - 複数専門サービスの注入と組み立て（例: NewsRestController）
- **Service**: ビジネスロジック
  - ファサードパターン（複雑性の隠蔽、読み取り統合）
  - Query/Command分離（CQRS）
  - 専門サービスの単一責任化（Registration/Release/Deletion/Bulk*）
- **Mapper**: データアクセス（MyBatis）
  - アノテーションベース（シンプルなクエリ）とXML定義（複雑なクエリ）の使い分け
- **Entity/DTO**: データモデル（camelCase統一）

### フロントエンド
- **機能ベース**: features/配下に機能別モジュール
- **共通コンポーネント**: shared/に再利用可能なコンポーネント
- **UIコンポーネント**: components/ui/にshadcn/ui
- **型定義**: OpenAPI自動生成 + 各機能のtypes/

## ファイル命名規則

- **Java**: PascalCase（`EmployeeService.java`）
- **React**: PascalCase（`SignInPage.tsx`）
- **フック**: camelCase + use prefix（`useAuth.ts`）
- **DB**: snake_case（`stamp_history`）

## Kiro仕様構造

```
.kiro/
├── specs/[feature]/
│   ├── spec.json        # 仕様メタデータ
│   ├── requirements.md  # 要件定義
│   ├── design.md        # 技術設計
│   └── tasks.md         # 実装タスク
└── steering/
    ├── product.md       # 製品概要
    ├── tech.md          # 技術スタック
    └── structure.md     # プロジェクト構造
```

---
*Last Updated: 2025-10-28 (お知らせ管理機能の完全構造を反映、コンポーネント一覧を詳細化)*
