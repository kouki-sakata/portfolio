# TeamDevelop Bravo 勤怠管理システム

モバイルフレンドリーな React + Spring Boot SPA 版の勤怠管理システムです。
*システムは現在改修中です

## 🌐 デプロイ先 & テストアカウント
- **URL:** [portfolio-eight-ebon-25.vercel.app](https://portfolio-eight-ebon-25.vercel.app/)
- **管理者:** `test@gmail.com` / `testtest`
- **一般ユーザー:** `test.user@example.com` / `TestPass123!`

## 📋 主な機能

### 一般ユーザー向け
- **打刻管理**: 出勤・退勤の記録（夜勤対応）
- **打刻履歴**: 月別の勤怠履歴閲覧・年月絞り込み
- **お知らせ**: ホーム画面でのお知らせ確認

### 管理者向け
- **従業員管理**: 従業員の登録・編集・削除
- **お知らせ管理**: お知らせの作成・編集・公開管理
- **ログ管理**: システム操作ログの閲覧

### セキュリティ
- セッションベース認証
- ロール別アクセス制御（管理者/一般ユーザー）
- CSRF トークン保護

## 🧰 技術スタック

### フロントエンド
- **コア**: React 19.1.1, TypeScript 5.8.3, Vite 7.1.7
- **ルーティング**: React Router 7.9.2
- **状態管理**: React Query 5.90.2
- **UI**: shadcn-ui@canary, Tailwind CSS 4.1.13, Radix UI
- **フォーム**: React Hook Form 7.63.0 + Zod 3.25.76
- **HTTP**: axios 1.12.2
- **テスト**: Vitest 3.2.4, Playwright 1.49.1
- **コード品質**: Biome 2.2.4

### バックエンド
- **コア**: Java 21, Spring Boot 3.4.3
- **セキュリティ**: Spring Security 6.x (セッションベース認証)
- **データアクセス**: MyBatis 3.0.4
- **API ドキュメント**: Springdoc OpenAPI 2.6.0
- **テスト**: JUnit 5, Testcontainers

### インフラ
- **データベース**: PostgreSQL 16
- **ビルド**: Gradle 8.14.2, Node.js 22.12.0
- **コンテナ**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## 🚀 セットアップ

### 必要要件
- Docker & Docker Compose
- Java 21 以上（ローカル開発時）
- Node.js 22 以上（ローカル開発時）

### Docker Compose で起動

```bash
# アプリケーション起動
docker-compose up -d

# アプリケーション停止
docker-compose down

**アクセス先:**
- アプリケーション: http://localhost:8080
- ヘルスチェック: http://localhost:8080/actuator/health
- Swagger UI (dev): http://localhost:8080/swagger-ui/index.html

# フロントエンド依存関係インストール
npm ci --prefix frontend

# （別ターミナル）フロントエンド開発サーバー起動
npm run dev --prefix frontend
```

## 🏗️ アーキテクチャ

### 認証システム
- **方式**: Spring Security セッションベース認証
- **CSRF 保護**: Cookie + `X-XSRF-TOKEN` ヘッダー（自動送信）
- **セッション管理**: React Query によるクライアント側キャッシュ（8時間有効）
- **API エンドポイント**:
  - `POST /api/auth/login` - ログイン
  - `POST /api/auth/logout` - ログアウト
  - `GET /api/auth/session` - セッション確認

詳細: [docs/authentication-system.md](docs/authentication-system.md)

### データフロー

```
React コンポーネント
  ↓ React Query hooks
axios クライアント
  ↓ HTTP (JSON)
Spring RestController
  ↓ Service層
MyBatis Mapper
  ↓ SQL
PostgreSQL 16
```

### フォルダ構成

**バックエンド:**
```
src/main/java/com/example/teamdev/
├── controller/api/      # REST API エンドポイント
├── service/            # ビジネスロジック
├── mapper/             # MyBatis マッパー
├── model/              # Entity/DTO
└── config/             # Spring 設定
```

**フロントエンド:**
```
frontend/src/
├── app/                # React Router 7 ルート定義
├── features/           # 機能別モジュール (auth, employee, stamp)
│   └── [feature]/
│       ├── api/       # API クライアント関数
│       ├── components/# 機能固有コンポーネント
│       ├── hooks/     # React Query カスタムフック
│       └── types/     # TypeScript 型定義
├── components/ui/     # shadcn-ui コンポーネント
├── shared/            # 共通ユーティリティ
└── schemas/          # Zod スキーマ（自動生成）
```

## 🔐 環境変数

主要な環境変数（詳細は `.env.example` を参照）:

| 変数 | 用途 | デフォルト |
|:-----|:-----|:-----------|
| `DB_HOST` | PostgreSQL ホスト | `localhost` |
| `DB_PORT` | PostgreSQL ポート | `15432` |
| `DB_NAME` | データベース名 | `teamdev_db` |
| `DB_USERNAME` | DB ユーザー名 | `user` |
| `DB_PASSWORD` | DB パスワード | `password` |
| `JWT_SECRET` | JWT シークレット | 32文字以上推奨 |
| `ENCRYPTION_KEY` | 暗号化キー | 32文字以上推奨 |
| `SPRING_PROFILES_ACTIVE` | Spring プロファイル | `dev` / `test` / `prod` |

**運用:**
- **ローカル**: `.env` ファイル（Git 管理外）
- **CI**: GitHub Secrets
- **本番**: Render 環境変数（render.yaml）

## 🧪 テスト戦略

### バックエンド
- **単体テスト**: Service / Mapper 層のロジックテスト
- **API テスト**: `@Tag("api")` による REST API 統合テスト
- **契約テスト**: OpenAPI 仕様との整合性検証
- **インフラ**: Testcontainers で PostgreSQL 自動起動

### フロントエンド
- **ユニットテスト**: Vitest + React Testing Library
- **E2E テスト**: Playwright でブラウザ自動化テスト
- **型チェック**: TypeScript strict モード
- **Lint**: Biome による統一的なコード品質管理

## 📦 ビルド & デプロイ

### 本番デプロイ
- **バックエンド**: Render (render.yaml で自動デプロイ設定)
- **フロントエンド**: Vercel (main ブランチ自動デプロイ)

## 🔒 セキュリティ

実装済みのセキュリティ対策:
- CSRF トークン保護（状態変更操作）
- BCrypt パスワードハッシュ（ソルト付き）
- MyBatis パラメータ化クエリ（SQL インジェクション対策）
- Content Security Policy ヘッダー
- OWASP Dependency Check（CI 自動実行）
- セッション固定攻撃対策
- セキュアな Cookie 設定（本番環境）

詳細: [docs/SECURITY.md](docs/SECURITY.md)

## 📚 ドキュメント

- [認証システムの全体像](docs/authentication-system.md)
- [セキュリティポリシー](docs/SECURITY.md)
