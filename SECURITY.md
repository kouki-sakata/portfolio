# セキュリティポリシー

TeamDevelop Bravo 勤怠管理システムのセキュリティポリシーと実装詳細を記載します。

## 📋 目次

- [セキュリティ方針](#セキュリティ方針)
- [認証・認可アーキテクチャ](#認証認可アーキテクチャ)
- [CSRF 保護ポリシー](#csrf-保護ポリシー)
- [セキュリティヘッダー設定](#セキュリティヘッダー設定)
- [セッション管理](#セッション管理)
- [データ保護](#データ保護)
- [脆弱性報告](#脆弱性報告)
- [セキュリティレビュープロセス](#セキュリティレビュープロセス)

---

## セキュリティ方針

### 基本方針

TeamDevelop Bravo は以下のセキュリティ原則に基づいて設計・実装されています:

1. **多層防御 (Defense in Depth)**: 単一の防御メカニズムに依存せず、複数のセキュリティレイヤーを実装
2. **最小権限の原則**: ユーザーとプロセスには必要最小限の権限のみを付与
3. **セキュアバイデフォルト**: セキュアな設定をデフォルトとし、明示的な変更がない限り安全性を優先
4. **継続的な改善**: 定期的なセキュリティレビューと脆弱性スキャンを実施

### 対象範囲

- Spring Boot バックエンド (Java 21, Spring Security)
- React フロントエンド (TypeScript, React 19)
- PostgreSQL データベース
- Docker コンテナ環境
- CI/CD パイプライン

---

## 認証・認可アーキテクチャ

### 認証方式

**セッションベース認証** (Spring Security)

```
┌─────────────┐          ┌──────────────┐          ┌──────────────┐
│   Browser   │  Login   │  Spring Boot │ Validate │  PostgreSQL  │
│   (React)   │─────────>│   Security   │─────────>│   Database   │
│             │<─────────│              │<─────────│              │
│             │  Session │              │          │              │
└─────────────┘          └──────────────┘          └──────────────┘
      │                         │
      │  Subsequent Requests    │
      │  (with JSESSIONID)      │
      │────────────────────────>│
      │<────────────────────────│
```

### ログインフロー

1. **クライアント**: `POST /api/auth/login` (email, password)
2. **サーバー**:
   - `AuthenticationManager` でユーザー認証
   - BCrypt でパスワード検証
   - セッション作成と `JSESSIONID` Cookie 発行
   - CSRF トークン発行 (`XSRF-TOKEN` Cookie)
3. **クライアント**: セッション情報を React Query でキャッシュ

### ログアウトフロー

1. **クライアント**: `POST /api/auth/logout`
2. **サーバー**:
   - `invalidateHttpSession(true)` でセッション無効化
   - `deleteCookies("JSESSIONID")` で Cookie 削除
   - HTTP 204 No Content レスポンス
3. **クライアント**:
   - React Query キャッシュクリア
   - `/signin` にリダイレクト (`replace: true`)

### セッション管理設定

```java
.sessionManagement(session -> session
    .maximumSessions(1)                    // 同時セッション数: 1
    .maxSessionsPreventsLogin(false)       // 新規ログインで既存セッション破棄
)
```

- **セッションタイムアウト**: 8時間 (AuthProvider 設定)
- **警告表示**: セッション期限の15分前
- **自動延長**: 無効 (手動再ログイン必須)

### 認可 (Role-Based Access Control)

| エンドポイント | 必要な権限 | 説明 |
|--------------|-----------|------|
| `/api/auth/login` | なし | ログイン |
| `/api/auth/session` | なし | セッション確認 |
| `/api/auth/logout` | なし | ログアウト |
| `/api/home/**` | 認証済み | ホーム画面 |
| `/api/stamps/**` | 認証済み | 打刻履歴 |
| `/api/admin/**` | `ROLE_ADMIN` | 管理機能 |
| `/api/employees/**` | `ROLE_ADMIN` | 従業員管理 |

---

## CSRF 保護ポリシー

### 基本方針

TeamDevelop Bravo は **Cookie + Custom Header** 方式の CSRF 保護を採用しています。

```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/actuator/**", "/api/auth/login", "/api/auth/logout")
)
```

### CSRF 保護の仕組み

1. **サーバー**: `XSRF-TOKEN` Cookie を発行 (HttpOnly=false)
2. **クライアント**: Cookie から Token を読み取り
3. **クライアント**: `X-XSRF-TOKEN` ヘッダーに Token を設定
4. **サーバー**: Cookie と Header の Token を照合

### 除外されたエンドポイント

以下のエンドポイントは CSRF 保護から除外されています:

| エンドポイント | 理由 | リスク評価 | 最終レビュー |
|--------------|------|-----------|------------|
| `/actuator/**` | ヘルスチェック (読み取り専用) | 🟢 Low | 2025-10-13 |
| `/api/auth/login` | 初回認証 (セッション未確立) | 🟢 Low | 2025-10-13 |
| `/api/auth/logout` | セッション破棄のみ | 🟢 Low | 2025-10-13 |

### ログアウトエンドポイントの CSRF 除外

#### 正当性

**業界標準**: Spring Security および OWASP CSRF Prevention Cheat Sheet で推奨されるパターン

**採用企業**: GitHub, GitLab, Auth0 など

#### リスク評価

**攻撃シナリオ**:
```html
<!-- 悪意のあるサイト evil.com -->
<img src="https://your-app.com/api/auth/logout" />
```

**影響**:
- ✅ データ損失: なし
- ✅ 権限昇格: なし
- ✅ 復旧可能性: ユーザーは即座に再ログイン可能
- ✅ ビジネス影響: 極めて限定的 (一時的な不便のみ)

**リスクレベル**: 🟢 **Low**

#### 補完的コントロール

CSRF 除外のリスクは以下の多層防御で補完されています:

1. **セッション無効化**: `invalidateHttpSession(true)`
2. **Cookie 削除**: `deleteCookies("JSESSIONID")`
3. **最大セッション数**: 1 (複数セッション防止)
4. **HSTS**: HTTPS 強制 (MITM 攻撃防止)
5. **CSP**: `frame-ancestors 'none'` (Clickjacking 防止)

#### モニタリング

ログアウトエンドポイントには以下のモニタリングを実施:

- **異常検知**: 短時間での大量ログアウト (10回/5分以上)
- **ログ記録**: すべてのログアウトをセキュリティログに記録
- **アラート**: 疑わしいパターンを検知した場合に通知

### CSRF 保護の確認方法

**正常な動作**:
```bash
# 1. セッション確立
curl -c cookies.txt http://localhost:8080/api/auth/session

# 2. CSRF トークン確認
cat cookies.txt | grep XSRF-TOKEN

# 3. CSRF トークンなしでリクエスト (ログアウト以外)
curl -b cookies.txt -X POST http://localhost:8080/api/employees
# → 403 Forbidden (CSRF 保護により拒否)

# 4. CSRF トークンなしでログアウト
curl -b cookies.txt -X POST http://localhost:8080/api/auth/logout
# → 204 No Content (CSRF 除外により成功)
```

---

## セキュリティヘッダー設定

### HSTS (HTTP Strict Transport Security)

```java
.httpStrictTransportSecurity(hsts -> hsts
    .maxAgeInSeconds(31536000)    // 1年間
    .includeSubDomains(true)
)
```

**効果**: ブラウザに HTTPS 通信を強制、MITM 攻撃を防止

### Content Security Policy (CSP)

```java
.contentSecurityPolicy(csp -> csp
    .policyDirectives(
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "img-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'"
    )
)
```

**効果**:
- XSS 攻撃の影響を最小化
- インラインスクリプトの実行を制限
- Clickjacking 攻撃を防止 (`frame-ancestors 'none'`)

### Frame Options

```java
.frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
```

**効果**: iframe による埋め込みを完全にブロック

### X-Content-Type-Options

```java
.contentTypeOptions(Customizer.withDefaults())
```

**効果**: MIME タイプスニッフィング攻撃を防止 (`nosniff`)

---

## セッション管理

### セッション固定攻撃対策

Spring Security はログイン成功時に **自動的にセッション ID を再生成**します:

```java
.securityContext(security ->
    security.securityContextRepository(securityContextRepository())
)
```

### Cookie 設定

| Cookie名 | HttpOnly | Secure | SameSite | 目的 |
|---------|----------|--------|----------|------|
| `JSESSIONID` | ✅ Yes | ✅ Yes (本番) | Lax | セッション ID |
| `XSRF-TOKEN` | ❌ No | ✅ Yes (本番) | Lax | CSRF トークン |

**注意**: `XSRF-TOKEN` は JavaScript からアクセス可能 (HttpOnly=false) である必要があります。

### セッション無効化ポリシー

**自動無効化**:
- タイムアウト: 8時間
- ログアウト: 即座に無効化
- 新規ログイン: 既存セッションを破棄 (maximumSessions=1)

**手動無効化**:
- 管理者による強制ログアウト (実装予定)

---

## データ保護

### パスワード保護

**ハッシュアルゴリズム**: BCrypt with salt

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();  // デフォルト: rounds=10
}
```

**特徴**:
- ソルト自動生成
- レインボーテーブル攻撃に耐性
- コスト調整可能 (将来的な強度向上)

### SQL インジェクション対策

**MyBatis パラメータ化クエリ**:

```xml
<!-- ✅ 正しい実装 -->
<select id="findByEmail" resultType="Employee">
    SELECT * FROM employees WHERE email = #{email}
</select>

<!-- ❌ 危険な実装 (使用禁止) -->
<select id="findByEmail" resultType="Employee">
    SELECT * FROM employees WHERE email = '${email}'
</select>
```

**すべての SQL クエリで `#{}` を使用** (プリペアドステートメント)

### XSS 対策

**React の自動エスケープ**:
```tsx
// ✅ 安全 (自動エスケープ)
<p>{user.name}</p>

// ⚠️ 注意 (明示的なエスケープ解除)
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

**DOMPurify** (必要に応じて):
```typescript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(dirtyHtml);
```

### 機密情報の管理

**環境変数**:
- `DB_PASSWORD`: データベースパスワード
- `JWT_SECRET`: JWT 署名キー (将来実装)
- `ENCRYPTION_KEY`: アプリケーション暗号化キー

**保存場所**:
- ローカル: `.env` (Git 管理外)
- CI: GitHub Secrets
- 本番: AWS Secrets Manager / Azure Key Vault

---

## 脆弱性報告

### 報告方法

セキュリティ脆弱性を発見した場合は、**GitHub Security Advisory** を使用して報告してください:

1. [Security Advisories](https://github.com/kouki-sakata/portfolio/security/advisories) を開く
2. **New draft security advisory** をクリック
3. 以下の情報を提供:
   - 脆弱性の詳細
   - 再現手順
   - 影響範囲
   - 推奨される修正方法 (あれば)

### レスポンスタイム目標

| 深刻度 | 初期応答 | 修正リリース |
|-------|---------|------------|
| Critical | 24時間以内 | 7日以内 |
| High | 48時間以内 | 30日以内 |
| Medium | 1週間以内 | 90日以内 |
| Low | 2週間以内 | 次回リリース |

### 対応プロセス

1. **トリアージ**: 脆弱性の深刻度を評価
2. **調査**: 影響範囲と根本原因を特定
3. **修正**: セキュリティパッチを開発
4. **テスト**: 修正の妥当性を検証
5. **リリース**: セキュリティアドバイザリと共にリリース
6. **通知**: 影響を受けるユーザーに通知

---

## セキュリティレビュープロセス

### コードレビュー要件

すべての Pull Request は以下のセキュリティチェックを通過する必要があります:

**自動チェック** (GitHub Actions):
- ✅ OWASP Dependency Check
- ✅ SonarCloud コード品質スキャン
- ✅ Biome lint (コードスタイル)
- ✅ 全ユニットテスト・統合テストの通過

**手動チェック** (レビュアー):
- ✅ 認証・認可の適切な実装
- ✅ SQL インジェクション対策
- ✅ XSS 対策
- ✅ CSRF 保護の維持
- ✅ 機密情報の適切な管理

### 定期的なセキュリティ監査

**スケジュール**: 6ヶ月ごと (4月・10月)

**監査内容**:
1. **依存関係の更新**: 脆弱性のあるライブラリの更新
2. **セキュリティ設定の見直し**: Spring Security, CSP, HSTS 等
3. **ログ分析**: 異常なアクセスパターンの検出
4. **侵入テスト**: OWASP Top 10 に基づくペネトレーションテスト
5. **ドキュメント更新**: セキュリティポリシーの更新

### 次回レビュー予定

- **前回**: 2025-10-13 (CSRF 除外の追加)
- **次回**: 2026-04-13 (6ヶ月後)

### セキュリティメトリクス

**監視項目**:
- 認証失敗率
- セッションタイムアウト発生率
- CSRF エラー発生率
- 異常なログアウト頻度
- 脆弱性スキャン結果

**目標**:
- 認証失敗率 < 5%
- CSRF エラー < 0.1%
- Critical/High 脆弱性 = 0

---

## 参考資料

### 標準とガイドライン

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)

### 依存ライブラリのセキュリティ

- [Spring Boot Security Advisories](https://spring.io/security)
- [React Security Best Practices](https://react.dev/learn/react-security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**最終更新**: 2025-10-13
**次回レビュー**: 2026-04-13
**責任者**: セキュリティチーム

セキュリティに関する質問や提案は、GitHub Issues または Security Advisory でお問い合わせください。
