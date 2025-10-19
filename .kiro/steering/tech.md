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

#### 選択状態管理の分離
- **カスタムフック**: `useNewsSelection`パターンで選択ロジックをUI層から完全分離
- **Set型管理**: 効率的なID管理（O(1)検索・追加・削除）
- **バルク操作後の同期**: 失敗IDのみ保持、成功IDは自動削除（`syncSelectionAfterBulk`）
- **チェックボックス3状態**: all/indeterminate/none対応（`areSetsEqual`、`syncSelectedIds`ヘルパー）

#### React Query楽観的更新
- **`onMutate`**: キャッシュ直接更新で即時UI反映（公開切り替え、削除等）
- **`onError`**: previousデータでロールバック（エラー時の整合性保証）
- **`onSettled`**: サーバー再検証（`queryClient.invalidateQueries`）で最終整合性確保
- **複数キャッシュキー同時無効化**: list + published等、関連キャッシュの同期更新

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

### サービス層アーキテクチャ（SOLID原則）
- **ファサードパターン**: EmployeeService、NewsManageService
- **単一責任の原則**: Query/Command分離（CQRS）
- **専門サービス分離**:
  - 認証: AuthenticationService、AuthSessionService
  - 従業員: QueryService、CommandService、CacheService
  - 打刻: StampService、StampEditService、StampHistoryService、StampDeleteService、StampOutputService
  - 打刻サブコンポーネント（service/stamp/）: StampHistoryPersistence、OutTimeAdjuster、TimestampConverter、StampFormDataExtractor
  - お知らせ: RegistrationService、ReleaseService、DeletionService、BulkDeletionService、BulkReleaseService

### API層の実装パターン
- **REST Controller層**: record DTO + Bean Validation（`@NotBlank`, `@Pattern`, `@Size`）で入力検証
- **認証・認可**: `SecurityUtil#getCurrentEmployeeId()`で操作者取得、`@PreAuthorize`でロール制御
- **Form Bridge パターン**: 既存のForm型（`ListForm`, `NewsManageForm`, `HomeForm`）でService層と接続
- **型同期**: OpenAPI 3.0スキーマ → `@hey-api/openapi-ts`でTypeScript型自動生成
- **バリデーション同期**:
  - Backend: Bean Validation（record DTO）
  - Frontend: Zod スキーマ（同一ルール・メッセージ）
- **バルクAPI設計**:
  - 部分成功レスポンス（`successCount`, `failureCount`, `results[]`）
  - 上限設定（最大100件）、事前検証とトランザクション管理
  - 個別の成否とエラーメッセージを返却
- **Map型レスポンス変換パターン**（打刻履歴）:
  - Service層: `List<Map<String, Object>>`でカレンダー形式データ返却
  - Controller層: record DTO（`StampHistoryEntryResponse`）に型安全変換
- **バルクAPIエラー戦略**:
  - `extractRootCause`メソッドでネストされた例外の根本原因を抽出
  - バリデーションエラー（IllegalArgumentException）とシステムエラーを分離処理
  - 部分成功時のログ出力（成功件数/失敗件数、`logger.info`で詳細記録）

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
*Last Updated: 2025-10-17 (フロントエンド設計パターン、バルクAPIエラー戦略、MyBatis実装パターン追加)*
