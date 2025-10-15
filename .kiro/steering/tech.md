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

## バックエンド

### 主要スタック
- Java 21、Spring Boot 3.4.3、Spring Security 6.4
- MyBatis 3.0.4、PostgreSQL 16、HikariCP
- Springdoc OpenAPI 2.6.0

### サービス層アーキテクチャ（SOLID原則）
- **ファサードパターン**: EmployeeService、NewsManageService
- **単一責任の原則**: Query/Command分離（CQRS）
- **専門サービス分離**:
  - 認証: AuthenticationService、AuthSessionService
  - 従業員: QueryService、CommandService、CacheService
  - 打刻: StampService、EditService、HistoryService、DeleteService
  - お知らせ: RegistrationService、ReleaseService、DeletionService

### API層の実装パターン
- `NewsRestController`に代表されるREST層はrecord DTO + Bean Validationで入力を確定させ、`SecurityUtil#getCurrentEmployeeId()`で操作者IDを取得してService層へ委譲する。
- 変更系エンドポイントは`@PreAuthorize("hasRole('ADMIN')")`で保護し、公開切り替えは`ListForm`/`NewsManageForm`を経由して既存サービスのドメインロジックを再利用する。
- レスポンスはエンティティ→DTO変換ヘルパーでcamelCaseへ正規化し、OpenAPI 3.0スキーマと`npm run generate:api`で生成されるTypeScript型と突き合わせる。

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
2. **統合テスト**: Spring Boot Test + Testcontainers / MSW
   - モック削減方針（実DBテスト強化、2025-10-15）
3. **E2Eテスト**: Playwright（主要フロー）
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
*Last Updated: 2025-10-15 (News REST API統合)*
