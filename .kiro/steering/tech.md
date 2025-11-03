# TeamDevelop Bravo 技術スタック

## アーキテクチャ

- **タイプ**: モノリシックSPA（Spring Boot API + React SPA）
- **データベース**: PostgreSQL 16（MyBatis 3.0.4）
- **原則**: RESTful API、OpenAPI 3.0準拠、型安全性（TypeScript + Zod）

## フロントエンド

### コアスタック
- React 19.1.1、TypeScript 5.8.3（strict mode）
- Vite 7.1.7、React Router 7.9.2
- React Query 5.90.2（staleTime: 5分、gcTime: 10分）
- TanStack Table 8.21.3（Headless UI）
- shadcn/ui@canary（React 19対応、Radix UI）
- Tailwind CSS 4.1.13

### TypeScript高度な型活用
- satisfies演算子、Branded Types（ID誤用防止）
- Template Literal Types、型述語関数

### 開発ツール
- Biome 2.2.4（ESLint/Prettier統合）
- Vitest 3.2.4（500+ tests）、MSW 2.11.3
- Playwright 1.49.1（E2E）
- @hey-api/openapi-ts（型自動生成）

### 主要コマンド
```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run lint         # Biomeリント
npm run test         # Vitestテスト
npm run test:e2e     # Playwright E2E
npm run generate:api # OpenAPI型生成
```

### フロントエンド設計パターン

#### View Model変換パターン（News機能で確立）
- **プレゼンテーション層変換**: APIレスポンス（`NewsResponse`）からUI専用モデル（`NewsViewModel`）への変換
- **派生データ生成**: コンテンツ解析でタイトル・カテゴリを自動抽出（`deriveTitle`、`deriveCategory`）
- **lib/ディレクトリ配置**: 各feature内で再利用可能なビジネスロジックをlibに集約
- **カテゴリマッピング**: コンテンツ先頭の【カテゴリ】パターンを解析し、Badge variantに変換
- **型安全性**: 元のAPIレスポンス型を拡張（`NewsViewModel = NewsResponse & { ... }`）し、型の一貫性を保持

#### TanStack Table統合パターン（News機能で確立）
- **カラム定義のフック化**: `useNewsColumns`でテーブル列定義をUI層から分離し、コールバック注入でイベントハンドリング
- **イベント伝播制御**: チェックボックス/ボタンの`stopPropagation`でテーブル行クリックと分離
- **選択チェックUI標準化**: `DataTableSelectionCheckbox`でヒットエリア/フォーカスリング/イベント抑止を共通化
- **レスポンシブ対応**: モバイル（アイコンのみ）⇔デスクトップ（テキスト表示）の条件分岐
- **複数ソート・フィルタ**: `DataTableColumnHeader`によるカラムごとのソート/フィルタ機能
- **共通DataTableコンポーネント**: `shared/components/data-table`で再利用可能なテーブル実装を提供

#### 選択状態管理の分離（News機能で確立）
- **状態管理のパターン**: TanStack Tableの`RowSelectionState`とアプリケーション側のID配列を同期
- **双方向変換**: `tableRowSelection`（インデックス→boolean）と`handleRowSelectionChange`（インデックス→ID配列）でビュー⇔ロジックを橋渡し
- **Set型による効率**: 選択チェック時にSet変換で高速検索（`selectedSet.has(news.id)`）
- **バルク操作後の同期**: 失敗IDのみ保持、成功IDは自動削除（部分成功対応）
- **useMemo最適化**: 選択状態の不要な再計算を防止（`newsItems`と`selectedNewsIds`の依存管理）

#### React Query楽観的更新（News機能で確立）
- **`onMutate`**: キャッシュ直接更新で即時UI反映（公開切り替え、削除等）、previousデータ保存
- **`onError`**: previousデータでロールバック（エラー時の整合性保証）、トースト通知
- **`onSettled`**: サーバー再検証（`queryClient.invalidateQueries`）で最終整合性確保
- **複数キャッシュキー同時無効化**: list + published等、関連キャッシュの同期更新
- **バルク操作の部分成功処理**: 成功/失敗を個別集計し、UIに反映（失敗IDのみ選択保持）

#### ホーム打刻クロック同期パターン（2025-11-03 追加）
- **JST固定の時刻生成**: `useHomeClock` が `formatLocalTimestamp`（Day.js + timezone）を利用して常に `Asia/Tokyo` のISOタイムスタンプを供給し、海外端末でも正しい打刻時間を維持
- **UI/ロジックの分離**: `HomeClockPanel` が表示責務、`StampCard` が打刻操作責務を担い、`captureTimestamp` コールバックで時刻を共有
- **フェールオーバー処理**: タイムゾーン計算に失敗した場合は `CLOCK_FALLBACK_MESSAGE` を表示し、`status: "error"` でボタン押下時のガードを提供
- **遅延の吸収**: 打刻ボタン押下時に `captureTimestamp` を必ず呼び、APIレスポンス遅延があってもUI表示とサーバー送信が同じ時刻で同期

#### Feature Flag UIトグルとフォールバック
- `FeatureFlagProvider` + `FeatureFlagContext` が `/api/public/feature-flags` から取得した値をローカルストレージと同期し、起動直後から安定したフラグ状態を提供。
- `shared/components/ui-wrapper/*` が shadcn/ui コンポーネントを安全にラップし、旗が無効な環境でもカスタムのフォールバック UI に自動切替（段階的ロールアウトやレガシー互換を両立）。
- `NavigationProgress` と `AppLayout` が Feature Flag で切り替わる UI に対しても共通のナビゲーション UX（モバイルドロワー、ヘッダー）を維持。

#### AdminGuardによるルート保護（2025-10-31 導入）
- **認証取得中のUX**: `useAuth` の `loading` 状態ではフルスクリーン `LoadingSpinner` を表示し、ガード内で早期 return。
- **権限分岐**: 未認証は `/signin` へ、非管理者は `/` へ `Navigate` でサーバーラウンドトリップなしに遷移。
- **再利用性**: `AdminGuard` を `NewsManagementRoute` や `EmployeeAdminRoute` にラップし、Admin専用ページを統一ガードで保護。
- **アクセシビリティ**: 子要素は変換せず Fragment を返すため、ガードは DOM 構造を汚染せず既存レイアウトを維持。

#### グローバルエラーハンドリングとイベント連携
- `shared/error-handling/GlobalErrorHandler` が API 例外を識別（認証/権限/ネットワーク/バリデーション）し、Toast 表示とロギングを一元管理。
- `shared/api/interceptors/errorInterceptor` が Axios 401/403 を `authEvents` にエスカレートし、`AppProviders` でトースト + ルーターリダイレクトを統合。
- `configureQueryClientErrorHandler` が React Query の QueryCache と組み合わせて 401 発生時に自動 logout + `/signin` リダイレクト、403 ではダッシュボードに戻すガードを実現。

#### Repository + HTTPアダプター
- `shared/repositories/IHttpClient` で HTTP 層を抽象化し、`httpClientAdapter` が fetch ベースクライアントを Repository から切り離す。
- 各 Repository（`AuthRepository`, `HomeRepository` 等）は Zod スキーマで API 応答を検証し、依存逆転の原則 (DIP) を満たしたテスト容易な構造。
- `defaultHttpClient` が axios レスポンスを RepositoryError（`TIMEOUT`/`NETWORK_ERROR`/`SERVER_ERROR` など）に正規化し、UI へ安定したエラーハンドリング契約を提供。

## バックエンド

### 主要スタック
- Java 21、Spring Boot 3.4.3、Spring Security 6.4
- MyBatis 3.0.4
- PostgreSQL 16、HikariCP
- Springdoc OpenAPI 2.6.0

### MyBatis実装パターン
- **動的SQL使い分け**:
  - **アノテーションベース**: シンプルなクエリ（`@Delete` + `<script>`、`@Select` + `<foreach>`）
  - **XML定義**: 複雑な更新ロジック（`bulkUpdate*`、条件分岐、複数カラム更新）
  - **一括操作**: `<foreach>`で動的IN句生成（`deleteByIds`、`bulkUpdateReleaseFlag`）
- **ResultMap定義**: snake_case→camelCase変換を一元管理、型安全なマッピング
- **列マッピングの明示**: `StampHistoryMapper` では `SELECT *` を避け、各カラムを明示し `AS` でDTOプロパティへマッピング（2025-11-01 リファクタ）

### サービス層アーキテクチャ（SOLID原則）
- **ファサードパターン**: EmployeeService、NewsManageService（読み取り専用の統合ポイント）
- **単一責任の原則**: Query/Command分離（CQRS）
- **専門サービス分離**:
  - 認証: AuthenticationService、AuthSessionService
  - 従業員: QueryService、CommandService、CacheService
  - 打刻: StampService、StampEditService、StampHistoryService、StampDeleteService、StampOutputService
  - 打刻サブコンポーネント（service/stamp/）: StampHistoryPersistence、OutTimeAdjuster、TimestampConverter、StampFormDataExtractor
  - お知らせ: NewsManageRegistrationService、NewsManageReleaseService、NewsManageDeletionService、NewsManageBulkDeletionService、NewsManageBulkReleaseService
- **Controller層での組み立て**: NewsRestController が複数の専門サービスを注入し、エンドポイントごとに適切なサービスを呼び出す

### API層の実装パターン
- **REST Controller層**: record DTO + Bean Validation（`@NotBlank`, `@Pattern`, `@Size`）で入力検証
- **単体更新API**: `/api/stamps/{id}` PUT/DELETE が `StampRestController` の `resolveTimeValue` で未入力フィールドを既存値にフォールバックし、`StampEditService` のオーケストレーションと整合
- **認証・認可**: `SecurityUtil#getCurrentEmployeeId()`で操作者取得、`@PreAuthorize`でロール制御（例: `hasRole('ADMIN')`）
- **Form Bridge パターン**: 既存のForm型（`ListForm`, `NewsManageForm`, `HomeForm`）でService層と接続
- **型同期**: OpenAPI 3.0スキーマ → `@hey-api/openapi-ts`でTypeScript型自動生成
- **バリデーション同期**:
  - Backend: Bean Validation（record DTO）
  - Frontend: Zod スキーマ（同一ルール・メッセージ）
- **バルクAPI設計**:
  - 部分成功レスポンス（`successCount`, `failureCount`, `results[]`）
  - 上限設定（最大100件）、事前検証とトランザクション管理
  - 個別の成否とエラーメッセージを返却
  - try-catchでバリデーションエラーとシステムエラーを分離処理
- **Map型レスポンス変換パターン**（打刻履歴）:
  - Service層: `List<Map<String, Object>>`でカレンダー形式データ返却
  - Controller層: record DTO（`StampHistoryEntryResponse`）に型安全変換
- **バルクAPIエラー戦略**（News機能で確立）:
  - `extractRootCause`メソッドでネストされた例外の根本原因を抽出
  - バリデーションエラー（IllegalArgumentException）とシステムエラーを分離処理
  - 部分成功時のログ出力（成功件数/失敗件数、`logger.info`で詳細記録）
  - `ResponseStatusException`で適切なHTTPステータス返却（400: バリデーションエラー、500: システムエラー）

### セキュリティ
- セッションベース認証（8時間）、CSRF保護（Cookie + X-XSRF-TOKEN）
- BCryptパスワードハッシング、MyBatisパラメータバインディング

### Gradleタスク
```bash
./gradlew build      # フルビルド
./gradlew test       # テスト（Testcontainers）
./gradlew bootRun    # Spring Boot起動
```

## テスト戦略

1. **単体テスト**: JUnit 5 / Vitest（80%+ カバレッジ）
   - Controller: `@WebMvcTest` + MockBean
   - React: Testing Library + MSW
2. **統合テスト**: Spring Boot Test + Testcontainers / MSW
   - モック削減方針（実DBテスト強化、2025-10-15）
3. **E2Eテスト**: Playwright（主要フロー）
   - ファクトリ関数でテストデータ生成
   - MSWモックサーバー（開発中）
4. **契約テスト**: OpenAPI4j 1.0.7
5. **パフォーマンステスト**: Lighthouse CI

## パフォーマンス目標

- LCP: 1.5秒、TTI: 2秒、バンドル: 300KB以下
- API: p95 200ms、DB: p95 50ms、稼働率: 99.9%

## CI/CD

- **ci.yml**: フロントlint/test/build、バックテスト、Docker、SonarCloud
- **feature.yml**: 命名規則、OWASPスキャン

## 環境・ポート

- **開発**: 8080（API）、5173（Vite）、5432（PostgreSQL）
- **プロファイル**: dev（Swagger有効）、test（Testcontainers）、prod（最適化）

---
*Last Updated: 2025-11-03 (ホーム打刻クロック、AdminGuard、打刻更新APIの指針を追加)*
