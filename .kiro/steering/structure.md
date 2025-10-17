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
│   └── お知らせ: NewsManageService（ファサード）、各専門サービス
├── mapper/           # MyBatisマッパー
├── dto/api/          # API用DTO（auth、employee、home、news、stamp）：ドメイン毎にサブパッケージ分割
├── entity/           # エンティティ（Employee、News、StampHistory、StampHistoryDisplay等）
├── exception/        # カスタム例外（DuplicateStampException等）
└── util/             # ユーティリティ
```

## フロントエンド構造 (`frontend/src/`)

```
├── app/              # メインアプリケーション
│   ├── config/       # QueryClient設定
│   ├── providers/    # AppProviders、routeLoaders
│   └── routes.tsx
├── components/ui/    # shadcn/uiコンポーネント
├── features/         # 機能別モジュール
│   ├── auth/         # 認証（AuthProvider、hooks、api）
│   ├── employees/    # 従業員管理
│   ├── home/         # ダッシュボード
│   ├── logManagement/ # 監査ログ・操作履歴
│   ├── news/         # お知らせ管理
│   │   ├── api/      # newsApi.ts（CRUD + バルク操作）
│   │   ├── components/ # NewsManagementPage、NewsFormModal、NewsCard、DeleteConfirmDialog
│   │   ├── hooks/    # useNews（Query/Mutation統合）、useNewsSelection（選択状態管理）
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
│   └── utils/
├── schemas/          # Zodスキーマ（OpenAPI生成）
├── test/             # テストユーティリティ（MSW、setup）
└── types/            # 自動生成型定義
```

## レイヤードアーキテクチャ

### バックエンド（SOLID原則）
- **Controller**: REST API（Spring MVC）
  - record DTO + Bean Validation（`@NotBlank`, `@Pattern`, `@Size`）
  - Form Bridge パターン（`ListForm`/`NewsManageForm`でService接続）
  - SecurityUtil経由で操作者ID取得
- **Service**: ビジネスロジック
  - ファサードパターン（複雑性の隠蔽）
  - Query/Command分離（CQRS）
- **Mapper**: データアクセス（MyBatis）
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
*Last Updated: 2025-10-17 (stampHistory機能構造追加、libディレクトリパターン)*
