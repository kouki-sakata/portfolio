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
- **TypeScript**: 型安全な開発（v5.8.3、strictモード有効 - exactOptionalPropertyTypes除く）
- **Vite**: 高速ビルドツール（v7.1.7）
- **React Router 7**: SPAルーティング（v7.9.2）

### UIライブラリ
- **React Query 5**: サーバー状態管理（v5.90.2）
- **shadcn/ui**: Radix UIベースのコンポーネントライブラリ
  - Radix UI React Label (v2.1.7)
  - Radix UI React Slot (v1.2.3)
  - Radix UI React Toast (v1.2.15)
- **Tailwind CSS 4**: ユーティリティファーストCSS（v4.1.13）
- **Lucide React**: アイコンライブラリ（v0.544.0）
- **class-variance-authority**: コンポーネントバリアント管理（v0.7.1）
- **レスポンシブデザイン**: モバイルファースト設計

### 開発ツール
- **ESLint 9**: コード品質管理（v9.36.0）
- **Prettier**: コードフォーマット（v3.6.2）
- **Vitest**: 単体テストフレームワーク（v3.2.4）
- **Playwright**: E2Eテスト（v1.49.1）
- **Testing Library**: React テストユーティリティ
- **@hey-api/openapi-ts**: OpenAPI仕様からTypeScript型を自動生成（v0.84.3）
- **openapi-zod-client**: OpenAPIからZodスキーマを生成（v1.18.3）
- **Zod**: ランタイムスキーマバリデーション（v3.25.76）

### ビルド設定
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run preview      # ビルドプレビュー
npm run lint         # ESLintチェック
npm run lint:fix     # ESLint自動修正
npm run typecheck    # TypeScript型チェック
npm run test         # Vitestテスト実行
npm run test:watch   # テストウォッチモード
npm run test:e2e     # Playwright E2Eテスト
npm run format       # Prettierフォーマット
npm run generate:api # OpenAPI仕様からTypeScript型とZodスキーマを生成
npm run generate:api-types    # TypeScript型のみ生成
npm run generate:zod-schemas   # Zodスキーマのみ生成
```

## バックエンド

### 主要技術スタック
- **Java 21**: Eclipse Temurin（LTS版）
- **Spring Boot 3.4.3**: エンタープライズJavaフレームワーク
- **Spring Security**: 認証・認可フレームワーク
- **MyBatis 3.0.4**: SQLマッパーフレームワーク

### データベース
- **PostgreSQL 16**: プライマリデータベース
- **HikariCP**: コネクションプーリング
- **データベース初期化**: `01_schema.sql` / `02_data.sql`

### 認証・セキュリティ
- **セッションベース認証**: Spring Session
- **CSRF保護**: Spring Security CSRF トークン
- **ロールベースアクセス制御**: 管理者/一般ユーザー

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
  - ESLint
  - Prettier
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