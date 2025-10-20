# TeamDevelop 推奨デプロイガイド（Render + Vercel 固定）

TeamDevelop Bravo を Render（Spring Boot + PostgreSQL）と Vercel（React SPA）に安全かつ継続的にデプロイするための推奨フローをまとめています。ここでは Render / Vercel を前提とし、既存のリポジトリ構成と Spring Boot 3.4 + React 19 のビルド設定に沿った手順を紹介します。

## 全体アーキテクチャ
```
Vercel (Frontend SPA) ─────→ Render Web Service (Spring Boot API)
                                  │
                                  └─ Render PostgreSQL 16
```
- SPA は `frontend/` ディレクトリをビルドし、Vercel Edge Network から配信します。
- Spring Boot は Docker 化されたコンテナとして Render Web Service で稼働し、同じ Render アカウント内の PostgreSQL 16 を利用します。
- API エンドポイントは `https://teamdev-api.onrender.com` とし、Vercel 側は環境変数で参照します。

## 事前準備チェックリスト
- [ ] `./gradlew check` と `npm run test --prefix frontend` がローカルで成功している
- [ ] GitHub リポジトリが Render / Vercel アカウントと連携済み
- [ ] 秘密情報を生成済み（32byte 以上が目安）
  ```bash
  openssl rand -base64 32  # JWT_SECRET 用
  openssl rand -base64 32  # ENCRYPTION_KEY 用
  ```
- [ ] 本番用ドメイン（サブドメイン可）を決定し、HTTPS でアクセス可能

## Render（バックエンド）デプロイ
Render 側では「PostgreSQL → Web Service」の順でセットアップします。`render.yaml` を利用すると設定の再現性が高まりおすすめです。

### 1. PostgreSQL サービス
- Dashboard → **New +** → **PostgreSQL**
- 推奨設定
  - Name: `teamdev-postgres`
  - Region: `Singapore` (フロントと地理的に近い)
  - Plan: `Starter` 以上
- 作成後、Render が自動発行するホスト / ポート / ユーザー / パスワードを控えておきます（Web Service から `fromDatabase` で参照可能）。

### 2. Web Service（Spring Boot コンテナ）
- Dashboard → **New +** → **Web Service**
  - Repository: 本リポジトリ
  - Branch: `main`
  - Runtime: `Docker`
  - Region: PostgreSQL と同じ（例: Singapore）
  - Build Command / Start Command: Dockerfile に任せるため指定不要

#### 環境変数（必須）
| Key | 推奨値 | 説明 |
|-----|--------|------|
| `SPRING_PROFILES_ACTIVE` | `prod` | 本番設定を有効化（`application-prod.properties` を利用） |
| `APP_ENVIRONMENT` | `production` | 起動ログと `StartupConfig` の環境判定に利用 |
| `APP_STARTUP_SECURITY_STRICT` | `true` | 既定の資格情報で起動しないよう強制（Render 本番では必須） |
| `JWT_SECRET` | 生成した値 | セッション署名（`security.jwt.secret`） |
| `ENCRYPTION_KEY` | 生成した値 | 重要情報暗号化キー |
| `SERVER_SERVLET_SESSION_COOKIE_SAME_SITE` | `none` | フロント（Vercel）と異なるドメイン間でセッションを共有 |
| `SERVER_SERVLET_SESSION_COOKIE_SECURE` | `true` | HTTPS 通信のみクッキー送信（Render は TLS 終端済み） |
| `SPRING_WEB_CORS_ALLOWED_ORIGINS` | `https://teamdev.vercel.app` | Spring Boot 3 の CORS プロパティ。Vercel ドメインが変わる場合はここを更新 |
| `SPRING_JACKSON_TIME_ZONE` | `Asia/Tokyo` | タイムゾーン統一（既定同一だが明示推奨） |

#### 環境変数（Render PostgreSQL から連携）
`render.yaml` では以下を `fromDatabase` でマッピングできます。GUI から設定する場合も同様に PostgreSQL サービスを参照してください。
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`

#### その他の推奨設定
- `MANAGEMENT_PORT=8081` を明示（ヘルスチェック URL: `/actuator/health`）
- `LOG_LEVEL_ROOT=WARN`, `LOG_LEVEL_APP=INFO` などログ閾値を Render 側で調整
- オートデプロイ: `main` への push で自動リリースにする（Preview は任意）

### 3. デプロイ確認
初回デプロイ後、Render のログで `StartupConfig` の WARN が出ていないことを確認し、ヘルスチェックを実行します。
```bash
curl https://teamdev-api.onrender.com/actuator/health
```
`{"status":"UP"}` が返れば API は正常に稼働しています。

## Vercel（フロントエンド）デプロイ
Vercel では `frontend/` ディレクトリをルートとして扱う設定にします。GitHub インポート時に Build & Output 設定を手動で上書きしてください。

### 1. プロジェクト設定
- Dashboard → **Add New…** → **Project**
- GitHub リポジトリをインポート
- Framework Preset: `Vite`（自動検知されない場合は手動選択）

### 2. ビルド / 出力設定
| 項目 | 設定値 |
|------|--------|
| Root Directory | `frontend` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Vercel は自動的に `NODE_VERSION` を 18/20 系に合わせます。必要に応じて `frontend/.nvmrc` に合わせたバージョンを `Environment Variables` に `NODE_VERSION=20` として指定してください。

### 3. 環境変数
| Key | 値 | 用途 |
|-----|----|------|
| `VITE_API_BASE_URL` | `https://teamdev-api.onrender.com` | フロントエンドから API を呼ぶベース URL |
| `NODE_ENV` | `production` | Vercel では自動的に `production` ですが明示を推奨 |

Preview / Development ダプロイで API を切り替えたい場合は、Vercel の Environment 別に値を設定してください。

### 4. デプロイ後確認
- `curl -I https://teamdev.vercel.app` で 200 を確認
- ブラウザで `https://teamdev.vercel.app` → ログイン → 管理画面の主要動作を確認

## CI/CD と運用
1. GitHub → main にマージ
2. Render が自動ビルド・デプロイ（Docker ベース）
3. Vercel が `frontend/` をビルドして配信
4. GitHub Actions では `./gradlew check` と `npm run test --prefix frontend` を継続実行し、失敗時はデプロイ前に検知

### 監視と保守
- UptimeRobot などで Render API の `/actuator/health` を 5 分間隔で監視
- Render の無料プランは 15 分でスリープするため、商用運用では Starter 以上へのアップグレードを推奨
- 週次で `pg_dump` によるバックアップを取得（Render Dashboard から自動スナップショットも設定可能）

## セキュリティ設定のポイント
- `APP_STARTUP_SECURITY_STRICT=true` により、デフォルト鍵での起動を防ぎます。Render 上では必ず有効化してください。
- CORS は `SPRING_WEB_CORS_ALLOWED_ORIGINS` で管理し、必要に応じて複数値（カンマ区切り）を設定します。
- セッション共有のため `SERVER_SERVLET_SESSION_COOKIE_SAME_SITE=none` と `SERVER_SERVLET_SESSION_COOKIE_SECURE=true` を同時に設定します（Chrome の制約回避）。
- HTTPS リダイレクトや HSTS は `SecurityConfig` で既に有効です。Custom ドメイン導入時は Render/Vercel 側でも TLS 設定を確認してください。

## デプロイ後チェックリスト
- [ ] `https://teamdev-api.onrender.com/actuator/health` が `UP`
- [ ] 管理者ログイン（Render 発行の DB 資格情報で seed 済みユーザーを確認）
- [ ] お知らせ管理の公開/非公開切り替え、バルク操作が完了する
- [ ] 主要 API が 200 系で応答（ブラウザ DevTools or `curl` で確認）
- [ ] Vercel 側で `VITE_API_BASE_URL` が正しく反映されている
- [ ] Render ログに WARN / ERROR が継続的に出ていない

## ロールバック手順
- **Vercel**: Dashboard → Deployments → 対象環境 → 任意の成功デプロイで **Redeploy**
- **Render**: Web Service 詳細 → Deploys → 過去の成功デプロイ → **Rollback**
- DB ロールバックが必要な場合は Render PostgreSQL の自動スナップショット or 手動 `pg_dump` を利用してください。

## 参考リソース
- Render Blueprint: リポジトリ直下の `render.yaml`
- Vercel 設定例: `frontend/vercel.json`（必要に応じて追加）
- Spring Boot 本番設定: `src/main/resources/application-prod.properties`
- セキュリティ初期化: `src/main/java/com/example/teamdev/config/StartupConfig.java`
