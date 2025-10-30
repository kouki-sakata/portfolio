# Requirements Document

## Introduction

本仕様書は、TeamDevelop Bravoプロジェクトにおけるお知らせ管理機能の完成を目的としています。既存のBackend Service層（CRUD操作、公開/非公開切り替え、DataTables対応）を最大限活用し、欠落しているController層とFrontend UIを実装することで、完全なお知らせ管理システムを提供します。

**現状**: Backend Service層・Entity・Mapper完全実装済み、Frontend型定義・API Client関数定義済み、E2Eテスト定義済み（現在スキップ状態）

**実装方針**: 段階的実装アプローチを採用し、MVP（基本CRUD + E2Eテスト通過）を優先、その後UX向上機能、最後に高度な機能を追加します。

**対象ユーザー**: 管理者（お知らせの作成・編集・削除・公開管理）、一般ユーザー（公開お知らせ閲覧）

---

## Requirements

### Requirement 1: Backend REST API Controller実装

**Objective:** As a システム管理者, I want 既存Service層を活用したREST APIエンドポイント, so that フロントエンドからお知らせの管理操作が可能になる

#### Acceptance Criteria

1. WHEN 管理者が `/api/news` に対してGETリクエストを送信 THEN News Management System SHALL 全お知らせデータをJSON形式で返却する
2. WHEN 管理者が `/api/news` に対してPOSTリクエストを送信 THEN News Management System SHALL 新規お知らせを登録し201ステータスコードを返却する
3. WHEN 管理者が `/api/news/{id}` に対してPUT/DELETEリクエストを送信 THEN News Management System SHALL お知らせを更新/削除し適切なステータスコードを返却する
4. WHEN 管理者が `/api/news/{id}/publish` に対してPATCHリクエストを送信 THEN News Management System SHALL 公開状態を切り替え200ステータスコードを返却する
5. IF 無効なお知らせIDまたは管理者権限がない場合 THEN News Management System SHALL 404/403ステータスコードを返却する
6. WHERE OpenAPI仕様が定義されている場合 THE News Management System SHALL OpenAPI仕様に準拠したレスポンスを返却する

---

### Requirement 2: Frontend型定義の統一

**Objective:** As a フロントエンド開発者, I want 統一された型定義, so that 型不整合によるランタイムエラーを防止できる

#### Acceptance Criteria

1. WHEN NewsItem型を定義 THEN News Management System SHALL OpenAPI仕様から自動生成された型定義を使用する
2. IF HomeNewsItemとNewsItemに不整合がある場合 THEN News Management System SHALL 統一された型定義に集約する
3. WHERE 日付フィールドが存在 THE News Management System SHALL ISO 8601形式の文字列型またはDate型を使用する
4. WHERE APIレスポンスのsnake_caseフィールドが存在 THE News Management System SHALL camelCaseに変換する型マッピングを定義する

---

### Requirement 3: React Query統合とAPIクライアント接続

**Objective:** As a フロントエンド開発者, I want React Queryを使用した型安全なAPIクライアント, so that 効率的なデータフェッチングとキャッシュ管理が可能になる

#### Acceptance Criteria

1. WHEN newsApi.tsのAPI関数を実装 THEN News Management System SHALL 実際のREST APIエンドポイントに接続する
2. WHEN React Query Hooksを実装 THEN News Management System SHALL `useNewsQuery`, `useCreateNewsMutation`, `useUpdateNewsMutation`, `useDeleteNewsMutation`, `useTogglePublishMutation`を提供する
3. WHEN ミューテーションが成功 THEN News Management System SHALL キャッシュを無効化しデータを再取得する
4. IF APIリクエストがエラーを返す THEN News Management System SHALL エラーメッセージをユーザーフレンドリーな形式でToast表示する
5. WHERE キャッシュキーを定義 THE News Management System SHALL `["news"]`, `["news", id]`パターンを使用する

---

### Requirement 4: 管理者向けお知らせ一覧画面（MVP）

**Objective:** As a システム管理者, I want お知らせ一覧をカード形式で表示する画面, so that すべてのお知らせを視覚的に管理できる

#### Acceptance Criteria

1. WHEN 管理者が `/news-management` にアクセス THEN News Management System SHALL すべてのお知らせをカード形式で一覧表示する
2. WHERE お知らせカードが表示される場合 THE News Management System SHALL お知らせ日付、内容、公開/下書き状態を視覚的なバッジと共に表示する
3. WHEN カードに編集/削除/公開切り替えボタンが表示される THEN News Management System SHALL 各ボタンクリックで対応する操作を実行する
4. IF お知らせが存在しない場合 THEN News Management System SHALL 空状態メッセージとお知らせ作成ボタンを表示する
5. WHERE 一覧画面がモバイル表示される場合 THE News Management System SHALL レスポンシブグリッドレイアウトで表示する

---

### Requirement 5: お知らせ作成・編集モーダル（MVP）

**Objective:** As a システム管理者, I want お知らせを作成・編集できるモーダルダイアログ, so that 直感的にお知らせを管理できる

#### Acceptance Criteria

1. WHEN 新規作成/編集ボタンをクリック THEN News Management System SHALL 適切なフォーム状態でモーダルダイアログを表示する
2. WHERE モーダルフォームが表示される場合 THE News Management System SHALL React Hook Formで状態管理を行う
3. WHEN フォームにお知らせ日付・内容を入力 THEN News Management System SHALL 日付選択UIとテキストエリアを提供する
4. IF お知らせ内容が空または日付が無効な場合 THEN News Management System SHALL Zodバリデーションエラーを表示し送信を防止する
5. WHEN 保存ボタンをクリック THEN News Management System SHALL APIリクエストを送信しモーダルを閉じる
6. WHERE モーダルが表示される場合 THE News Management System SHALL フォーカストラップとキーボードナビゲーションを提供する

---

### Requirement 6: お知らせ削除機能（MVP）

**Objective:** As a システム管理者, I want お知らせを削除できる機能, so that 不要なお知らせをシステムから除去できる

#### Acceptance Criteria

1. WHEN 削除ボタンをクリック THEN News Management System SHALL お知らせ内容プレビューと削除警告を含む確認ダイアログを表示する
2. WHEN 削除確認ボタンをクリック THEN News Management System SHALL DELETE APIリクエストを送信する
3. WHEN 削除が成功 THEN News Management System SHALL 一覧から該当お知らせを即座に削除しToastで成功メッセージを表示する
4. IF 削除が失敗 THEN News Management System SHALL エラーメッセージをToast表示しお知らせを一覧に残す

---

### Requirement 7: 公開/非公開切り替え機能（MVP）

**Objective:** As a システム管理者, I want お知らせの公開状態をワンクリックで切り替える機能, so that 迅速に公開管理ができる

#### Acceptance Criteria

1. WHEN 公開切り替えボタンをクリック THEN News Management System SHALL 即座に公開/非公開状態を切り替える
2. WHEN 切り替えリクエストを送信 THEN News Management System SHALL 楽観的更新でUIを即座に反映する
3. IF 切り替えリクエストが失敗 THEN News Management System SHALL 元の状態にロールバックしエラーメッセージを表示する
4. WHERE 複数のお知らせが存在 THE News Management System SHALL 各お知らせの公開状態を独立して切り替え可能にする

---

### Requirement 8: E2Eテスト有効化とテストシナリオ実装（MVP）

**Objective:** As a QAエンジニア, I want E2Eテストが完全に機能する状態, so that 回帰テストを自動化できる

#### Acceptance Criteria

1. WHEN E2Eテストを実行 THEN News Management System SHALL frontend/e2e/news-management.spec.tsのすべてのテストがパスする
2. WHERE テストが定義される場合 THE News Management System SHALL CRUD操作、公開切り替え、削除のシナリオをカバーする
3. IF E2Eテストが現在スキップ状態の場合 THEN News Management System SHALL スキップを解除し実行可能にする
4. WHERE APIモックが必要な場合 THE News Management System SHALL MSW（Mock Service Worker）を使用する

---

### Requirement 9: ルーティング統合（MVP）

**Objective:** As a ユーザー, I want お知らせ管理画面にアクセスできるルート, so that URLから直接画面を開ける

#### Acceptance Criteria

1. WHEN React Routerにルート定義を追加 THEN News Management System SHALL `/news-management`パスで管理画面にアクセス可能にする
2. WHERE ルート定義が存在 THE News Management System SHALL 管理者権限を持つユーザーのみアクセスを許可する
3. IF 管理者権限がない場合 THEN News Management System SHALL `/`（ホーム画面）にリダイレクトする
4. WHEN サイドバーナビゲーションを更新 THEN News Management System SHALL お知らせ管理へのリンクを追加する

---

### Requirement 10: 一般ユーザー向けお知らせ閲覧機能（Phase 2）

**Objective:** As a 一般ユーザー, I want ホーム画面で公開されたお知らせを閲覧できる機能, so that 重要な情報を受け取れる

#### Acceptance Criteria

1. WHEN 一般ユーザーがホーム画面にアクセス THEN News Management System SHALL 公開されたお知らせのみを新しい順に表示する
2. IF 公開されたお知らせが存在しない場合 THEN News Management System SHALL "現在お知らせはありません"メッセージを表示する
3. WHEN 既存Pollerが動作 THEN News Management System SHALL 30秒間隔で自動的にお知らせを更新する

---

### Requirement 11: 一括操作機能（Phase 2）

**Objective:** As a システム管理者, I want 複数のお知らせを一括操作できる機能, so that 効率的に管理できる

#### Acceptance Criteria

1. WHEN お知らせ一覧でチェックボックスを表示 THEN News Management System SHALL 各お知らせに選択可能なチェックボックスを提供する
2. WHEN 複数のお知らせを選択 THEN News Management System SHALL 一括公開/非公開/削除操作を提供する一括操作バーを表示する
3. IF 一括操作中にエラーが発生 THEN News Management System SHALL 成功した操作は維持しエラー件数を通知する

---

### Requirement 12: アクセシビリティ強化（Phase 2）

**Objective:** As a 視覚障害を持つユーザー, I want スクリーンリーダーで操作可能なUI, so that アクセシブルにお知らせを管理できる

#### Acceptance Criteria

1. WHERE ボタン/リンク/モーダルが存在 THE News Management System SHALL aria-label、role、aria-modal等の適切なARIA属性を提供する
2. WHEN フォームエラーが発生 THEN News Management System SHALL aria-invalid="true"とaria-describedby属性を設定する
3. WHEN カラーコントラストを設計 THEN News Management System SHALL WCAG 2.1 Level AA基準を満たす

---

### Requirement 13: レスポンシブ対応（Phase 2）

**Objective:** As a モバイルユーザー, I want モバイルデバイスで快適に操作できるUI, so that いつでもどこでもお知らせを管理できる

#### Acceptance Criteria

1. WHERE お知らせ一覧が表示される場合 THE News Management System SHALL 画面幅に応じてグリッドカラム数を調整する
2. WHEN モバイルデバイスでアクセス THEN News Management System SHALL タッチフレンドリーなボタンサイズとスペーシングを提供する
3. WHERE モーダルダイアログが表示される場合 THE News Management System SHALL モバイルではフルスクリーンで表示する

---

### Requirement 14: 未読管理機能（Phase 3 - Optional）

**Objective:** As a 一般ユーザー, I want 未読のお知らせを識別できる機能, so that 新しい情報を見逃さない

#### Acceptance Criteria

1. WHEN 新しいお知らせが公開される THEN News Management System SHALL ユーザーごとに未読状態を記録し視覚的なバッジを表示する
2. WHEN ユーザーがお知らせを開く THEN News Management System SHALL 該当お知らせを既読状態に更新する

---

### Requirement 15: リッチテキストエディタ統合（Phase 3 - Optional）

**Objective:** As a システム管理者, I want リッチテキストでお知らせを作成できる機能, so that フォーマットされた情報を伝えられる

#### Acceptance Criteria

1. WHEN お知らせ作成フォームを開く THEN News Management System SHALL リッチテキストエディタ（Tiptap等）を提供する
2. WHEN お知らせを保存/表示 THEN News Management System SHALL HTML/Markdown形式で保存しサニタイズされたHTMLを安全にレンダリングする

---

### Requirement 16: リアルタイム通知機能（Phase 3 - Optional）

**Objective:** As a 一般ユーザー, I want 新しいお知らせが公開されたときに通知を受け取る機能, so that 即座に情報を確認できる

#### Acceptance Criteria

1. WHEN 管理者が新しいお知らせを公開 THEN News Management System SHALL WebSocketまたはServer-Sent Eventsを使用して全ユーザーにリアルタイム通知を送信する
2. IF ユーザーが通知設定を無効化 THEN News Management System SHALL 通知を送信しない

---

### Requirement 17: 並び替え・フィルタリング機能（Phase 3 - Optional）

**Objective:** As a システム管理者, I want お知らせを並び替え・フィルタリングできる機能, so that 必要な情報を素早く見つけられる

#### Acceptance Criteria

1. WHEN 一覧画面でソートオプションを選択 THEN News Management System SHALL 日付順、更新日順でソート可能にする
2. WHEN フィルタリング/検索を適用 THEN News Management System SHALL 公開/下書きでフィルタリング、お知らせ内容で検索可能にし、URLクエリパラメータに反映する

---

## Technical Constraints

### Technology Stack
- Backend: Spring Boot 3.x + MyBatis + PostgreSQL 16
- Frontend: React 19 + TypeScript 5.8 (strictモード) + React Query + React Router 7
- UI Library: shadcn-ui@canary (React 19対応)
- Form Management: React Hook Form + Zod
- Authentication: セッションベース認証（Spring Security）

### Development Constraints
- TypeScriptで`any`/`unknown`型の使用禁止
- 既存のBackend Service層を最大限活用（再実装不要）
- OpenAPI仕様との整合性維持
- E2Eテストシナリオの完全カバレッジ

### Performance Constraints
- お知らせ一覧のロード時間: 500ms以内（p95）
- お知らせ作成/編集モーダルの開閉: 100ms以内

---

## Success Criteria

### MVP Success Criteria (Priority 1)
- ✅ すべてのCRUD操作が正常に機能する
- ✅ E2Eテスト（frontend/e2e/news-management.spec.ts）がすべてパスする
- ✅ TypeScript strictモードですべての型チェックが通過する
- ✅ 管理者がお知らせを作成・編集・削除・公開切り替えできる

### Phase 2 Success Criteria (Priority 2)
- ✅ 一括操作が正常に機能する
- ✅ 一般ユーザーがホーム画面でお知らせを閲覧できる
- ✅ アクセシビリティ基準（WCAG 2.1 Level AA）を満たす
- ✅ モバイルデバイスで快適に操作できる

### Phase 3 Success Criteria (Priority 3 - Optional)
- ✅ 未読管理・リッチテキストエディタ・リアルタイム通知・並び替えフィルタリング機能が実装される
