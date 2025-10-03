# TeamDevelop Bravo 技術スタック

## アーキテクチャ

### システムアーキテクチャ
- **タイプ**: モノリシックSPAアプリケーション
- **パターン**: Spring Boot APIバックエンド + React SPAフロントエンド
- **データベース戦略**: PostgreSQLによるRDBMS
- **デプロイメント**: Docker Compose / AWS Elastic Beanstalk

### アーキテクチャ原則
- **API設計**: RESTful APIパターン
- **状態管理**: React Query / サーバー側セッション
- **セキュリティファースト**: Spring Securityによる認証・認可
- **関心の分離**: フロントエンド/バックエンド完全分離

## フロントエンド

### コアフレームワーク
- **React 19**: 最新のReactフレームワーク（v19.1.1）
- **TypeScript 5**: 型安全な開発（v5.8.3、strictモード有効 - exactOptionalPropertyTypes除く）
  - satisfies演算子による型制約と型推論の両立
  - const type parametersによるリテラル型推論
  - Template Literal Typesによる型安全なAPI定義
  - Branded Typesパターンによる名義的型付け
  - 型述語（Type Predicates）による実行時型チェック
- **Vite**: 高速ビルドツール（v7.1.7）
- **React Router 7**: SPAルーティング（v7.9.2）

### UIライブラリ
- **React Query 5**: サーバー状態管理（v5.90.2）
  - QueryClient最適化設定（staleTime: 5分、gcTime: 10分）
  - 認証フック統合（useSession、useLogin、useLogout）
  - エラーリトライ戦略（exponential backoff、最大3回）
  - ダッシュボードデータのリアルタイム同期
  - Suspenseモードサポート（React 19統合）
  - queryOptions/mutationOptionsパターン採用（TypeScript v5対応）
  - グローバル型定義によるクエリキー型安全化
  - **Route Loader統合**（2025-10-03）
    - ルート遷移前のデータプリフェッチング
    - 各ルートに特化したローダー関数
    - QueryClient.prefetchQueryによる効率的なキャッシュ
    - ナビゲーションのパフォーマンス向上
- **TanStack Table**: 高性能テーブル/データグリッドライブラリ（v8.21.3）
  - Headless UIパターンによる完全なカスタマイズ性
  - ソート、フィルタリング、ページネーション機能
  - 大規模データセットの仮想化対応
  - TypeScript完全サポート
  - 従業員管理画面での実装完了（2025-09-30）
- **shadcn/ui**: Radix UIベースのコンポーネントライブラリ
  - Radix UI React Label (v2.1.7)
  - Radix UI React Slot (v1.2.3)
  - Radix UI React Toast (v1.2.15)
  - Button、Form、Input、Label、Toast等の基本UIコンポーネント実装済み
  - カスタムカードコンポーネント（StampCard、NewsCard）実装済み
  - DataTableコンポーネント（TanStack Table統合）実装済み
- **React Hook Form**: フォーム状態管理（v7.53.0）
  - Zod統合によるランタイムバリデーション
  - 高パフォーマンスな非制御コンポーネント
- **Tailwind CSS 4**: ユーティリティファーストCSS（v4.1.13）
- **Lucide React**: アイコンライブラリ（v0.544.0）
- **class-variance-authority**: コンポーネントバリアント管理（v0.7.1）
- **clsx**: 動的クラス名結合（v2.1.1）
- **tailwind-merge**: Tailwindクラス競合解決（v3.3.1）
- **レスポンシブデザイン**: モバイルファースト設計

### ローディング状態管理
- **LoadingSpinner**: カスタマイズ可能なローディングインジケーター
  - サイズバリアント（sm/md/lg/xl）
  - スタイルバリアント（primary/secondary/destructive）
  - フルスクリーン表示オプション
  - アクセシビリティ対応（ARIA属性）
- **SkeletonVariants**: コンテンツ別スケルトンUI
  - SkeletonCard: カードコンテンツのプレースホルダー
  - SkeletonTable: テーブルコンテンツのプレースホルダー
  - SkeletonForm: フォームコンテンツのプレースホルダー
  - SkeletonText: テキストコンテンツのプレースホルダー
- **SuspenseWrapper**: React 19 Suspense統合
  - 非同期コンポーネントの統合管理
  - 遅延表示機能（showDelay）
  - ErrorBoundary統合
  - PageSuspenseWrapper/TransitionSuspenseWrapperバリアント

### 開発ツール
- **Biome**: 統合コード品質管理ツール（v2.2.4）
  - Linter: ESLint互換の高速リンター
  - Formatter: Prettier互換の高速フォーマッター
  - 単一の設定ファイル（frontend/biome.jsonc）で管理
  - Ultracite設定を継承しプロジェクト固有のルールを追加
- **Vitest**: 単体テストフレームワーク（v3.2.4）
- **Playwright**: E2Eテスト（v1.49.1）
- **Testing Library**: React テストユーティリティ
- **@hey-api/openapi-ts**: OpenAPI仕様からTypeScript型を自動生成（v0.84.3）
- **openapi-zod-client**: OpenAPIからZodスキーマを生成（v1.18.3）
- **Zod**: ランタイムスキーマバリデーション（v3.25.76）
  - OpenAPI仕様からの自動生成（openapi-zod-client）
  - React Hook Formとの統合によるフォームバリデーション
  - ZodEffects型の適切な処理（z.infer、z.input、z.output）
  - API型安全性の強化とランタイムバリデーション
- **Ultracite**: 統合開発ツール（v5.4.4、グローバルインストール推奨）

### ビルド設定
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run preview      # ビルドプレビュー
npm run lint         # Biomeリントチェック（frontend/biome.jsonc使用）
npm run lint:fix     # Biome自動修正
npm run typecheck    # TypeScript型チェック
npm run test         # Vitestテスト実行
npm run test:watch   # テストウォッチモード
npm run test:e2e     # Playwright E2Eテスト
npm run format       # Biomeフォーマット
npm run format:check # フォーマットチェック
npm run biome:ci     # CI用Biomeチェック
npm run generate:api # OpenAPI仕様からTypeScript型とZodスキーマを生成
npm run generate:api-types    # TypeScript型のみ生成
npm run generate:zod-schemas   # Zodスキーマのみ生成
```

### APIクライアント層
- **アーキテクチャパターン**: 機能別モジュール化されたAPIクライアント
- **型生成**: OpenAPI仕様からの自動生成（@hey-api/openapi-ts v0.84.3）
- **API実装構造**:
  - `auth/api/`: ログイン、ログアウト、セッション管理
  - `employees/api/`: 従業員管理API
  - `home/api/`: ダッシュボード、打刻機能
  - `stampHistory/api/`: 打刻履歴管理
- **React Query統合**:
  - 各APIクライアントがuseQuery/useMutationと連携
  - カスタムフック実装（useSession、useLogin、useLogout、useAuthContext）
  - 最適化されたキャッシュ戦略（staleTime、gcTime設定）
  - EnhancedQueryClientによるグローバルエラーハンドリング
- **エラーハンドリング**:
  - カスタムエラークラス階層（NetworkError、ValidationError、AuthenticationError、AuthorizationError、UnexpectedError）
  - エラー分類システムによる適切なエラータイプの自動判定
  - エラー重要度とリトライ可能性の評価
  - GlobalErrorHandlerによる一元的エラー処理とロギング
  - ErrorBoundaryによるReactコンポーネントレベルのエラー捕捉
- **型安全性**: OpenAPIスキーマによる完全な型保証

## バックエンド

### 主要技術スタック
- **Java 21**: Eclipse Temurin（LTS版）
- **Spring Boot 3.4.3**: エンタープライズJavaフレームワーク
- **Spring Security**: 認証・認可フレームワーク
- **MyBatis 3.0.4**: SQLマッパーフレームワーク

### サービス層アーキテクチャ（SOLID原則準拠 - Phase 2）
- **ファサードパターン**: 複雑性の隠蔽と統一インターフェース提供
- **単一責任の原則**: 各サービスが明確な責務を持つ
- **専門サービス分離**:
  - **従業員管理系**:
    - `EmployeeService`: ファサードとして機能、各専門サービスに委譲
    - `EmployeeQueryService`: 従業員情報の照会専用
    - `EmployeeCommandService`: 従業員情報の作成・更新・削除専用
    - `EmployeeDataTableService`: DataTables統合処理専用
    - `EmployeeCacheService`: キャッシュ管理専用
  - **認証系**:
    - `AuthenticationService`: 認証処理
    - `AuthSessionService`: セッション管理（Phase 2で分離）
  - **打刻系**:
    - `StampService`: 打刻登録
    - `StampEditService`: 打刻編集（サブコンポーネント分離）
    - `StampHistoryService`: 履歴管理
    - `StampDeleteService`: 削除処理
    - `StampOutputService`: CSV出力
  - **お知らせ管理系**:
    - `NewsManageService`: ファサード
    - `NewsManageRegistrationService`: 登録専用
    - `NewsManageReleaseService`: 公開管理専用
    - `NewsManageDeletionService`: 削除専用
    - `HomeNewsService`: ホーム画面向け取得

### データベース
- **PostgreSQL 16**: プライマリデータベース
- **HikariCP**: コネクションプーリング
- **データベース初期化**: `01_schema.sql` / `02_data.sql`

### 認証・セキュリティ
- **セッションベース認証**: Spring Session
- **CSRF保護**: Spring Security CSRF トークン
- **ロールベースアクセス制御**: 管理者/一般ユーザー
- **セッション管理**: AuthSessionServiceによる集中管理

### APIドキュメント
- **Swagger/OpenAPI**: Springdoc OpenAPI（v2.6.0）
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html（devプロファイル）

### ビルドツール
- **Gradle 8.14.2**: ビルド自動化
- **Node-Gradle Plugin**: フロントエンドビルド統合
- **タスク設定**:
```bash
./gradlew build                    # フルビルド（フロントエンド含む）
./gradlew test                      # 全テスト実行（Testcontainers使用）
./gradlew apiTest                   # API特化テスト（@Tag("api")）
./gradlew contractTest -PenableOpenApiContract  # OpenAPI契約テスト
./gradlew bootRun                   # Spring Boot起動
```

## 開発環境

### 必要ツール
- **Java 21**: Eclipse Temurin推奨
- **Node.js 22.12.0**: フロントエンド開発
- **npm 10.9.2**: パッケージ管理
- **PostgreSQL 16**: データベース
- **Docker Desktop**: コンテナ環境
- **Git**: バージョン管理

### IDE推奨設定
- **IntelliJ IDEA** または **VS Code**
- **拡張機能**:
  - Java Extension Pack
  - Spring Boot Extension Pack
  - Biome (VS Code)
  - GitLens

## 共通コマンド

### Docker Compose
```bash
docker-compose up -d      # コンテナ起動
docker-compose down       # コンテナ停止
docker-compose logs -f    # ログ表示
docker-compose restart    # 再起動
```

### 開発ワークフロー
```bash
# バックエンド起動
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# フロントエンド開発（別ターミナル）
npm run dev --prefix frontend

# テスト実行
./gradlew test
npm run test --prefix frontend

# 開発ワークフロースクリプト
./scripts/dev-workflow.sh --quick
```

## 環境変数

### バックエンド環境変数
```properties
# データベース設定
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teamdev_db
DB_USERNAME=user
DB_PASSWORD=password

# アプリケーション設定
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev

# セキュリティ
JWT_SECRET=<secret-key>
ENCRYPTION_KEY=<encryption-key>

# ログレベル
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_WEB=DEBUG
LOG_LEVEL_HIBERNATE=ERROR
```

### フロントエンド環境変数
```properties
# API設定
VITE_API_BASE_URL=http://localhost:8080/api

# 開発設定
VITE_DEBUG_MODE=true
```

### 環境ファイル
- `.env.example`: テンプレート
- `.env`: ローカル開発（git-ignored）
- `frontend/.env.local`: フロントエンド開発設定

## ポート設定

### 開発ポート
- **8080**: Spring Boot APIサーバー
- **5173**: Vite開発サーバー
- **5432**: PostgreSQL（ローカル）
- **15432**: PostgreSQL（Docker内部）

### テストポート
- **Random**: Testcontainersが動的に割り当て

## CI/CD

### GitHub Actions
- **ci.yml**: メインCIパイプライン
  - Node/npm セットアップ
  - フロントエンドlint/test
  - バックエンドテスト（PostgreSQLサービス使用）
  - Dockerビルド
  - SonarCloud分析

- **feature.yml**: フィーチャーブランチ検証
  - ブランチ命名規則チェック
  - クイックテスト
  - セキュリティチェック（OWASP）
  - Dockerビルド検証

### テスト戦略
1. **単体テスト**: JUnit 5 + Mockito / Vitest
2. **統合テスト**: Spring Boot Test + Testcontainers
3. **APIテスト**: @Tag("api") による分離実行
4. **E2Eテスト**: Playwright
5. **契約テスト**: OpenAPI仕様準拠（オプション）

### テストカバレッジ目標（Phase 2で大幅向上）
- **全体**: 314+テスト、309+成功（98.4%成功率）
- **サービス層**: 85%以上のカバレッジ達成
  - EmployeeServiceTest: 35/100 → 85/100 (+143%)
  - TimestampConverter: 54/100 → 90/100 (+67%)
- **認証系**: AuthSessionServiceTest（14ケース、100%カバレッジ）
- **打刻編集系**: StampEditService関連（80+ケース）

## セキュリティ考慮事項

### アプリケーションセキュリティ
- **HTTPS強制**: 本番環境でのTLS必須
- **CSRF保護**: トークンベースの保護
- **セッション管理**: セキュアクッキー設定
- **入力検証**: Bean Validationによる検証
- **SQLインジェクション対策**: MyBatisパラメータバインディング

### 依存関係管理
- **OWASP Dependency Check**: 脆弱性スキャン
- **Dependabot**: 自動更新提案
- **定期的な更新**: セキュリティパッチの適用

## パフォーマンス目標

### フロントエンド
- **初回表示**: 1.5秒以内
- **ページ遷移**: 500ms以内
- **APIレスポンス表示**: 200ms以内

### バックエンド
- **APIレスポンス**: 200ms以内（p95）
- **データベースクエリ**: 50ms以内（p95）
- **同時接続数**: 1000ユーザー以上

## モニタリング

### ヘルスチェック
- **Actuator**: http://localhost:8080/actuator/health
- **メトリクス**: Spring Boot Actuator経由

### ログ管理
- **アプリケーションログ**: SLF4J + Logback
- **アクセスログ**: Spring Boot組み込み
- **エラー追跡**: ログファイル出力

## プロファイル管理

### Spring Profiles
- **dev**: 開発環境（Swagger有効、詳細ログ）
- **test**: テスト環境（Testcontainers）
- **prod**: 本番環境（最適化、Swagger無効）

### ビルドプロファイル
- **開発ビルド**: ソースマップ付き、最適化なし
- **本番ビルド**: 最小化、Tree Shaking、最適化