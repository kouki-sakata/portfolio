# 実装タスク

## タスク概要

本タスクは、既存のBackend Service層を活用し、欠落しているController層とFrontend UIを実装することで、お知らせ管理機能を完成させます。MVP（基本CRUD + E2Eテスト通過）を優先し、段階的に機能を拡張します。

## 前提条件

- 既存Backend Service層: NewsManageService、NewsManageRegistrationService、NewsManageDeletionService、NewsManageReleaseService完備
- 既存Backend Mapper: NewsMapper（CRUD、公開/非公開切り替え完備）
- 既存Frontend型定義: features/news/types.ts（NewsItem型定義済み、ただし不整合あり）
- 既存Frontend API Client: features/news/api/newsApi.ts（関数定義済み、エンドポイント未接続）
- 既存E2Eテスト: frontend/e2e/news-management.spec.ts（全シナリオ定義済み、現在スキップ状態）

## 重要な実装方針

1. **Backend実装は最小限**: Service層完備のため、Controller層のみ実装
2. **型定義の統一が最優先**: OpenAPI自動生成型への移行が他のタスクの前提条件
3. **段階的実装**: MVP（Phase 1）→ Phase 2 → Phase 3の順序を厳守
4. **E2Eテスト駆動**: 各タスク完了後にE2Eテストで検証

---

## 実装タスク

- [x] 1. Backend REST API実装とOpenAPI型定義統合
  - Backend EntityとFrontend型定義を完全統一
  - OpenAPI仕様からの自動型生成パイプライン確立
  - 既存Service層を活用したREST APIエンドポイント実装
  - _Requirements: 1.1-1.8, 2.1-2.5_

- [x] 1.1 OpenAPI仕様定義とTypeScript型自動生成
  - openapi/openapi.yamlにお知らせ管理APIの仕様定義を追加
  - NewsResponse、NewsCreateRequest、NewsUpdateRequest、NewsListResponseのスキーマ定義
  - Backend Entityのsnake_caseフィールドをcamelCaseに変換する型マッピング
  - npm run generate:api実行による型自動生成の確認
  - 生成された型がfrontend/src/types/に配置されることを検証
  - _Requirements: 1.8, 2.1, 2.2, 2.4, 2.5_

- [x] 1.2 Backend Request/Response DTO実装
  - dto/api/news/パッケージ作成
  - NewsCreateRequest: newsDate（String）、content（String）フィールド定義
  - NewsUpdateRequest: newsDate（String）、content（String）フィールド定義
  - NewsResponse: id（Integer）、newsDate（String）、content（String）、releaseFlag（Boolean）、updateDate（String）フィールド定義
  - NewsListResponse: news（List<NewsResponse>）フィールド定義
  - Bean Validationアノテーション追加（@NotBlank、@Size、@Pattern等）
  - _Requirements: 1.1-1.8_

- [x] 1.3 NewsRestController実装（CRUD + 公開切り替え）
  - controller/api/NewsRestController.java作成
  - @RestController、@RequestMapping("/api/news")アノテーション設定
  - 既存Service層（NewsManageService、NewsManageRegistrationService、NewsManageDeletionService、NewsManageReleaseService）を注入
  - GET /api/news: 全お知らせ一覧取得（管理者向け）
  - GET /api/news/published: 公開お知らせ一覧取得（一般ユーザー向け）
  - POST /api/news: 新規お知らせ作成（@PreAuthorize("hasRole('ADMIN')")）
  - PUT /api/news/{id}: お知らせ更新（@PreAuthorize("hasRole('ADMIN')")）
  - DELETE /api/news/{id}: お知らせ削除（@PreAuthorize("hasRole('ADMIN')")）
  - PATCH /api/news/{id}/publish: 公開切り替え（@PreAuthorize("hasRole('ADMIN')")）
  - Entity → Response DTO変換ロジック実装（toResponse()メソッド）
  - エラーハンドリング統合（GlobalExceptionHandler活用）
  - _Requirements: 1.1-1.7_

- [x] 1.4 Backend単体テスト実装
  - NewsRestControllerTest.java作成
  - @SpringBootTest、@AutoConfigureMockMvc、@ActiveProfiles("test")設定
  - Service層をモック化（@MockBean）
  - CRUD操作の成功シナリオテスト（各エンドポイント）
  - バリデーションエラーシナリオテスト（必須フィールド未入力、フォーマット不正）
  - 認証エラーシナリオテスト（401 Unauthorized）
  - 認可エラーシナリオテスト（403 Forbidden）
  - リソース不在シナリオテスト（404 Not Found）
  - _Requirements: 1.1-1.8_

- [ ] 2. React Query統合とAPIクライアント接続
  - 既存newsApi.tsのAPI関数を実際のREST APIエンドポイントに接続
  - React Query Hooksを実装し効率的なデータフェッチングとキャッシュ管理を提供
  - 楽観的更新による即座のUI反映
  - _Requirements: 3.1-3.7_

- [ ] 2.1 既存型定義の廃止とOpenAPI型への移行
  - features/news/types.tsの既存NewsItem型定義を削除
  - types/news.tsからOpenAPI生成型（NewsResponse、NewsCreateRequest、NewsUpdateRequest、NewsListResponse）をインポート
  - HomeNewsItem型をNewsResponseに統一
  - TypeScript strictモードでの型チェックが通過することを確認
  - _Requirements: 2.1-2.5_

- [ ] 2.2 newsApi.ts実装（実際のエンドポイント接続）
  - features/news/api/newsApi.ts編集
  - shared/api/axiosClientを活用したHTTP通信実装
  - fetchNewsList(): GET /api/newsにリクエスト送信
  - fetchPublishedNews(): GET /api/news/publishedにリクエスト送信
  - createNews(data): POST /api/newsにリクエスト送信
  - updateNews(id, data): PUT /api/news/{id}にリクエスト送信
  - deleteNews(id): DELETE /api/news/{id}にリクエスト送信
  - toggleNewsPublish(id, releaseFlag): PATCH /api/news/{id}/publishにリクエスト送信
  - OpenAPI生成型を使用した型安全な実装
  - _Requirements: 3.1, 3.2_

- [ ] 2.3 React Query Hooks実装
  - features/news/hooks/useNews.ts作成
  - useNewsQuery: 全お知らせ一覧取得、キャッシュキー["news"]、staleTime 5分
  - usePublishedNewsQuery: 公開お知らせ一覧取得、キャッシュキー["news", "published"]
  - useCreateNewsMutation: お知らせ作成、成功時キャッシュ無効化
  - useUpdateNewsMutation: お知らせ更新、成功時キャッシュ無効化
  - useDeleteNewsMutation: お知らせ削除、成功時キャッシュ無効化、Toast成功メッセージ
  - useTogglePublishMutation: 公開切り替え、楽観的更新実装、エラー時ロールバック
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2.4 楽観的更新実装（useTogglePublishMutation）
  - onMutate: queryClient.cancelQueries実行、現在のキャッシュを保存
  - onMutate: queryClient.setQueryDataで即座にUI反映
  - onError: context.previousNewsでロールバック、エラーToast表示
  - onSettled: queryClient.invalidateQueriesでキャッシュ再検証
  - onSuccess: 成功Toast表示
  - _Requirements: 3.4, 3.5_

- [ ] 2.5 React Query Hooksテスト実装
  - features/news/hooks/useNews.test.ts作成
  - MSWモックサーバー設定（各エンドポイント）
  - useNewsQueryの成功シナリオテスト
  - useCreateNewsMutationのキャッシュ無効化テスト
  - useTogglePublishMutationの楽観的更新テスト
  - useDeleteNewsMutationのエラーハンドリングテスト
  - _Requirements: 3.1-3.7_

- [x] 3. 管理者向けお知らせ管理画面実装（MVP）
  - カード型一覧、モーダル型フォーム、削除確認、公開切り替えを実装
  - 既存のshadcn-uiコンポーネントを活用
  - React Hook Form + Zodによるバリデーション
  - _Requirements: 4.1-4.9, 5.1-5.10, 6.1-6.6, 7.1-7.5_

- [x] 3.1 NewsManagementPageコンポーネント実装
  - features/news/components/NewsManagementPage.tsx作成
  - useNewsQueryでお知らせ一覧取得
  - ローディング状態表示（NewsSkeleton）
  - エラー状態表示（ErrorDisplay）
  - 空状態表示（EmptyState + 新規作成ボタン）
  - モーダル開閉状態管理（useState）
  - 編集対象お知らせ管理（useState）
  - レスポンシブグリッドレイアウト（grid-cols-1 md:grid-cols-2 lg:grid-cols-3）
  - _Requirements: 4.1-4.9_

- [x] 3.2 NewsCardコンポーネント実装
  - features/news/components/NewsCard.tsx作成
  - shadcn-ui Cardコンポーネント活用
  - お知らせ日付、内容、公開状態バッジ表示
  - 公開バッジ（Badge variant="default"）、下書きバッジ（Badge variant="secondary"）
  - 編集ボタン、削除ボタン、公開切り替えボタン配置
  - useTogglePublishMutationで公開切り替え
  - useDeleteNewsMutationで削除処理
  - AlertDialogによる削除確認ダイアログ統合
  - _Requirements: 4.2-4.7, 7.1-7.5_

- [x] 3.3 NewsFormModalコンポーネント実装
  - features/news/components/NewsFormModal.tsx作成
  - shadcn-ui Dialogコンポーネント活用
  - React Hook Form統合（useForm）
  - Zodスキーマ定義（newsFormSchema: newsDate、content）
  - newsDateバリデーション（yyyy-MM-dd形式）
  - contentバリデーション（必須、1000文字以内）
  - 新規作成モード（mode="create"）と編集モード（mode="edit"）の分岐
  - useCreateNewsMutation、useUpdateNewsMutation統合
  - 保存成功時にモーダル閉じる、Toast成功メッセージ
  - キャンセルボタンまたはESCキーで閉じる
  - _Requirements: 5.1-5.10_

- [x] 3.4 削除確認ダイアログ実装
  - features/news/components/DeleteConfirmDialog.tsx作成
  - shadcn-ui AlertDialogコンポーネント活用
  - お知らせ内容プレビュー表示（最大100文字）
  - 削除警告メッセージ表示
  - 削除確認ボタンクリックでuseDeleteNewsMutation実行
  - キャンセルボタンでダイアログ閉じる
  - _Requirements: 6.1-6.6_

- [x] 3.5 UIコンポーネントテスト実装
  - NewsCard.test.tsx: お知らせ情報表示、編集ボタンクリック、公開バッジ表示テスト
  - NewsFormModal.test.tsx: フォーム入力、バリデーションエラー、保存処理テスト
  - DeleteConfirmDialog.test.tsx: プレビュー表示、削除実行、キャンセル処理テスト
  - Testing Libraryとvitestを活用
  - _Requirements: 4.1-7.5_

- [ ] 4. ルーティング統合と権限制御
  - React Router 7のRoute Loader統合
  - 管理者権限チェック
  - サイドバーナビゲーション更新
  - _Requirements: 9.1-9.5_

- [ ] 4.1 お知らせ管理ルート追加
  - app/routes.tsxにルート定義追加
  - path: "/news-management"
  - element: NewsManagementPageコンポーネント
  - loader: newsManagementLoader実装
  - _Requirements: 9.1_

- [ ] 4.2 newsManagementLoader実装
  - app/providers/routeLoaders.tsにローダー追加
  - セッションチェック（checkSession）
  - 管理者権限チェック（session.user.admin）
  - 権限なし時にホーム画面（/）へリダイレクト
  - queryClient.prefetchQueryでお知らせデータプリフェッチ
  - _Requirements: 9.2, 9.3, 9.5_

- [ ] 4.3 サイドバーナビゲーション更新
  - shared/components/layout/AppSidebar.tsxにお知らせ管理リンク追加
  - 管理者権限がある場合のみリンク表示
  - アイコンとラベル設定
  - _Requirements: 9.4_

- [ ] 5. E2Eテスト修正と有効化（MVP完成）
  - Backend Entity準拠への型修正
  - MockServerレスポンス修正
  - エンドポイントパス修正
  - UIセレクタ修正（Card型UIへの対応）
  - スキップ解除と全シナリオ実行
  - MVP完了確認
  - **推定作業時間: 約110分（約2時間）**
  - _Requirements: 8.1-8.5_

- [ ] 5.1 E2Eテスト型フィールド修正（P0 - 約30分）
  - frontend/e2e/news-management.spec.tsの型不整合を修正
  - `title` → `content`に全置換（Backend Entityに準拠）
  - `published` → `releaseFlag`に全置換（Backend Entityに準拠）
  - mockNewsListの型定義をBackend Entity準拠に変更
  - TypeScript型チェック通過確認
  - _Requirements: 8.4_
  - _Rationale: design.mdの「E2E Test Consistency Verification」で特定された型フィールド不整合（Issue 1）_

- [ ] 5.2 MockServerレスポンス修正（P0 - 約15分）
  - MockServerレスポンス型をBackend Entity準拠に変更
  - snake_case（news_date、release_flag）→ camelCase（newsDate、releaseFlag）への変換確認
  - DTOがOpenAPI型と一致することを確認
  - _Requirements: 8.1_
  - _Rationale: design.mdの「E2E Test Consistency Verification」で特定されたレスポンス型不整合（Issue 2）_

- [ ] 5.3 エンドポイントパス修正（P0 - 約20分）
  - `/api/newses` → `/api/news`に全置換
  - RESTful命名規則への準拠確認
  - POST、PUT、DELETE、PATCHエンドポイントのパス検証
  - _Requirements: 8.1_
  - _Rationale: design.mdの「E2E Test Consistency Verification」で特定されたエンドポイントパス不整合（Issue 3）_

- [ ] 5.4 UIセレクタ修正（P1 - 約45分）
  - テーブルセレクタ（`role=row`、`role=cell`）→ Card型UIセレクタに変更
  - `getByRole('article')`または`getByTestId('news-card-{id}')`パターンへ移行
  - 編集ボタン、削除ボタン、公開切り替えボタンのセレクタ更新
  - 空状態メッセージセレクタの確認
  - _Requirements: 8.2_
  - _Rationale: design.mdの「E2E Test Consistency Verification」で特定されたUI構造不整合（Issue 4）_

- [ ] 5.5 E2Eテストスキップ解除と実行
  - frontend/e2e/news-management.spec.tsのtest.describe.skipをtest.describeに変更
  - テストシナリオ9件のスキップ解除確認
  - npm run test:e2e実行
  - お知らせ一覧表示シナリオ検証
  - お知らせ作成シナリオ検証
  - お知らせ編集シナリオ検証
  - お知らせ削除シナリオ検証
  - 公開切り替えシナリオ検証
  - 権限制御シナリオ検証
  - 空状態シナリオ検証
  - バリデーションエラーシナリオ検証
  - 失敗したテストの修正とリトライ
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 5.6 スクリーンショット・トレースログ検証
  - 失敗時のスクリーンショット生成確認
  - トレースログの詳細確認
  - デバッグ情報の活用
  - _Requirements: 8.3_

- [ ] 5.7 MVP完了基準確認
  - 全E2Eテスト（9シナリオ）パス確認
  - TypeScript strictモード型チェック通過確認
  - Biome lintエラー0件確認
  - 管理者がCRUD操作可能であることを確認
  - 型定義統一によるランタイムエラー0件確認
  - _Requirements: 全要件のMVP Success Criteria_

- [ ] 6. 一般ユーザー向けお知らせ閲覧機能（Phase 2）
  - ホーム画面での公開お知らせ表示
  - 既存Pollerとの統合
  - _Requirements: 10.1-10.6_

- [ ] 6.1 ホーム画面お知らせ表示コンポーネント実装
  - features/home/components/NewsCard.tsx拡張または新規作成
  - usePublishedNewsQueryで公開お知らせ取得
  - お知らせ日付と内容表示
  - 最新5件のみ表示、残りは省略
  - 公開お知らせ0件時に"現在お知らせはありません"メッセージ表示
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6.2 既存Poller統合
  - features/home/hooks/usePolling.tsまたは同等のポーリング機構統合
  - 30秒間隔でusePublishedNewsQueryを再検証
  - 自動更新によるリアルタイム反映
  - _Requirements: 10.5_

- [ ] 6.3 管理者/一般ユーザーUI分離
  - 管理者: /news-managementで管理画面表示
  - 一般ユーザー: ホーム画面で閲覧のみ
  - 権限に応じたUI表示の分岐
  - _Requirements: 10.6_

- [ ] 7. 一括操作機能（Phase 2 - Optional）
  - 複数選択チェックボックス
  - 一括公開/非公開/削除
  - エラーハンドリング
  - _Requirements: 11.1-11.6_

- [ ] 7.1 チェックボックス選択機能実装
  - NewsCardにチェックボックス追加
  - 選択状態管理（useState）
  - 全選択/全解除機能
  - _Requirements: 11.1_

- [ ] 7.2 一括操作バー表示
  - 選択数 > 0時に一括操作バー表示
  - 一括公開ボタン、一括非公開ボタン、一括削除ボタン配置
  - 選択件数表示
  - _Requirements: 11.2_

- [ ] 7.3 一括操作API呼び出し実装
  - useBulkPublishMutation: 選択されたIDの一括公開
  - useBulkUnpublishMutation: 選択されたIDの一括非公開
  - useBulkDeleteMutation: 選択されたIDの一括削除
  - Promise.allを活用した並列処理
  - _Requirements: 11.3, 11.4, 11.5_

- [ ] 7.4 一括操作エラーハンドリング
  - 成功した操作は維持
  - エラー件数をToast通知
  - 部分的成功の処理
  - _Requirements: 11.6_

- [ ] 8. アクセシビリティ強化（Phase 2 - Optional）
  - ARIA属性追加
  - スクリーンリーダー対応
  - キーボードナビゲーション
  - _Requirements: 12.1-12.5_

- [ ] 8.1 ARIA属性実装
  - ボタン・リンクにaria-label追加
  - モーダルダイアログにrole="dialog"、aria-modal="true"設定
  - フォームエラーにaria-invalid、aria-describedby設定
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 8.2 フォーカス管理実装
  - モーダル表示時のフォーカストラップ
  - キーボードナビゲーション（Tab、Shift+Tab）
  - ESCキーでモーダル閉じる
  - _Requirements: 12.4_

- [ ] 8.3 カラーコントラスト検証
  - WCAG 2.1 Level AA基準チェック
  - Lighthouse Accessibilityスコア100達成
  - _Requirements: 12.5_

- [ ] 9. レスポンシブ対応（Phase 2 - Optional）
  - モバイルレイアウト最適化
  - タッチフレンドリーUI
  - _Requirements: 13.1-13.4_

- [ ] 9.1 グリッドレイアウト最適化
  - 画面幅に応じたカラム数調整（grid-cols-1 md:grid-cols-2 lg:grid-cols-3）
  - モバイル: 1カラム、タブレット: 2カラム、デスクトップ: 3カラム
  - _Requirements: 13.1_

- [ ] 9.2 タッチフレンドリーUI実装
  - ボタンサイズ最小44x44px
  - スペーシング調整（タッチ領域確保）
  - スワイプジェスチャー対応（オプション）
  - _Requirements: 13.2_

- [ ] 9.3 モーダルレスポンシブ対応
  - モバイル: フルスクリーン表示
  - デスクトップ: センタリング表示
  - 画面幅768px未満でモバイルレイアウト適用
  - _Requirements: 13.3, 13.4_

---

## 完了基準

### MVP（Phase 1）完了基準
- ✅ 全E2Eテスト（9シナリオ）がパス
- ✅ TypeScript strictモードですべての型チェックが通過
- ✅ Biome lintエラー0件
- ✅ 管理者がお知らせを作成・編集・削除・公開切り替えできる
- ✅ 型定義が統一されランタイムエラーが発生しない
- ✅ Backend Controller層のユニットテスト全パス
- ✅ React Query Hooksのテスト全パス

### Phase 2完了基準（Optional）
- ✅ 一般ユーザーがホーム画面でお知らせを閲覧できる
- ✅ 一括操作が正常に機能する
- ✅ アクセシビリティ基準（WCAG 2.1 Level AA）を満たす
- ✅ モバイルデバイスで快適に操作できる

### Phase 3完了基準（Future Enhancement）
- ✅ 未読管理機能が実装される
- ✅ リッチテキストエディタでフォーマットされたお知らせが作成できる
- ✅ リアルタイム通知がWebSocketで配信される
- ✅ 並び替え・フィルタリングが高速に動作する

---

## 注意事項

- **Backend実装**: Service層は完全実装済みのため、Controller層とDTOのみ実装
- **型定義**: OpenAPI自動生成型を必ず使用、手動型定義は廃止
- **テスト駆動**: 各タスク完了後に対応するテストを実行し検証
- **段階的実装**: MVP完了後、Phase 2、Phase 3の順で実装
- **既存コードの尊重**: 既存のEmployeeRestController、AuthRestController、StampHistoryRestControllerと同様のパターンを適用
