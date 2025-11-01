# セキュリティポリシー

TeamDevelop Bravo 勤怠管理システムのセキュリティポリシーと実装詳細を記載します。

## 📋 目次

- [セキュリティ方針](#セキュリティ方針)
- [認証・認可](#認証認可)
- [CSRF 保護ポリシー](#csrf-保護ポリシー)
- [セキュリティヘッダー](#セキュリティヘッダー)
- [セッション管理](#セッション管理)
- [データ保護](#データ保護)
- [脆弱性報告](#脆弱性報告)

---

## セキュリティ方針

### 基本原則

1. **多層防御**: 複数のセキュリティレイヤーを実装
2. **最小権限**: 必要最小限の権限のみを付与
3. **セキュアバイデフォルト**: 安全な設定をデフォルト化
4. **継続的改善**: 定期的なレビューと脆弱性スキャン

### 対象範囲

Spring Boot (Java 21) / React (TypeScript) / PostgreSQL / Docker / CI/CD

---

## 認証・認可

### 認証方式

**セッションベース認証** (Spring Security + BCrypt)

| エンドポイント | 必要な権限 | 説明 |
|--------------|-----------|------|
| `/api/auth/login` | なし | ログイン |
| `/api/auth/session` | なし | セッション確認 |
| `/api/auth/logout` | なし | ログアウト |
| `/api/home/**` | 認証済み | ホーム画面 |
| `/api/stamp-history` | 認証済み | 打刻履歴取得 |
| `/api/stamps/**` | 認証済み | 打刻履歴更新・削除 |
| `/api/admin/**` | `ROLE_ADMIN` | 管理機能 |
| `/api/employees/**` | `ROLE_ADMIN` | 従業員管理 |

### ログイン・ログアウトフロー

**ログイン**:
1. `POST /api/auth/login` (email, password)
2. BCrypt パスワード検証 → セッション作成
3. `JSESSIONID` Cookie + `XSRF-TOKEN` Cookie 発行

**ログアウト**:
1. `POST /api/auth/logout`
2. セッション無効化 + Cookie 削除
3. `/signin` にリダイレクト (`replace: true`)

### セッション設定

| 設定項目 | 値 | 説明 |
|---------|---|------|
| タイムアウト | 8時間 | AuthProvider 設定 |
| 警告表示 | 15分前 | セッション期限前 |
| 最大同時セッション数 | 1 | 新規ログインで既存破棄 |
| 自動延長 | 無効 | 手動再ログイン必須 |

---

## CSRF 保護ポリシー

### 基本方針

**Cookie + Custom Header** 方式を採用

```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/actuator/**", "/api/auth/login", "/api/auth/logout")
)
```

### 除外エンドポイント

| エンドポイント | 理由 | リスク評価 | 最終レビュー |
|--------------|------|-----------|------------|
| `/actuator/**` | ヘルスチェック (読み取り専用) | 🟢 Low | 2025-10-13 |
| `/api/auth/login` | 初回認証 (セッション未確立) | 🟢 Low | 2025-10-13 |
| `/api/auth/logout` | セッション破棄のみ | 🟢 Low | 2025-10-13 |

### ログアウトエンドポイントの CSRF 除外

#### 正当性

- **業界標準**: Spring Security / OWASP 推奨パターン
- **採用企業**: GitHub, GitLab, Auth0 など

#### リスク評価

**攻撃シナリオ**: 悪意のあるサイトが `<img src="/api/auth/logout" />` で強制ログアウト

**影響**:
- データ損失: なし
- 権限昇格: なし
- 復旧可能性: ユーザーは即座に再ログイン可能
- ビジネス影響: 一時的な不便のみ

**リスクレベル**: 🟢 **Low**

#### 補完的コントロール

1. セッション無効化: `invalidateHttpSession(true)`
2. Cookie 削除: `deleteCookies("JSESSIONID")`
3. 最大セッション数: 1 (複数セッション防止)
4. HSTS: HTTPS 強制 (MITM 攻撃防止)
5. CSP: `frame-ancestors 'none'` (Clickjacking 防止)

#### モニタリング

- 異常検知: 短時間での大量ログアウト (10回/5分以上)
- ログ記録: すべてのログアウトをセキュリティログに記録
- アラート: 疑わしいパターン検知時に通知

---

## セキュリティヘッダー

| ヘッダー | 設定値 | 効果 |
|---------|-------|------|
| HSTS | max-age=31536000, includeSubDomains | HTTPS 強制、MITM 攻撃防止 |
| CSP | default-src 'self'; frame-ancestors 'none' | XSS 影響最小化、Clickjacking 防止 |
| X-Frame-Options | DENY | iframe 埋め込みブロック |
| X-Content-Type-Options | nosniff | MIME スニッフィング攻撃防止 |

---

## セッション管理

### Cookie 設定

| Cookie名 | HttpOnly | Secure | SameSite | 目的 |
|---------|----------|--------|----------|------|
| `JSESSIONID` | ✅ Yes | ✅ Yes (本番) | Lax | セッション ID |
| `XSRF-TOKEN` | ❌ No | ✅ Yes (本番) | Lax | CSRF トークン |

**注意**: `XSRF-TOKEN` は JavaScript からアクセス可能である必要があります。

### セッション無効化ポリシー

**自動**: タイムアウト (8時間) / ログアウト / 新規ログイン
**手動**: 管理者による強制ログアウト (実装予定)

---

## データ保護

### パスワード保護

- **ハッシュ**: BCrypt with salt (rounds=10)
- **特徴**: ソルト自動生成、レインボーテーブル攻撃耐性

### SQL インジェクション対策

- **MyBatis**: すべてのクエリで `#{}` (プリペアドステートメント) を使用
- **禁止**: `${}` による直接埋め込み

### XSS 対策

- **React**: 自動エスケープ (デフォルト)
- **注意**: `dangerouslySetInnerHTML` 使用時は DOMPurify でサニタイズ

### 機密情報管理

- **環境変数**: `DB_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY`
- **保存場所**: ローカル (`.env`), CI (GitHub Secrets), 本番 (AWS Secrets Manager / Azure Key Vault)

---

## 脆弱性報告

### 報告方法

**GitHub Security Advisory** を使用:

1. [Security Advisories](https://github.com/kouki-sakata/portfolio/security/advisories) を開く
2. **New draft security advisory** をクリック
3. 脆弱性の詳細、再現手順、影響範囲、推奨修正方法を提供

### レスポンスタイム目標

| 深刻度 | 初期応答 | 修正リリース |
|-------|---------|------------|
| Critical | 24時間以内 | 7日以内 |
| High | 48時間以内 | 30日以内 |
| Medium | 1週間以内 | 90日以内 |
| Low | 2週間以内 | 次回リリース |

### セキュリティレビュー

**定期監査**: 6ヶ月ごと (4月・10月)

**チェック項目**:
- 依存関係更新
- セキュリティ設定見直し
- ログ分析
- OWASP Top 10 ペネトレーションテスト
- ドキュメント更新

**監視メトリクス**:
- 認証失敗率 < 5%
- CSRF エラー < 0.1%
- Critical/High 脆弱性 = 0

---

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [React Security Best Practices](https://react.dev/learn/react-security)

---

**最終更新**: 2025-10-13
**次回レビュー**: 2026-04-13
**責任者**: セキュリティチーム

セキュリティに関する質問や提案は、GitHub Issues または Security Advisory でお問い合わせください。
