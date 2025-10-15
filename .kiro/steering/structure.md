# TeamDevelop Bravo プロジェクト構造

## ルートディレクトリ構成

```
TeamDevelopBravo-main/
├── .kiro/            # Kiro仕様駆動開発
│   ├── specs/        # 機能仕様書
│   └── steering/     # プロジェクト指針
├── frontend/         # React SPA
├── openapi/          # OpenAPI仕様（API自動生成元）
├── src/              # Javaソースコード
├── docker/           # Docker設定
├── scripts/          # 開発支援スクリプト
├── build.gradle      # Gradleビルド設定
├── docker-compose.yml
└── Dockerfile
```

## バックエンド構造 (`src/main/java/com/example/teamdev/`)

```
├── config/           # Spring設定（Security、OpenAPI、WebMvc等）
├── controller/api/   # REST APIコントローラー
├── service/          # ビジネスロジック（SOLID原則準拠）
│   ├── 認証系: AuthenticationService、AuthSessionService
│   ├── 従業員: EmployeeService（ファサード）、QueryService、CommandService
│   ├── 打刻: StampService、EditService、HistoryService
│   └── お知らせ: NewsManageService（ファサード）、各専門サービス
├── mapper/           # MyBatisマッパー
├── dto/api/          # API用DTO（auth、employee、home、stamp）
├── entity/           # エンティティ（Employee、News、StampHistory等）
├── exception/        # カスタム例外
└── util/             # ユーティリティ
```

## フロントエンド構造 (`frontend/src/`)

```
├── app/              # メインアプリケーション
│   ├── config/       # QueryClient設定
│   ├── providers/    # AppProviders、routeLoaders
│   └── routes.tsx
├── components/ui/    # shadcn/uiコンポーネント
├── features/         # 機能別モジュール
│   ├── auth/         # 認証（AuthProvider、hooks、api）
│   ├── employees/    # 従業員管理
│   ├── home/         # ダッシュボード
│   └── stampHistory/ # 打刻履歴
├── shared/           # 共通コンポーネント
│   ├── api/          # API共通設定、エラークラス
│   ├── components/   # layout、loading
│   └── utils/
├── schemas/          # Zodスキーマ（OpenAPI生成）
├── test/             # テストユーティリティ（MSW、setup）
└── types/            # 自動生成型定義
```

## レイヤードアーキテクチャ

### バックエンド（SOLID原則）
- **Controller**: REST API（Spring MVC）
- **Service**: ビジネスロジック
  - ファサードパターン（複雑性の隠蔽）
  - Query/Command分離（CQRS）
- **Mapper**: データアクセス（MyBatis）
- **Entity/DTO**: データモデル

### フロントエンド
- **機能ベース**: features/配下に機能別モジュール
- **共通コンポーネント**: shared/に再利用可能なコンポーネント
- **UIコンポーネント**: components/ui/にshadcn/ui
- **型定義**: OpenAPI自動生成 + 各機能のtypes/

## ファイル命名規則

- **Java**: PascalCase（`EmployeeService.java`）
- **React**: PascalCase（`SignInPage.tsx`）
- **フック**: camelCase + use prefix（`useAuth.ts`）
- **DB**: snake_case（`stamp_history`）

## Kiro仕様構造

```
.kiro/
├── specs/[feature]/
│   ├── spec.json        # 仕様メタデータ
│   ├── requirements.md  # 要件定義
│   ├── design.md        # 技術設計
│   └── tasks.md         # 実装タスク
└── steering/
    ├── product.md       # 製品概要
    ├── tech.md          # 技術スタック
    └── structure.md     # プロジェクト構造
```

---
*Last Updated: 2025-10-15*
