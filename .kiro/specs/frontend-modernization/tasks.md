# 実装タスク

## UIフレームワーク基盤構築

- [x] 
    1. TailwindCSS v4とVite統合の設定

    - npm install -D tailwindcss@next @tailwindcss/vite をインストール
    - vite.config.tsに@tailwindcss/viteプラグインを追加
    - tailwind.config.tsを作成してデザイントークンを設定
    - frontend/src/styles/globals.cssにTailwindディレクティブを追加
    - _Requirements: 3.3, 6.1_

- [x] 
    2. shadcn/ui初期設定とコンポーネントインストール

    - npx shadcn@latest initでコンポーネントライブラリを初期化
    - components.jsonでtsconfig pathとstyle設定を構成
    - Button、Card、Toast、Input、Label基本コンポーネントを追加
    - ダークモードサポートのためのテーマプロバイダーを設定
    - _Requirements: 3.1, 3.4_

- [x]
    3. コンポーネントラッパー層の実装

    - frontend/src/shared/components/ui-wrapper/にラッパーコンポーネントディレクトリを作成
    - ButtonWrapper、CardWrapper、InputWrapperコンポーネントを実装
    - 既存UIとshadcn/uiを切り替えるfeatureFlagシステムを実装
    - ラッパーコンポーネントのTypeScript型定義を作成
    - _Requirements: 1.3, 3.1_

- [x]
    4. OpenAPI TypeScript型生成パイプラインの構築

    - openapi-typescriptとopenapi-zod-clientをインストール
    - npm scriptsにgenerate:api-typesとgenerate:zod-schemasを追加
    - frontend/src/types/api.tsとfrontend/src/schemas/api.tsの生成を確認
    - 型生成の自動化テストを実装
    - _Requirements: 9.2, 10.4_

- [x]
    5. 基本レイアウトコンポーネントの作成

    - AppLayoutコンポーネントにヘッダー、サイドバー、メインコンテンツ領域を実装
    - レスポンシブナビゲーションメニューコンポーネントを作成
    - TailwindCSSのグリッドシステムでレイアウトを構築
    - モバイル対応のブレークポイントを設定
    - _Requirements: 3.5, 2.1_

## 認証システムとホーム画面

- [x]
    6. 認証コンテキストとプロバイダーの実装

    - AuthContextとuseAuthフックを作成
    - セッション情報とCSRFトークン管理ロジックを実装
    - ログイン/ログアウト関数をコンテキストに統合
    - セッションタイムアウト処理を実装
    - _Requirements: 5.1, 5.2_

- [x]
    7. APIクライアント層の構築

    - axiosベースのAPIクライアントを設定
    - CSRFトークン自動付与インターセプターを実装
    - エラーハンドリングインターセプターを追加
    - 401エラー時の自動リダイレクト処理を実装
    - _Requirements: 5.3, 5.5_

- [x]
    8. SignInPageのshadcn/ui実装

    - ログインフォームをshadcn/uiコンポーネントで作成
    - Zodスキーマによるフォームバリデーションを実装
    - React Hook FormとZod resolverを統合
    - エラーメッセージ表示とローディング状態を実装
    - _Requirements: 2.1, 3.4_

- [x]
    9. React Queryセットアップと認証統合

    - QueryClientの設定と最適化
    - useLoginMutationとuseLogoutMutationを実装
    - useSessionQueryでセッション状態管理を実装
    - キャッシュ無効化戦略を設定
    - _Requirements: 2.4, 7.3_

- [x]
    10. HomePage ダッシュボードの実装

    - お知らせ一覧表示コンポーネントを作成
    - 打刻ステータス表示コンポーネントを実装
    - 打刻ボタン機能をReact Queryで統合
    - レスポンシブグリッドレイアウトを適用
    - _Requirements: 2.2, 1.3_

## 従業員管理と打刻機能

- [x]
    11. TanStack Tableを使用したDataTable実装

    - @tanstack/react-tableをインストールして設定
    - ソート、フィルター、ページネーション機能を実装
    - カラムの表示/非表示切り替え機能を追加
    - レスポンシブテーブルデザインを実装
    - _Requirements: 2.3, 3.2_

- [x]
    12. 従業員一覧画面の構築

    - EmployeeListPageコンポーネントを作成
    - useEmployeesQueryでデータフェッチを実装
    - 検索フィルター機能を追加
    - 一括選択と削除機能を実装
    - _Requirements: 2.3, 4.1_

- [x]
    13. 従業員作成・編集フォームの実装

    - EmployeeFormコンポーネントをshadcn/uiで作成
    - Zodスキーマによる入力検証を実装
    - useCreateEmployeeMutationとuseUpdateEmployeeMutationを作成
    - 楽観的更新処理を実装
    - _Requirements: 4.3, 9.5_

- [x]
    14. 打刻履歴表示機能の実装

    - StampHistoryViewコンポーネントを作成
    - カレンダー形式とリスト形式の表示切り替えを実装
    - 月次集計機能を追加
    - 打刻編集・削除モーダルを実装
    - _Requirements: 2.4, 2.5_

- [x]
    15. CSV出力機能の実装

    - exportToCsv関数でBlobダウンロードを実装
    - 出力フォーマット選択オプションを追加
    - プログレス表示とエラーハンドリングを実装
    - 大量データの分割処理を追加
    - _Requirements: 2.6, 4.6_

## エラーハンドリングとUXの最適化

- [x]
    16. グローバルエラーハンドリングシステムの実装

    - ErrorBoundaryコンポーネントを作成
    - グローバルErrorHandlerクラスを実装
    - Toast通知システムを統合
    - エラーログ送信機能を追加
    - _Requirements: 8.1, 8.5_

- [x]
    17. ローディング状態とスケルトンUIの実装

    - LoadingSpinnerとSkeletonコンポーネントを作成
    - React Suspenseとの統合を設定
    - ページ遷移時のローディング表示を実装
    - データフェッチ中のプレースホルダーを追加
    - _Requirements: 8.4, 7.2_

- [x]
    18. フォームバリデーションフィードバックの強化

    - リアルタイムバリデーション表示を実装
    - エラーメッセージのローカライゼーションを追加
    - フィールドレベルのエラー表示を改善
    - アクセシビリティ対応のエラー通知を実装
    - _Requirements: 8.3, 3.6_

## パフォーマンス最適化

- [x]
    19. コード分割と遅延読み込みの実装

    - React.lazyで主要ルートを動的インポート
    - ルートレベルのコード分割を設定
    - Suspenseフォールバックを実装
    - プリロード戦略を最適化
    - _Requirements: 7.2, 6.5_

- [x] 
    20. React Query キャッシュ最適化

    - staleTimeとcacheTimeを機能別に調整
    - prefetchQueryで事前データ取得を実装
    - 楽観的更新パターンを全mutation適用
    - キャッシュ無効化戦略を最適化
    - _Requirements: 7.3, 7.4_

- [x] 
    21. 画像とアセットの最適化

    - 画像の遅延読み込みを実装
    - WebP形式への自動変換を設定
    - SVGアイコンのスプライト化を実装
    - フォントの最適化とプリロードを設定
    - _Requirements: 7.5, 6.5_

## API統合とデータ管理

- [x] 
    22. 従業員管理APIクライアントの実装

    - employeeApi.tsにCRUD操作を実装
    - ページネーションとフィルタリングパラメータを処理
    - エラーレスポンスの型定義を追加
    - リトライロジックを実装
    - _Requirements: 4.1, 4.2_

-[x] 
    23. 打刻管理APIクライアントの実装

    - stampApi.tsに打刻操作を実装
    - 履歴取得と集計機能を追加
    - 編集・削除操作の権限チェックを実装
    - バッチ操作サポートを追加
    - _Requirements: 4.4, 4.5_

-[x] 
    24. お知らせ管理APIクライアントの実装

    - newsApi.tsにCRUD操作を実装
    - 公開/非公開状態管理を追加
    - カテゴリーフィルタリングを実装
    - リアルタイム更新のためのポーリングを追加
    - _Requirements: 4.3, 2.2_

-[x] 
    25. ログ管理APIクライアントの実装

    - logApi.tsに検索とエクスポート機能を実装
    - 高度な検索フィルターを追加
    - ページネーション処理を最適化
    - 大量データのストリーミング処理を実装
    - _Requirements: 4.2, 4.6_

## テスティングとバリデーション

-[x] 
    26. コンポーネント単体テストの作成

    - 主要UIコンポーネントのVitestテストを作成
    - Testing Libraryでユーザーインタラクションをテスト
    - スナップショットテストを追加
    - カバレッジ目標80%を達成
    - _Requirements: 6.4, 9.1_

-[x] 
    27. API統合テストの実装

    - MSWでAPIモックサーバーを設定
    - 各APIエンドポイントの統合テストを作成
    - エラーケースとエッジケースをカバー
    - レスポンススキーマ検証を実装
    - _Requirements: 4.6, 9.2_

- [x] 
    28. E2Eテストシナリオの作成

    - Playwrightでログインフローをテスト
    - 打刻操作の完全フローをテスト
    - 従業員管理CRUDフローをテスト
    - クロスブラウザテストを設定
    - _Requirements: 6.4, 2.1_

## 移行とクリーンアップ

-[x] 
    29. Spring Profilesによる段階的切り替え設定

    - WebMvcConfigでSPAルーティングを設定
    - レガシーコントローラーのProfile設定を追加
    - Feature Flag APIエンドポイントを実装
    - 環境別のProfile設定を文書化
    - _Requirements: 1.2, 1.4_

- [x] 
    30. Thymeleafテンプレートの削除

    - src/main/resources/templatesディレクトリを削除
    - Thymeleaf依存関係をbuild.gradleから削除
    - レガシーコントローラーのマッピングを削除
    - 静的リソースの再配置を実行
    - _Requirements: 1.1, 1.5_

- [ ] 
    31. ビルドパイプラインの最終調整

    - フロントエンドビルドをGradleタスクに統合
    - 本番ビルド最適化設定を追加
    - ソースマップ生成設定を調整
    - デプロイメントスクリプトを更新
    - _Requirements: 6.5, 6.2_

- [ ] 
    32. パフォーマンスメトリクスの検証

    - Lighthouse CIを設定してスコアを測定
    - バンドルサイズ分析を実行
    - 初回表示時間を検証
    - APIレスポンスタイムを測定
    - _Requirements: 7.1, 7.5_
