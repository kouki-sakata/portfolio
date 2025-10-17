# TeamDevelop デプロイメントガイド

Spring Boot + React SPA をVercel（フロントエンド）とRender（バックエンド）にデプロイするためのクイックガイドです。

## 📋 クイックスタート

### アーキテクチャ
```
Vercel (Frontend) ←→ Render (Backend + PostgreSQL)
```

### 事前準備チェックリスト

- [ ] テスト・リンティング・型チェック通過
- [ ] Vercel/Renderアカウント作成・GitHub連携
- [ ] JWT_SECRET/ENCRYPTION_KEY生成（`openssl rand -base64 32`）

## 🚀 Renderデプロイ（バックエンド）

### 1. PostgreSQL作成
- Dashboard → "New +" → "PostgreSQL"
- Name: `teamdev-postgres`, Region: `Singapore`, Plan: `Starter`

### 2. Web Service作成
- Dashboard → "New +" → "Web Service"
- Repository選択、Branch: `main`, Runtime: `Docker`

### 3. 環境変数設定
```bash
SPRING_PROFILES_ACTIVE=prod
DB_HOST=[Renderが自動設定]
DB_PASSWORD=[Renderが自動設定]
JWT_SECRET=[生成した値]
ENCRYPTION_KEY=[生成した値]
```

### 4. デプロイ確認
```bash
curl https://your-app.onrender.com/actuator/health
```

## 🌐 Vercelデプロイ（フロントエンド）

### 1. プロジェクト作成
- Dashboard → "Add New..." → "Project"
- GitHubリポジトリをインポート

### 2. ビルド設定
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm ci`

### 3. 環境変数設定
```bash
VITE_API_BASE_URL=https://your-app.onrender.com
NODE_ENV=production
```

## 🔒 重要なセキュリティ設定

### CORS設定（無料ドメイン用）

`src/main/java/com/example/teamdev/config/CorsConfig.java`:
```java
@Value("${app.cors.allowed-origins}")
private String[] allowedOrigins;

@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowCredentials(true)
            .maxAge(3600);
}
```

`application-prod.properties`:
```properties
app.cors.allowed-origins=https://teamdev.vercel.app
server.servlet.session.cookie.same-site=none  # 異なるドメイン間通信に必須
```

## 💡 無料ドメイン運用のポイント

### 推奨命名
```
Frontend: teamdev.vercel.app
Backend:  teamdev-api.onrender.com
```

### Renderスリープ対策（必須）
無料プランは15分間アクセスなしでスリープします。

**推奨: UptimeRobot（無料）**
- https://uptimerobot.com/ でアカウント作成
- Monitor Type: `HTTP(s)`
- URL: `https://teamdev-api.onrender.com/actuator/health`
- Interval: `5 minutes`

### 環境変数管理
```typescript
// ❌ 避ける
const API_URL = 'https://teamdev-api.onrender.com';

// ✅ 推奨
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

## ✅ デプロイ後検証

### ヘルスチェック
```bash
curl https://your-api.onrender.com/actuator/health
curl -I https://your-app.vercel.app
```

### 機能テスト
- [ ] ログイン/ログアウト動作
- [ ] CSRF保護動作
- [ ] 主要機能動作確認

## 🔧 トラブルシューティング

### CORSエラー
- `CorsConfig.java`でVercelドメインを追加
- `allowCredentials(true)`確認
- Render再デプロイ

### セッション認証エラー
```properties
server.servlet.session.cookie.same-site=none  # 必須
server.servlet.session.cookie.secure=true
```

### データベース接続エラー
- 環境変数 `DATABASE_URL` 確認
- PostgreSQLサービス稼働確認

### メモリ不足
- Renderプランを$7/月のStarterにアップグレード

## 📊 環境変数一覧

### Render（必須）
| 変数名 | 値 |
|--------|-----|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | `[32文字以上]` |
| `ENCRYPTION_KEY` | `[32文字以上]` |
| `DB_HOST` | `[自動設定]` |
| `DB_PASSWORD` | `[自動設定]` |

### Vercel（必須）
| 変数名 | 値 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://teamdev-api.onrender.com` |
| `NODE_ENV` | `production` |

## 🔄 ロールバック手順

### Vercel
Dashboard → Deployments → 前のデプロイを選択 → "Redeploy"

### Render
Dashboard → Service → Deploy → "Rollback"

## 📈 運用チェックリスト

- [ ] 明確なドメイン名（変更困難）
- [ ] CORS設定が適切
- [ ] Cookie設定が適切（`same-site=none`）
- [ ] UptimeRobotで監視設定
- [ ] 週1回手動バックアップ
- [ ] 環境変数でURL管理

## 📚 参考リンク

- **設定ファイル**: `vercel.json`, `render.yaml`（リポジトリルート）
- **Render サポート**: https://help.render.com/
- **Vercel サポート**: https://vercel.com/help

---

**作成日**: 2025年1月16日 | **バージョン**: 1.0