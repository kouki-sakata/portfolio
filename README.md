# TeamDevelop Bravo 勤怠管理システム

モバイルフレンドリーな React + Spring Boot SPA 版の勤怠管理システムです。既存の Thymeleaf 実装を置き換え、PostgreSQL へのマイグレーションと合わせてフロントエンド／バックエンドを再構築しました。

## 🌐 デプロイ先 & テストアカウント

- **URL:** [portfolio-eight-ebon-25.vercel.app](https://portfolio-eight-ebon-25.vercel.app/)
- **管理者:** `admin.user@example.com` / `AdminPass123!`
- **一般ユーザー:** `test.user@example.com` / `TestPass123!`

> ⚠️ 本番環境は移行作業中です。最新の UI はローカルまたはステージングで確認してください。

## 🧰 技術スタック

| レイヤー | 採用技術 |
|:---------|:---------|
| **フロントエンド** | React 19, TypeScript, Vite, React Router 7, React Query 5, shadcn-ui@canary, Vitest, Playwright, Biome |
| **バックエンド** | Java 21, Spring Boot 3.4, Spring Security, MyBatis, Testcontainers |
| **データベース** | PostgreSQL 16 (コンテナ・ローカル・本番共通) |
| **ビルド/パッケージ** | Gradle 8.14.2, npm 10, Docker, Docker Compose |
| **CI/CD** | GitHub Actions (lint/test/build/SonarCloud/OWASP Dependency Check) |
| **コード品質** | Biome (lint/format), OpenAPI contract testing, E2E testing |

## ✨ 主な改善ポイント

- **SPA 化**: React + TypeScript + React Query によるシングルページ構成。Spring MVC 側は API と SPA フォワーダーのみを提供
- **認証の再設計**: `/api/auth` エンドポイントでセッションベースのログイン／ログアウト／セッション確認を実装。CSRF トークンは Cookie + `X-XSRF-TOKEN` で自動送出
- **API 完全分離**: 従業員管理、打刻登録、打刻履歴を JSON API 化し、React から呼び出す構成へ移行
- **PostgreSQL 移行**: MySQL 依存を排除し、Docker Compose／Testcontainers／CI すべてを Postgres 16 に統一
- **コード品質向上**: Biome による統一的な lint/format、OpenAPI contract testing、包括的な E2E テスト

## 🏗️ アーキテクチャ詳細

### 認証アーキテクチャ
- **セッション方式**: Spring Security セッションベース認証
- **CSRF保護**: Cookie + `X-XSRF-TOKEN` ヘッダー
- **セッションチェック**: `/api/auth/session` エンドポイント
- **状態管理**: React Query によるクライアント側セッション管理

## 🚀 セットアップ

### 1. Docker Compose を使う（推奨）

```bash
# リポジトリ取得
git clone https://github.com/your-org/TeamDevelopBravo.git
cd TeamDevelopBravo-main

# 環境変数テンプレートをコピー
cp .env.example .env

# コンテナ起動
docker-compose up -d

# 初回のみログ確認
docker-compose logs -f app
```

- アプリ: http://localhost:8080
- ヘルスチェック: http://localhost:8080/actuator/health
- PostgreSQL: `localhost:5432` (`DOCKER_DB_USERNAME` / `DOCKER_DB_PASSWORD`)

### 2. ローカルで直接実行

#### 必要要件

- Java 21 (Eclipse Temurin 推奨)
- Node.js 22+
- PostgreSQL 16

#### 手順

```bash
# 1. リポジトリ取得
git clone https://github.com/your-org/TeamDevelopBravo.git
cd TeamDevelopBravo-main

# 2. フロント依存をセットアップ
npm ci --prefix frontend

# 3. PostgreSQL を準備
createdb teamdev_db
psql -d teamdev_db -f src/main/resources/01_schema.sql
psql -d teamdev_db -f src/main/resources/02_data.sql

# 4. バックエンドを起動
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# 5. （任意）Vite Dev Server を起動しホットリロード利用
npm run dev --prefix frontend
```

> Vite Dev Server を併用する場合は、`frontend/.env.local` に `VITE_API_BASE_URL=http://localhost:8080/api` を設定してください。

## 🔐 環境変数 & シークレット管理

| 変数 | 用途 | デフォルト | 備考 |
|:-----|:-----|:-----------|:-----|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | PostgreSQL 接続先 | `localhost` / `5432` / `teamdev_db` | CI では `127.0.0.1` を利用 |
| `DB_USERNAME` / `DB_PASSWORD` | DB 認証情報 | `user` / `password` | **本番では必ずシークレットストアに保管** |
| `JWT_SECRET` | 認証トークン用シークレット | placeholder | 32〜64 文字以上を推奨 |
| `ENCRYPTION_KEY` | アプリ内暗号化キー | placeholder | 32 文字以上 |
| `LOG_LEVEL_*` | ログレベル | `INFO` 等 | 監査要件に応じて調整 |
| `VITE_API_BASE_URL` | フロントエンドの API ルート | `/api` | Dev Server 利用時に上書き |

**運用のベストプラクティス**

1. **ローカル**: `.env` / `frontend/.env.local` に保存 (Git 管理外)
2. **CI**: GitHub Secrets (`DB_PASSWORD`, `JWT_SECRET` など) で提供
3. **本番**: AWS Secrets Manager 等を使用し、Elastic Beanstalk / ECS に注入

## 🧪 テスト & ビルド

### バックエンドテスト

```bash
# 全テスト実行（Testcontainers使用）
./gradlew test

# API集中テスト
./gradlew apiTest

# 単一テスト実行
./gradlew test --tests "ClassName.methodName"

# OpenAPI契約テスト
./gradlew contractTest -PenableOpenApiContract
```

### フロントエンドテスト

```bash
# Lint + Format
npm run lint:fix --prefix frontend

# ユニットテスト（Vitest）
npm run test --prefix frontend

# 単一テストファイル
npm run test --prefix frontend -- AuthService.test.tsx

# E2Eテスト（Playwright）
npm run test:e2e --prefix frontend

# 初回Playwrightセットアップ
npm run --prefix frontend playwright install --with-deps
```

### ビルド

```bash
# 本番ビルド（フロントエンド自動ビルド含む）
./gradlew build

# フロントエンドのみビルド
npm run build --prefix frontend

# OpenAPI型定義再生成
npm run generate:api --prefix frontend
```

> `./gradlew test` は Testcontainers で PostgreSQL を起動するため、Docker が動作する環境で実行してください。

## 🎨 Biome 設定

プロジェクトは Biome で統一的な lint/format を実施しています。

### ファイル別ルール

- **UIコンポーネント** (`components/ui/**`): Radix UI 互換性のため緩和されたルール
- **テストファイル** (`**/*.test.ts`, `**/e2e/**`): 複雑度制限なし、マジックナンバー許可
- **生成ファイル** (`schemas/api.ts`, `types/**`): lint/format 無効
- **Auth機能** (`features/auth/**`): 非同期操作のため `noVoid` 無効

## 🗃️ PostgreSQL 移行ガイド

MySQL からのデータ移行や既存環境の切り替え手順は [docs/postgres-migration-guide.md](docs/postgres-migration-guide.md) を参照してください。

- 事前チェックリスト
- `pgloader` を使った移行例
- 本番切り戻し戦略
- GitHub Actions / Docker Compose の更新ポイント

## 🔍 Swagger(OpenAPI) を使った API テスト

### 基本的な使い方

1. バックエンドを起動: `SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun`
2. ブラウザで http://localhost:8080/swagger-ui/index.html を開く
3. `Authorize` からテスト用の認証ヘッダーを設定
4. `GET /api/auth/session` で CSRF トークンを取得
5. `POST /api/auth/login` 等を実行してレスポンスを確認

### 推奨開発フロー

1. **Swagger で API の挙動を整理** → 統合テストを順次追加
2. **API が安定したら** → React 側はサービス層モックやユニットテストでカバー強化
3. **最後に Playwright E2E** → UI フロー（ログイン成功／失敗）を確認し全体整合性を取る

## 🌱 プロファイル運用

- `SPRING_PROFILES_ACTIVE=dev`: 開発向け。Swagger UI 有効、詳細ログ
- `SPRING_PROFILES_ACTIVE=test`: テスト向け。Testcontainers 等を利用
- `SPRING_PROFILES_ACTIVE=prod`: 本番向け。Swagger UI 無効、ログ抑制

## 🚦 CI/CD パイプライン

### ci.yml（メインパイプライン）

- Node 22 + npm ci
- `npm run lint` / `npm run test`（フロントエンド）
- PostgreSQL サービスを起動して `./gradlew test`
- `./gradlew build` / SonarCloud / Docker build

### feature.yml（ブランチチェック）

- ブランチ命名規則チェック
- Quick test（コンパイル + 並列テスト）
- セキュリティチェック（OWASP Dependency Check）
- Docker ビルド検証

## 🤖 Ultracite クイックスタート（推奨）

Ultracite はタスクランナーとして主要コマンドを統合管理できます。

```bash
# 事前準備
nvm install 22.12.0 && nvm use 22.12.0

# 一時実行
npx ultracite@latest

# グローバルインストール
npm i -g ultracite && ultracite
```

### 主要タスク

- API集中テスト: `SPRING_PROFILES_ACTIVE=test ./gradlew apiTest`
- 全テスト: `SPRING_PROFILES_ACTIVE=test ./gradlew test`
- 契約テスト: `SPRING_PROFILES_ACTIVE=test ./gradlew -PenableOpenApiContract contractTest`
- フロントLint/Unit: `npm run lint --prefix frontend` / `npm run test --prefix frontend`

設定ファイル: `ultracite.config.json`
詳細: `docs/ultracite-setup.md`

## 🔑 重要な統合ポイント

### API プロキシ

- **開発**: Vite が `/api/*` を `localhost:8080` にプロキシ
- **本番**: Spring が `/` から SPA を、`/api/*` から API を配信

### データベースマイグレーション

- スキーマ: `src/main/resources/01_schema.sql`
- 初期データ: `src/main/resources/02_data.sql`
- Testcontainers が起動時に自動適用

### フロントエンドビルド統合

- Gradle タスク `npmBuild` が `processResources` の前に実行
- ビルド成果物は `src/main/resources/static/` にコピー
- Spring Boot が単一の実行可能 JAR として配信

## ⚡ パフォーマンス考慮事項

- React Query キャッシングで API コール最小化
- Spring Boot `@Cacheable` で高コスト操作をキャッシュ
- HikariCP コネクションプーリング（デフォルト設定）
- Vite コード分割で最適なバンドルサイズ

## 🔒 セキュリティチェックリスト

- CSRF トークンは状態変更操作で必須
- BCrypt パスワードハッシュ with ソルト
- MyBatis パラメータ化クエリ（SQL インジェクション対策）
- Content Security Policy ヘッダー設定済み
- CI で OWASP 依存関係スキャン実施
