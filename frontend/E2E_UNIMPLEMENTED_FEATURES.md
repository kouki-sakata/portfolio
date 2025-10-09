# E2Eテスト失敗箇所：未実装機能一覧

**最終更新日**: 2025-10-09
**テスト実行結果**: 42 passed / 21 failed / 10 skipped (合計73テスト)

このドキュメントは、E2Eテストで失敗している21件の未実装機能をまとめたものです。テストコード自体は正しく書かれていますが、アプリケーション側に機能が実装されていないため失敗しています。

---

## 📊 失敗分類サマリー

| カテゴリ | 失敗件数 | 優先度 |
|---------|---------|--------|
| 認証関連 | 2件 | 🔴 高 |
| 権限制御 | 2件 | 🔴 高 |
| エラーハンドリング/トースト通知 | 6件 | 🟡 中 |
| フォームバリデーション | 6件 | 🟡 中 |
| 打刻機能 | 4件 | 🟠 中-高 |
| ローディング状態 | 1件 | 🟢 低 |

---

## 1. 認証関連 (2件) 🔴

### 1.1 ログアウト機能が実装されていない

**テストファイル**: `e2e/auth-session.spec.ts:8`
**テスト名**: `認証・セッション管理の包括的テスト > ログアウト機能が正常に動作する`

**エラー内容**:
```
Test timeout of 30000ms exceeded.
Error: locator.click: Test timeout of 30000ms exceeded.
waiting for getByRole('button', { name: /ログアウト|サインアウト/ })
```

**問題**:
- ログアウトボタンがUI上に存在しない
- ヘッダーまたはサイドバーにログアウト機能が実装されていない

**実装要件**:
- [ ] ヘッダーまたはサイドバーにログアウトボタンを追加
- [ ] ボタンクリック時に `/api/auth/logout` へPOSTリクエスト
- [ ] ログアウト成功後、ログインページへリダイレクト
- [ ] セッション情報をクリア

**優先度**: 🔴 高（基本的な認証機能）

---

### 1.2 複数タブでのセッション共有が機能しない

**テストファイル**: `e2e/auth-session.spec.ts:99`
**テスト名**: `認証・セッション管理の包括的テスト > 複数タブで同時ログイン状態を維持できる`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: /おはようございます/ })
Expected: visible
Received: <element(s) not found>
```

**問題**:
- 1つのタブでログインしても、別タブで同じセッションが有効にならない
- タブ間でセッション状態が共有されていない

**実装要件**:
- [ ] BroadcastChannel API または localStorage を使用したタブ間通信
- [ ] セッション状態の変更を他のタブに通知
- [ ] React Queryのキャッシュ更新メカニズムの改善

**優先度**: 🟡 中（ユーザビリティ向上）

---

## 2. 権限制御 (2件) 🔴

### 2.1 サイドバーの権限制御が実装されていない

**テストファイル**: `e2e/authorization.spec.ts:74`
**テスト名**: `権限制御の包括的テスト > 一般ユーザーのサイドバーには管理者メニューが表示されない`

**エラー内容**:
```
expect(locator).not.toBeVisible() failed
Locator: getByRole('link', { name: '社員管理' })
Expected: not visible
Received: visible
```

**問題**:
- 一般ユーザーでログインしても、サイドバーに「社員管理」「ログ管理」などの管理者メニューが表示される
- `employee.admin` フラグによる表示/非表示制御が機能していない

**実装要件**:
- [ ] サイドバーコンポーネントで `employee.admin` による条件分岐
- [ ] 管理者専用メニュー項目を `admin === true` の場合のみ表示
- [ ] ログ管理、従業員管理などのリンクを制御

**優先度**: 🔴 高（セキュリティ・権限制御）

**該当ファイル**:
- `frontend/src/components/Sidebar.tsx` または類似コンポーネント

---

### 2.2 API fetch時のURL解析エラー

**テストファイル**: `e2e/authorization.spec.ts:151`
**テスト名**: `権限制御の包括的テスト > 一般ユーザーが直接API経由で従業員作成を試みると403エラー`

**エラー内容**:
```
page.evaluate: TypeError: Failed to execute 'fetch' on 'Window':
Failed to parse URL from /api/employees
```

**問題**:
- `page.evaluate()` 内で相対パス `/api/employees` が解析できない
- テストコードの問題である可能性が高い（baseURL設定不足）

**実装要件**:
- [ ] テストコードで絶対URLを使用するか、`context.route()` を活用
- [ ] または `process.env.E2E_BASE_URL` を利用してフルURLを構築

**優先度**: 🟢 低（テストコード側の修正で対応可能）

---

## 3. エラーハンドリング/トースト通知 (6件) 🟡

### 3.1 ネットワークエラー時のトースト通知が未実装

**テストファイル**: `e2e/error-handling.spec.ts:8`
**テスト名**: `エラーハンドリングの包括的テスト > ネットワークエラー時にトースト通知が表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/ネットワークエラー|通信エラー|接続に失敗/)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- ネットワークエラー（オフライン、タイムアウトなど）発生時にトースト通知が表示されない

**実装要件**:
- [ ] React QueryのonError内でトースト表示
- [ ] `AxiosError` の `code` または `message` を判定
- [ ] 「ネットワークエラーが発生しました」などのメッセージを表示

---

### 3.2 サーバーエラー（500）時のトースト通知が未実装

**テストファイル**: `e2e/error-handling.spec.ts:31`
**テスト名**: `エラーハンドリングの包括的テスト > サーバーエラー（500）時に適切なエラーメッセージが表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/サーバーエラー|エラーが発生|しばらくしてから/)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- HTTPステータス500エラー時にトースト通知が表示されない

**実装要件**:
- [ ] Axios interceptorまたはReact QueryのonErrorで500エラーをキャッチ
- [ ] 「サーバーエラーが発生しました。しばらくしてから再度お試しください。」を表示

---

### 3.3 メールアドレス形式エラーのトースト通知が未実装

**テストファイル**: `e2e/error-handling.spec.ts:82`
**テスト名**: `エラーハンドリングの包括的テスト > 不正なメールアドレス形式でバリデーションエラーが表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/メールアドレスの形式|正しいメール|invalid email/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- フォーム送信後、バックエンドからのバリデーションエラーがトースト表示されない

**実装要件**:
- [ ] API 400エラーレスポンスのバリデーションメッセージを抽出
- [ ] フィールドごとのエラーメッセージをトースト表示

---

### 3.4 404エラーページが未実装

**テストファイル**: `e2e/error-handling.spec.ts:107`
**テストテスト名**: `エラーハンドリングの包括的テスト > 存在しないリソースへのアクセスで404エラーページが表示される`

**エラー内容**:
```
expect(received).toBe(expected)
Expected: 404
Received: 200
```

**問題**:
- 存在しないページ（例: `/non-existent-page`）にアクセスしても404ページが表示されない
- SPAのため、すべてのルートが200を返している

**実装要件**:
- [ ] React Router 7の `errorElement` または `ErrorBoundary` を設定
- [ ] 404専用ページコンポーネントを作成
- [ ] ルーティング設定でワイルドカード `*` ルートをキャッチ

**優先度**: 🟡 中（ユーザーエクスペリエンス）

---

### 3.5 APIタイムアウト時のトースト通知が未実装

**テストファイル**: `e2e/error-handling.spec.ts:122`
**テスト名**: `エラーハンドリングの包括的テスト > APIタイムアウト時にエラーハンドリングされる`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/タイムアウト|時間切れ|timeout/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- APIリクエストがタイムアウトした際のエラーハンドリングが未実装

**実装要件**:
- [ ] Axiosのtimeout設定を適用
- [ ] timeout発生時にtoast表示（「リクエストがタイムアウトしました」）

---

### 3.6 APIエラー後の操作可能性確認

**テストファイル**: `e2e/error-handling.spec.ts:234`
**テスト名**: `エラーハンドリングの包括的テスト > APIエラー後もアプリケーションが操作可能`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/エラー/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- エラー発生後もUIがフリーズせず操作可能であることを確認するテスト
- エラートースト自体が表示されていないため失敗

**実装要件**:
- [ ] エラー時もアプリケーション全体がクラッシュしないこと
- [ ] エラーBoundaryの適切な実装

**優先度**: 🟡 中（安定性）

---

## 4. フォームバリデーション (6件) 🟡

### 4.1 必須項目エラーメッセージが未表示

**テストファイル**: `e2e/form-validation.spec.ts:24`
**テスト名**: `フォームバリデーションの包括的テスト > 必須項目が空の場合、エラーメッセージが表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: locator('text=/パスワード.*必須|password.*required/i').first()
Expected: visible
Received: <element(s) not found>
```

**問題**:
- ログインフォームで必須フィールドを空にしても、エラーメッセージが表示されない
- React Hook Formのエラーが画面に反映されていない

**実装要件**:
- [ ] React Hook Formの`errors`オブジェクトをUIに反映
- [ ] `<FormError>` または `<ErrorMessage>` コンポーネントの追加
- [ ] Zodスキーマのエラーメッセージを日本語化

**優先度**: 🟡 中（UX改善）

---

### 4.2 メールアドレス形式エラーが未表示

**テストファイル**: `e2e/form-validation.spec.ts:52`
**テスト名**: `フォームバリデーションの包括的テスト > メールアドレス形式が不正な場合、エラーメッセージが表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/メールアドレスの形式|正しいメール|invalid.*email/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- 不正なメール形式を入力してもエラーメッセージが表示されない

**実装要件**:
- [ ] Zodの`.email()`バリデーションメッセージを表示
- [ ] フィールド下にリアルタイムでエラーを表示

---

### 4.3 重複メールアドレスエラーが未表示

**テストファイル**: `e2e/form-validation.spec.ts:84`
**テスト名**: `フォームバリデーションの包括的テスト > 重複するメールアドレスの場合、エラーメッセージが表示される`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/既に登録|重複|already exists|使用されています/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- サーバー側で重複エラー（409 Conflict）が返されても、UIにエラーが表示されない

**実装要件**:
- [ ] APIレスポンスの409エラーをキャッチ
- [ ] 「このメールアドレスは既に使用されています」をトースト表示

---

### 4.4 リアルタイムバリデーションが未実装

**テストファイル**: `e2e/form-validation.spec.ts:112`
**テスト名**: `フォームバリデーションの包括的テスト > 入力フィールドのリアルタイムバリデーションが動作する`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/メールアドレスの形式|invalid.*email/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- 入力中（onChange/onBlur）のリアルタイムバリデーションが機能していない
- フォーム送信時のみバリデーションが実行される

**実装要件**:
- [ ] React Hook Formの`mode: 'onChange'` または `'onBlur'` を設定
- [ ] フィールドごとにエラーメッセージを即座に表示

---

### 4.5 最大文字数制限が未実装

**テストファイル**: `e2e/form-validation.spec.ts:198`
**テスト名**: `フォームバリデーションの包括的テスト > 最大文字数制限が機能する`

**エラー内容**:
```
expect(received).toBeLessThanOrEqual(expected)
Expected: <= 255
Received: 256
```

**問題**:
- input要素に`maxLength`属性が設定されていない
- 256文字入力できてしまう

**実装要件**:
- [ ] input要素に`maxLength={255}`を追加
- [ ] または文字数カウンター表示

---

### 4.6 フォームクリア後のエラーリセットが未実装

**テストファイル**: `e2e/form-validation.spec.ts:212`
**テスト名**: `フォームバリデーションの包括的テスト > フォームクリア後、エラーメッセージがリセットされる`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/メールアドレスの形式|invalid/i)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- エラーメッセージ自体が表示されていないため、このテストも失敗
- フォームを閉じて再度開いた際にエラー状態がリセットされるかを確認するテスト

**実装要件**:
- [ ] React Hook Formの`reset()`を適切に呼び出し
- [ ] モーダル/ダイアログを閉じる際にフォーム状態をクリア

---

## 5. 打刻機能 (4件) 🟠

### 5.1 外出打刻ボタンが未実装

**テストファイル**: `e2e/stamp-comprehensive.spec.ts:35`
**テスト名**: `打刻機能の包括的テスト > 外出打刻が正常に動作する`

**エラー内容**:
```
Test timeout of 30000ms exceeded.
Error: locator.click: Test timeout of 30000ms exceeded.
waiting for getByRole('button', { name: /外出/ })
```

**問題**:
- ホーム画面に「外出」ボタンが存在しない
- 外出打刻機能が実装されていない

**実装要件**:
- [ ] ホーム画面に「外出」打刻ボタンを追加
- [ ] `/api/home/stamps` へ `stampType: "BREAK_START"` をPOST
- [ ] 成功時にトースト通知を表示

**優先度**: 🟠 中-高（業務要件）

---

### 5.2 復帰打刻ボタンが未実装

**テストファイル**: `e2e/stamp-comprehensive.spec.ts:55`
**テスト名**: `打刻機能の包括的テスト > 復帰打刻が正常に動作する`

**エラー内容**:
```
Test timeout of 30000ms exceeded.
Error: locator.click: Test timeout of 30000ms exceeded.
waiting for getByRole('button', { name: /復帰/ })
```

**問題**:
- ホーム画面に「復帰」ボタンが存在しない
- 復帰打刻機能が実装されていない

**実装要件**:
- [ ] ホーム画面に「復帰」打刻ボタンを追加
- [ ] `/api/home/stamps` へ `stampType: "BREAK_END"` をPOST
- [ ] 成功時にトースト通知を表示

**優先度**: 🟠 中-高（業務要件）

---

### 5.3 深夜勤務チェックボックスが未実装

**テストファイル**: `e2e/stamp-comprehensive.spec.ts:75`
**テスト名**: `打刻機能の包括的テスト > 深夜勤務フラグONで出勤打刻ができる`

**エラー内容**:
```
Test timeout of 30000ms exceeded.
Error: locator.check: Test timeout of 30000ms exceeded.
waiting for getByLabel(/深夜勤務/)
```

**問題**:
- 出勤打刻時の「深夜勤務」チェックボックスが存在しない

**実装要件**:
- [ ] 出勤打刻フォームに「深夜勤務」チェックボックスを追加
- [ ] チェック時に `nightShift: true` をAPIに送信

**優先度**: 🟡 中（業務要件）

---

### 5.4 打刻時のサーバーエラー表示が未実装

**テストファイル**: `e2e/stamp-comprehensive.spec.ts:120`
**テスト名**: `打刻機能の包括的テスト > 打刻時にサーバーエラーが発生した場合のエラー表示`

**エラー内容**:
```
expect(locator).toBeVisible() failed
Locator: getByText(/サーバーエラー|エラーが発生/)
Expected: visible
Received: <element(s) not found>
```

**問題**:
- 打刻APIがエラーを返してもトースト通知が表示されない

**実装要件**:
- [ ] 打刻mutation のonError内でトースト表示
- [ ] 「打刻に失敗しました」メッセージを表示

---

## 6. ローディング状態 (1件) 🟢

### 6.1 フォーム送信中のローディング状態が未実装

**テストファイル**: `e2e/error-handling.spec.ts:204`
**テスト名**: `エラーハンドリングの包括的テスト > フォーム送信中のローディング状態が表示される`

**エラー内容**:
```
expect(isDisabled || hasLoadingIndicator).toBe(true)
Expected: true
Received: false
```

**問題**:
- ログインボタンクリック後、ボタンがdisableされない
- ローディングインジケーターが表示されない

**実装要件**:
- [ ] React Queryの`isPending` または `isLoading`を利用
- [ ] ボタンに`disabled={isPending}`を設定
- [ ] ローディングスピナーを表示（shadcn-uiの`Loader2`など）

**優先度**: 🟢 低（UX改善）

---

## 🎯 優先度別実装推奨順序

### Phase 1: セキュリティ・基本機能（優先度: 🔴 高）
1. **ログアウト機能の実装** (認証1.1)
2. **サイドバー権限制御の実装** (権限2.1)

### Phase 2: エラーハンドリング基盤（優先度: 🟡 中）
3. **トースト通知システムの実装** (エラーハンドリング3.1 - 3.6)
4. **404エラーページの実装** (エラーハンドリング3.4)

### Phase 3: フォームバリデーション（優先度: 🟡 中）
5. **フォームエラーメッセージ表示の実装** (バリデーション4.1 - 4.6)

### Phase 4: 打刻機能拡張（優先度: 🟠 中-高）
6. **外出/復帰打刻の実装** (打刻5.1 - 5.2)
7. **深夜勤務フラグの実装** (打刻5.3)

### Phase 5: UX改善（優先度: 🟢 低）
8. **ローディング状態の実装** (ローディング6.1)
9. **複数タブセッション共有** (認証1.2)

---

## 📝 実装時の注意事項

1. **トースト通知ライブラリの選定**
   - shadcn-ui の `Sonner` または `Toast` コンポーネント推奨
   - 統一したエラーハンドリングを行うため、グローバルなtoast関数を作成

2. **エラーメッセージの国際化**
   - Zodスキーマのエラーメッセージを日本語化
   - 一貫性のあるメッセージ表現を使用

3. **アクセシビリティ**
   - エラーメッセージは`aria-describedby`でフィールドと関連付け
   - ローディング状態は`aria-busy`で明示

4. **テストカバレッジ**
   - 各機能実装後、対応するE2Eテストが成功することを確認
   - 新しい機能追加時は同時にE2Eテストも作成

---

## 🔄 進捗トラッキング

このドキュメントは実装が完了した項目をチェックマークで管理してください。

**最終更新**: 2025-10-09
**作成者**: Claude Code (AI Assistant)
