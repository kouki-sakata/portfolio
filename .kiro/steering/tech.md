# TeamDevelop Bravo 技術スタック

## アーキテクチャ

### システムアーキテクチャ
- **タイプ**: モノリシックSPAアプリケーション
- **パターン**: Spring Boot APIバックエンド + React SPAフロントエンド
- **データベース戦略**: PostgreSQL 16によるRDBMS
- **デプロイメント**: Docker Compose / AWS Elastic Beanstalk

### アーキテクチャ原則
- **API設計**: RESTful APIパターン、OpenAPI 3.0仕様準拠
- **状態管理**: React Query 5によるサーバー側状態管理
- **セキュリティファースト**: Spring Security 6.4による認証・認可
- **関心の分離**: フロントエンド/バックエンド完全分離
- **型安全性**: TypeScript + Zod + OpenAPI自動生成による端間型安全

## フロントエンド

### コアフレームワーク
- **React 19.1.1**: 最新のReactフレームワーク
- **TypeScript 5.8.3**: 型安全な開発（strictモード有効）
  - satisfies演算子による型制約の保証
  - Branded Typesによる名義的型付け（ID誤用防止）
  - Template Literal Typesによる型安全なAPIパス
  - 型述語関数による実行時型チェック
- **Vite 7.1.7**: 高速ビルドツール、コード分割最適化
- **React Router 7.9.2**: SPAルーティング、遅延読み込み対応

### UIライブラリ
- **React Query 5.90.2**: サーバー状態管理
  - QueryClient最適化設定（staleTime: 5分、gcTime: 10分）
  - 認証フック統合（useSession、useLogin、useLogout）
  - エラーリトライ戦略（exponential backoff、最大3回）
  - Suspenseモードサポート（React 19統合）
  - Route Loader統合によるプリフェッチング
- **TanStack Table 8.21.3**: 高性能テーブル/データグリッドライブラリ
  - Headless UIパターンによる完全なカスタマイズ性
  - ソート、フィルタリング、ページネーション機能
  - 大規模データセットの仮想化対応
- **shadcn/ui@canary**: React 19対応コンポーネントライブラリ
  - Radix UIベース（v1.1.15〜v2.2.6）
  - Button、Form、Input、Label、Toast等の基本UIコンポーネント
  - DataTableコンポーネント（TanStack Table統合）
- **React Hook Form 7.63.0**: フォーム状態管理
  - Zod統合によるランタイムバリデーション
  - 高パフォーマンスな非制御コンポーネント
- **Tailwind CSS 4.1.13**: ユーティリティファーストCSS
- **Lucide React 0.544.0**: アイコンライブラリ

### 開発ツール
- **Biome 2.2.4**: 統合コード品質管理ツール
  - ESLint/Prettier代替の高速リンター・フォーマッター
  - 単一設定ファイル（biome.jsonc）で管理
- **Vitest 3.2.4**: 単体テストフレームワーク（500+ tests）
- **MSW 2.11.3**: API モックフレームワーク
  - 統合テストでのHTTP通信シミュレーション
  - エラーハンドリングやリトライメカニズムのテスト
- **Playwright 1.49.1**: E2Eテスト
  - クロスブラウザテスト自動化
  - ビジュアルレグレッションテスト
- **@hey-api/openapi-ts 0.84.3**: TypeScript型自動生成
- **openapi-zod-client 1.18.3**: Zodスキーマ生成
- **Lighthouse CI 0.13.x**: パフォーマンス監視

### ビルド設定
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド（TypeScriptチェック含む）
npm run build:analyze # バンドル分析
npm run preview      # ビルドプレビュー
npm run lint         # Biomeリントチェック
npm run lint:fix     # Biome自動修正
npm run typecheck    # TypeScript型チェック
npm run test         # Vitestテスト実行
npm run test:watch   # テストウォッチモード
npm run test:e2e     # Playwright E2Eテスト
npm run test:e2e:headed # ブラウザUI付きE2E
npm run test:e2e:ui  # Playwright UI モード
npm run format       # Biomeフォーマット
npm run biome:ci     # CI用Biomeチェック
npm run generate:api # OpenAPI仕様から型生成
npm run perf:verify  # パフォーマンステスト
npm run perf:lhci    # Lighthouse CI実行
npm run measure:bundle # バンドルサイズ測定
```

### APIクライアント層
- **アーキテクチャパターン**: 機能別モジュール化されたAPIクライアント
- **型生成**: OpenAPI仕様からの自動生成
- **API実装構造**:
  - `auth/api/`: 認証・セッション管理
  - `employees/api/`: 従業員CRUD操作
  - `home/api/`: ダッシュボード・打刻機能
  - `stampHistory/api/`: 打刻履歴管理
- **React Query統合**:
  - カスタムフック実装（useAuth、useEmployees等）
  - 最適化されたキャッシュ戦略
  - グローバルエラーハンドリング
- **エラーハンドリング**:
  - カスタムエラークラス階層
  - エラー重要度とリトライ可能性の評価
  - ErrorBoundaryによるコンポーネントレベルエラー捕捉

## バックエンド

### 主要技術スタック
- **Java 21**: Eclipse Temurin（LTS版）
- **Spring Boot 3.4.3**: エンタープライズJavaフレームワーク
- **Spring Security 6.4**: 認証・認可フレームワーク
- **MyBatis 3.0.4**: SQLマッパーフレームワーク

### サービス層アーキテクチャ（SOLID原則準拠）
- **ファサードパターン**: 複雑性の隠蔽と統一インターフェース提供
- **単一責任の原則**: 各サービスが明確な責務を持つ
- **専門サービス分離**:
  - **従業員管理系**: Query/Command分離（CQRS）
  - **認証系**: AuthenticationService、AuthSessionService
  - **打刻系**: 登録・編集・履歴・削除・出力の分離
  - **お知らせ管理系**: 登録・公開・削除の分離

### データベース
- **PostgreSQL 16**: プライマリデータベース
- **HikariCP**: コネクションプーリング（デフォルト設定）
- **データベース初期化**: SQLスクリプト自動実行
  - `01_schema.sql`: スキーマ定義
  - `02_data.sql`: 初期データ

### 認証・セキュリティ
- **セッションベース認証**: Spring Session（8時間有効）
- **CSRF保護**: Cookie + X-XSRF-TOKENヘッダー
- **ロールベースアクセス制御**: 管理者/一般ユーザー
- **BCrypt**: パスワードハッシング

### APIドキュメント
- **Springdoc OpenAPI 2.6.0**: API仕様生成
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html（devプロファイル）
- **OpenAPI契約テスト**: OpenAPI4j 1.0.7

### ビルドツール
- **Gradle 8.14.2**: ビルド自動化
- **Node-Gradle Plugin**: フロントエンドビルド統合
- **主要タスク**:
```bash
./gradlew build      # フルビルド（フロントエンド含む）
./gradlew test       # 全テスト実行（Testcontainers使用）
./gradlew apiTest    # API特化テスト
./gradlew contractTest -PenableOpenApiContract  # 契約テスト
./gradlew bootRun    # Spring Boot起動
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
  - Playwright Test for VSCode

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

# ログレベル
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_WEB=DEBUG
```

### フロントエンド環境変数
```properties
# API設定
VITE_API_BASE_URL=http://localhost:8080/api

# 開発設定
VITE_DEBUG_MODE=true

# パフォーマンス分析
VITE_ANALYZE_BUNDLE=true
```

## ポート設定

### 開発ポート
- **8080**: Spring Boot APIサーバー
- **5173**: Vite開発サーバー
- **5432**: PostgreSQL（ローカル）
- **15432**: PostgreSQL（Docker）

### テストポート
- **Random**: Testcontainersが動的に割り当て

## CI/CD

### GitHub Actions
- **ci.yml**: メインCIパイプライン
  - フロントエンドlint/test/build
  - バックエンドテスト（PostgreSQL）
  - Dockerビルド
  - SonarCloud分析

- **feature.yml**: フィーチャーブランチ検証
  - 命名規則チェック
  - セキュリティスキャン（OWASP）
  - クイックテスト

### テスト戦略
1. **単体テスト**: JUnit 5 / Vitest（カバレッジ80%+）
2. **統合テスト**: Spring Boot Test + Testcontainers / MSW
3. **E2Eテスト**: Playwright（主要フロー）
4. **契約テスト**: OpenAPI4j（API仕様準拠）
5. **パフォーマンステスト**: Lighthouse CI

### テストカバレッジ目標
- **全体**: 500+ テスト、98%+ 成功率
- **バックエンド**: 85%以上
- **フロントエンド**: 80%以上
- **E2E**: 主要ユーザーフローの100%カバー

## セキュリティ考慮事項

### アプリケーションセキュリティ
- **HTTPS強制**: 本番環境でのTLS必須
- **CSRF保護**: トークンベースの保護
- **セッション管理**: HttpOnly、Secureクッキー
- **入力検証**: Bean Validation + Zod
- **SQLインジェクション対策**: MyBatisパラメータバインディング
- **XSS対策**: React自動エスケープ

### 依存関係管理
- **OWASP Dependency Check**: 脆弱性スキャン
- **Dependabot**: 自動更新提案
- **npm audit**: フロントエンド脆弱性チェック

## パフォーマンス目標

### フロントエンド
- **初回表示（LCP）**: 1.5秒以内
- **インタラクティブ（TTI）**: 2秒以内
- **ページ遷移**: 500ms以内
- **バンドルサイズ**: JavaScript 300KB以下

### バックエンド
- **APIレスポンス**: p95 200ms以内
- **データベースクエリ**: p95 50ms以内
- **同時接続数**: 1000ユーザー以上
- **稼働率**: 99.9%以上

## モニタリング

### ヘルスチェック
- **Actuator**: http://localhost:8080/actuator/health
- **メトリクス**: Spring Boot Actuator経由
- **カスタムメトリクス**: Micrometer統合

### ログ管理
- **アプリケーションログ**: SLF4J + Logback
- **アクセスログ**: Spring Boot組み込み
- **エラー追跡**: ログレベル別出力

### パフォーマンス監視
- **Lighthouse CI**: 自動パフォーマンステスト
- **Core Web Vitals**: LCP、TTI、CLS測定
- **バンドル分析**: Vite bundle analyzer
- **API監視**: Spring Boot Actuator metrics

## プロファイル管理

### Spring Profiles
- **dev**: 開発環境（Swagger有効、詳細ログ、ホットリロード）
- **test**: テスト環境（Testcontainers、最小ログ）
- **prod**: 本番環境（最適化、Swagger無効、セキュリティ強化）

### ビルドプロファイル
- **開発ビルド**: ソースマップ付き、最適化なし
- **本番ビルド**: 最小化、Tree Shaking、コード分割

## 技術選定理由

### フロントエンド選定
- **React 19**: 最新機能（Suspense、Concurrent Features）活用
- **TypeScript**: 型安全性によるバグ削減、開発効率向上
- **React Query**: サーバー状態管理の簡素化、キャッシュ最適化
- **Vite**: 高速な開発体験、最適化されたビルド
- **shadcn/ui**: カスタマイズ可能、React 19対応

### バックエンド選定
- **Java 21**: LTSサポート、仮想スレッド、パターンマッチング
- **Spring Boot 3.4**: エンタープライズグレード、豊富なエコシステム
- **PostgreSQL**: ACID準拠、高性能、豊富な機能
- **MyBatis**: 柔軟なSQL制御、既存SQLの活用

### 開発ツール選定
- **Biome**: ESLint/Prettier統合、高速実行
- **Playwright**: クロスブラウザE2E、ビジュアルテスト
- **Docker**: 環境統一、簡単なセットアップ

---
*Last Updated: 2025-01-09*
*Tech Stack Version: 2.0*