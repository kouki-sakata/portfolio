# ログイン機能修正ガイド

## 🔍 問題の特定と解決

### 発見された問題

1. **HTMLフォームのaction先が間違っている**
   - 問題: `th:action="@{home/check}"` （独自コントローラー）
   - 解決: `th:action="@{/signin/login}"` （Spring Security処理）

2. **Spring Security設定の不完全性**
   - リクエストマッチャーの不足
   - 権限設定の不整合

3. **ロール設定の不備**
   - CustomUserDetailsServiceでROLE_プレフィックス未設定

## ✅ 実施した修正

### 1. signin.html の修正
```html
<!-- 修正前 -->
<form id="signin_form" method="post" novalidate th:action="@{home/check}">

<!-- 修正後 -->
<form id="signin_form" method="post" novalidate th:action="@{/signin/login}">
```

### 2. SecurityConfig.java の修正
```java
// 修正前
.requestMatchers("/signin", "/css/**", "/js/**", "/img/**").permitAll()
.requestMatchers("/employeemanage/**", "/newsmanage/**").hasAuthority(AppConstants.Employee.ADMIN_AUTHORITY)

// 修正後
.requestMatchers("/", "/signin", "/signin/**", "/css/**", "/js/**", "/img/**").permitAll()
.requestMatchers("/employeemanage/**", "/newsmanage/**").hasRole("ADMIN")
```

### 3. CustomUserDetailsService.java の修正
```java
// 修正前
authorities.add(new SimpleGrantedAuthority(AppConstants.Employee.ADMIN_AUTHORITY));

// 修正後
authorities.add(new SimpleGrantedAuthority("ROLE_" + AppConstants.Employee.ADMIN_AUTHORITY));
```

## 🧪 テスト用ログイン情報

### テストアカウント
| メールアドレス | パスワード | 権限 | 備考 |
|---------------|-----------|------|------|
| test@gmail.com | test | 管理者 | ID=1, パスワード未ハッシュ化 |
| th1@tm.com | A3bE8RjHnq | 管理者 | ID=2, パスワード未ハッシュ化 |

### ログイン手順
1. ブラウザで `http://localhost:8080` にアクセス
2. サインインページに自動リダイレクト
3. メールアドレス: `test@gmail.com`
4. パスワード: `test`
5. 「SIGN IN」ボタンをクリック

## 🔧 Spring Security認証フロー

```mermaid
graph TD
    A[ユーザーがログイン] --> B[/signin/login POSTリクエスト]
    B --> C[Spring Security認証フィルター]
    C --> D[CustomUserDetailsService]
    D --> E[EmployeeMapper.getEmployeeByEmail]
    E --> F{ユーザー存在？}
    F -->|Yes| G[パスワード検証]
    F -->|No| H[UsernameNotFoundException]
    G --> I{パスワード一致？}
    I -->|Yes| J[認証成功 → /home/init]
    I -->|No| K[認証失敗 → /signin?error=true]
    H --> K
```

## 🔒 セキュリティ機能詳細

### 認証プロセス
1. **フォーム送信**: ユーザーがログインフォームを送信
2. **Spring Security処理**: 自動的に認証プロセスを開始
3. **UserDetailsService呼び出し**: メールアドレスでユーザー検索
4. **パスワード検証**: BCryptでハッシュ化されたパスワードと比較
5. **権限設定**: ROLE_ADMINまたはROLE_USERを設定
6. **セッション作成**: 認証成功時にセキュアなセッションを作成

### 権限管理
```java
// 管理者のみアクセス可能
@PreAuthorize("hasRole('ADMIN')")
public String adminPage() { ... }

// ログイン済みユーザーのみアクセス可能
@PreAuthorize("isAuthenticated()")
public String userPage() { ... }
```

## 📝 ログイン状態の確認方法

### 1. ブラウザでの確認
- ログイン成功: ホーム画面（/home/init）に遷移
- ログイン失敗: サインイン画面にエラーメッセージ表示

### 2. ログでの確認
```bash
# 認証成功ログ
grep "認証成功" logs/teamdev-security.log

# 認証失敗ログ
grep "AUTHENTICATION.*FAILURE" logs/teamdev-security.log
```

### 3. セッション確認
```bash
# アプリケーション起動後、ヘルスチェック
curl http://localhost:8080/actuator/health

# 認証が必要な画面へのアクセステスト
curl -c cookies.txt -b cookies.txt http://localhost:8080/home/init
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. 「403 Forbidden」エラー
**原因**: CSRF保護が有効でトークンが不足
**解決**: フォームにCSRFトークンを追加
```html
<input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}" />
```

#### 2. 「404 Not Found」エラー
**原因**: URLマッピングの不整合
**解決**: SecurityConfigのrequestMatchersを確認

#### 3. パスワードが一致しない
**原因**: 
- データベースのパスワードがハッシュ化済み
- BCrypt検証の不具合

**解決**: パスワードマイグレーションを実行
```java
// StartupConfigで自動実行される
passwordMigrationService.migratePasswords();
```

#### 4. ログイン後に無限リダイレクト
**原因**: defaultSuccessUrlとloginPageの循環参照
**解決**: URLパスを確認し、異なるパスを設定

## 🔄 パスワードマイグレーション

### 自動マイグレーション
アプリケーション起動時に、平文パスワードを自動的にBCryptハッシュに変換

### 手動でのパスワード確認
```java
// 平文パスワードかどうかの判定
private boolean isPlainTextPassword(String password) {
    return password != null && 
           !password.startsWith("$2a$") && 
           !password.startsWith("$2b$") && 
           !password.startsWith("$2y$");
}
```

### ハッシュ化済みパスワードの例
```
平文: test
BCrypt: $2a$10$abc123...（60文字のハッシュ）
```

## 🎯 確認チェックリスト

### 修正完了の確認
- [ ] signin.htmlのformアクションが`/signin/login`になっている
- [ ] SecurityConfigで適切なURL許可設定がされている
- [ ] CustomUserDetailsServiceでROLE_プレフィックスが設定されている
- [ ] アプリケーションがエラーなく起動する
- [ ] `test@gmail.com` / `test` でログインできる
- [ ] ログイン後にホーム画面に遷移する
- [ ] ログアウト機能が動作する

### セキュリティの確認
- [ ] セッション管理が適切に動作している
- [ ] 権限チェックが機能している
- [ ] ログが適切に出力されている
- [ ] パスワードがハッシュ化されて保存されている

これで、Spring Securityベースの安全なログイン機能が正常に動作するはずです。