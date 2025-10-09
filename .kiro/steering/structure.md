# TeamDevelop Bravo プロジェクト構造

## ルートディレクトリ構成

```
TeamDevelopBravo-main/
├── .claude/           # Claude AI設定とコマンド
├── .github/           # GitHub Actionsワークフロー
│   └── workflows/     # CI/CDパイプライン定義
├── .gradle/           # Gradleビルドキャッシュ
├── .idea/            # IntelliJ IDEA設定
├── .kiro/            # Kiro仕様駆動開発フレームワーク
│   ├── specs/        # 機能仕様書
│   └── steering/     # プロジェクト指針ドキュメント
├── .serena/          # Serena MCP メモリファイル
│   └── memories/     # プロジェクト知識の永続化
├── .settings/        # Eclipse設定
├── .vscode/          # VS Code設定
├── bin/              # ビルド出力（Eclipse）
├── build/            # Gradleビルド出力
├── docker/           # Docker設定ファイル
├── docs/             # プロジェクトドキュメント
├── frontend/         # React SPAフロントエンド
├── openapi/          # OpenAPI仕様定義
│   └── openapi.yaml  # API仕様ファイル（自動生成元）
├── gradle/           # Gradle Wrapper
├── logs/             # アプリケーションログ
├── scripts/          # 開発支援スクリプト
├── src/              # Javaソースコード
├── .classpath        # Eclipseクラスパス
├── .dockerignore     # Docker除外設定
├── .env.example      # 環境変数テンプレート
├── .gitattributes    # Git属性設定
├── .gitignore        # Git除外設定
├── .mcp.json         # MCPサーバー設定
├── .project          # Eclipseプロジェクト設定
├── AGENTS.md         # エージェント設定ドキュメント
├── build.gradle      # Gradleビルド設定
├── CLAUDE.md         # Claude AI指示書
├── docker-compose.yml # Docker Compose設定
├── Dockerfile        # Dockerイメージ定義
├── gradlew           # Gradle Wrapper（Unix）
├── gradlew.bat       # Gradle Wrapper（Windows）
├── HELP.md           # Spring Bootヘルプ
├── qodana.yaml       # Qodana静的解析設定
├── README.md         # プロジェクト概要
├── settings.gradle   # Gradle設定
└── ultracite.config.json # Ultracite設定
```

## サブディレクトリ構造

### Javaソースコード (`src/`)

```
src/
├── main/
│   ├── java/com/example/teamdev/
│   │   ├── annotation/         # カスタムアノテーション
│   │   │   └── SessionRequired.java
│   │   ├── aspect/            # AOP アスペクト
│   │   │   └── SessionValidationAspect.java
│   │   ├── config/            # Spring設定クラス
│   │   │   ├── AspectConfig.java
│   │   │   ├── CacheConfig.java
│   │   │   ├── LocaleConfig.java
│   │   │   ├── OpenApiConfig.java
│   │   │   ├── SecurityConfig.java
│   │   │   ├── ShutdownConfig.java
│   │   │   ├── StartupConfig.java
│   │   │   └── WebMvcConfig.java
│   │   ├── constant/          # 定数クラス
│   │   │   ├── AppConstants.java
│   │   │   ├── DisplayName.java
│   │   │   └── OperationType.java
│   │   ├── controller/        # MVCコントローラー
│   │   │   ├── advice/        # 例外ハンドラー
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── api/           # REST APIコントローラー
│   │   │   │   ├── AuthRestController.java
│   │   │   │   ├── EmployeeRestController.java
│   │   │   │   ├── FeatureFlagRestController.java
│   │   │   │   ├── HomeRestController.java
│   │   │   │   └── StampHistoryRestController.java
│   │   │   └── SpaForwardingController.java # SPA単一エントリポイント
│   │   ├── dto/               # データ転送オブジェクト
│   │   │   ├── api/           # API用DTO
│   │   │   │   ├── auth/      # 認証関連
│   │   │   │   ├── common/    # 共通（FeatureFlagsResponse含む）
│   │   │   │   ├── employee/  # 従業員
│   │   │   │   ├── home/      # ホーム画面
│   │   │   │   └── stamp/     # 打刻
│   │   │   ├── Column.java
│   │   │   ├── DataTablesRequest.java
│   │   │   ├── DataTablesResponse.java
│   │   │   ├── Order.java
│   │   │   └── Search.java
│   │   ├── entity/            # エンティティクラス
│   │   │   ├── Employee.java
│   │   │   ├── LogHistory.java
│   │   │   ├── LogHistoryDisplay.java
│   │   │   ├── News.java
│   │   │   ├── StampDelete.java
│   │   │   ├── StampHistory.java
│   │   │   └── StampHistoryDisplay.java
│   │   ├── exception/         # カスタム例外
│   │   │   ├── BusinessException.java
│   │   │   ├── DuplicateEmailException.java
│   │   │   ├── EmployeeNotFoundException.java
│   │   │   └── ValidationException.java
│   │   ├── form/              # フォームクラス
│   │   │   ├── EmployeeManageForm.java
│   │   │   ├── HomeForm.java
│   │   │   ├── ListForm.java
│   │   │   ├── NewsManageForm.java
│   │   │   ├── SignInForm.java
│   │   │   ├── StampDeleteForm.java
│   │   │   ├── StampEditForm.java
│   │   │   ├── StampHistoryForm.java
│   │   │   └── StampOutputForm.java
│   │   ├── mapper/            # MyBatisマッパー
│   │   │   ├── EmployeeMapper.java
│   │   │   ├── LogHistoryMapper.java
│   │   │   ├── NewsMapper.java
│   │   │   ├── StampDeleteMapper.java
│   │   │   └── StampHistoryMapper.java
│   │   ├── service/           # ビジネスロジック（SOLID原則準拠）
│   │   │   ├── 【認証系】
│   │   │   ├── AuthenticationService.java          # 認証処理
│   │   │   ├── AuthSessionService.java             # セッション管理
│   │   │   ├── CustomUserDetailsService.java       # ユーザー詳細取得
│   │   │   ├── PasswordMigrationService.java       # パスワード移行
│   │   │   ├── 【従業員管理系 - ファサードパターン】
│   │   │   ├── EmployeeService.java                # ファサード（各専門サービスに委譲）
│   │   │   ├── EmployeeQueryService.java           # 照会専用（単一責任）
│   │   │   ├── EmployeeCommandService.java         # 更新専用（単一責任）
│   │   │   ├── EmployeeDataTableService.java       # DataTables統合専用
│   │   │   ├── EmployeeCacheService.java           # キャッシュ管理専用
│   │   │   ├── 【打刻管理系】
│   │   │   ├── StampService.java                   # 打刻登録
│   │   │   ├── StampEditService.java               # 打刻編集
│   │   │   ├── StampHistoryService.java            # 履歴管理
│   │   │   ├── StampDeleteService.java             # 削除処理
│   │   │   ├── StampOutputService.java             # CSV出力
│   │   │   ├── 【お知らせ管理系 - ファサードパターン】
│   │   │   ├── NewsManageService.java              # ファサード
│   │   │   ├── NewsManageRegistrationService.java  # 登録専用
│   │   │   ├── NewsManageReleaseService.java       # 公開管理専用
│   │   │   ├── NewsManageDeletionService.java      # 削除専用
│   │   │   ├── HomeNewsService.java                # ホーム画面向け取得
│   │   │   ├── 【ログ履歴系】
│   │   │   ├── LogHistoryQueryService.java         # 照会専用
│   │   │   ├── LogHistoryRegistrationService.java  # 登録専用
│   │   │   ├── 【フィーチャーフラグ系】
│   │   │   └── FeatureFlagService.java             # フラグ管理
│   │   ├── util/              # ユーティリティクラス
│   │   │   ├── DateFormatUtil.java
│   │   │   ├── LogUtil.java
│   │   │   ├── MessageUtil.java
│   │   │   ├── ModelUtil.java
│   │   │   ├── NumberUtil.java
│   │   │   ├── SecurityUtil.java
│   │   │   ├── SessionUtil.java
│   │   │   ├── SpringSecurityModelUtil.java
│   │   │   └── TimeFormatUtil.java
│   │   └── TeamDevelopApplication.java  # メインクラス
│   └── resources/
│       ├── mapper/            # MyBatis XMLマッパー
│       ├── static/            # 静的リソース（React SPAビルド成果物）
│       ├── 01_schema.sql      # データベーススキーマ
│       ├── 02_data.sql        # 初期データ
│       ├── application.properties       # アプリケーション設定
│       ├── application-dev.properties   # 開発環境設定
│       ├── application-test.properties  # テスト環境設定
│       ├── application-prod.properties  # 本番環境設定
│       ├── logback-spring.xml           # ログ設定
│       └── messages.properties          # メッセージリソース
├── test/
│   └── java/com/example/teamdev/
│       ├── controller/        # コントローラーテスト
│       ├── service/           # サービステスト
│       ├── mapper/            # マッパーテスト
│       └── TeamDevelopApplicationTests.java
└── contractTest/              # OpenAPI契約テスト（オプション）
    └── java/
```

### フロントエンド (`frontend/`)

```
frontend/
├── dist/              # ビルド出力
├── e2e/              # Playwright E2Eテスト
│   ├── support/      # テストヘルパー
│   └── *.spec.ts     # E2Eテストファイル
├── node_modules/      # Node.js依存関係
├── performance/       # パフォーマンス設定
│   └── performance-budgets.json # バンドルサイズ予算
├── public/            # 静的アセット
│   ├── img/          # 画像ファイル
│   └── vite.svg      # Viteロゴ
├── src/
│   ├── app/          # メインアプリケーション
│   │   ├── config/       # アプリケーション設定
│   │   │   ├── enhanced-query-client.ts
│   │   │   └── queryClient.ts
│   │   ├── providers/    # コンテキストプロバイダー
│   │   │   ├── AppProviders.tsx
│   │   │   └── routeLoaders.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── MainLayout.tsx
│   │   └── routes.tsx
│   ├── assets/       # アセットファイル
│   ├── components/   # shadcn/uiコンポーネント
│   │   └── ui/       # UIプリミティブ
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── data-table.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── skeleton.tsx
│   │       ├── toast.tsx
│   │       └── toaster.tsx
│   ├── features/     # 機能別モジュール
│   │   ├── auth/     # 認証機能
│   │   │   ├── api/      # APIクライアント
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   └── internal/
│   │   │   │       └── AuthContext.tsx
│   │   │   ├── hooks/
│   │   │   ├── services/ # SessionManager等
│   │   │   └── types/
│   │   ├── employees/ # 従業員管理
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── home/     # ホーム画面
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── stampHistory/    # 打刻履歴
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── types/
│   ├── hooks/        # グローバルフック
│   ├── lib/          # ユーティリティライブラリ
│   │   └── utils.ts
│   ├── schemas/      # Zodスキーマ定義
│   │   └── api.ts    # OpenAPIから生成
│   ├── shared/       # 共通コンポーネント
│   │   ├── api/      # API共通設定
│   │   │   ├── errors/    # エラークラス
│   │   │   └── events/    # イベント管理
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppSidebar.tsx
│   │   │   │   └── MobileNavigation.tsx
│   │   │   └── loading/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── skeletons/
│   │   ├── contexts/
│   │   ├── error-handling/
│   │   ├── hooks/
│   │   ├── performance/
│   │   ├── types/
│   │   └── utils/
│   ├── styles/       # グローバルスタイル
│   │   └── index.css
│   ├── test/         # テストユーティリティ
│   │   ├── msw/     # MSWモックサーバー
│   │   │   ├── server.ts
│   │   │   └── handlers/
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── types/        # 自動生成型定義
│   ├── main.tsx      # エントリーポイント
│   └── vite-env.d.ts # Vite型定義
├── .biomeignore       # Biome除外設定
├── .env.development   # 開発環境変数
├── .env.example       # 環境変数テンプレート
├── .nvmrc             # Node.jsバージョン指定
├── biome.jsonc        # Biome統合設定
├── components.json    # shadcn/ui設定
├── index.html         # HTMLテンプレート
├── lighthouserc.json  # Lighthouse CI設定
├── openapi-ts.config.ts # OpenAPI型生成設定
├── package.json       # 依存関係とスクリプト
├── package-lock.json  # ロックファイル
├── playwright.config.ts # Playwright設定
├── postcss.config.js  # PostCSS設定
├── README.md          # フロントエンドREADME
├── tailwind.config.js # Tailwind CSS設定
├── tsconfig.app.json  # TypeScript設定（アプリ）
├── tsconfig.json      # TypeScript設定（メイン）
├── tsconfig.node.json # TypeScript設定（Node）
├── tsconfig.vitest.json # TypeScript設定（テスト）
├── vite.config.ts     # Vite設定
└── vitest.config.ts   # Vitest設定
```

## コード編成パターン

### レイヤードアーキテクチャ（SOLID原則準拠）
- **プレゼンテーション層**: Controller（Spring MVC/REST）
- **ビジネスロジック層**: Service
  - **ファサードパターン**: 複雑性の隠蔽（EmployeeService、NewsManageService等）
  - **単一責任の原則**: Query/Command/Cache等の責務分離
  - **依存性逆転の原則**: インターフェースベースの設計
- **データアクセス層**: Mapper（MyBatis）
- **エンティティ層**: Entity/DTO

### フロントエンド構造
- **機能ベース**: features/配下に機能別モジュール
- **共通コンポーネント**: shared/に再利用可能なコンポーネント
- **UIコンポーネント**: components/ui/にshadcn/uiベース
- **型定義**: 各機能のtypes/に型定義を集約
- **API統合**: OpenAPI仕様からの自動型生成

### API設計パターン
- **RESTful**: リソースベースのAPI設計
- **DTOパターン**: データ転送用オブジェクトの活用
- **統一レスポンス**: 一貫性のあるレスポンス形式
- **OpenAPI駆動開発**: API仕様から型を自動生成
- **型安全な通信**: フロント/バック間の型一貫性
- **Zodスキーマ統合**: ランタイムバリデーション

## ファイル命名規則

### Java
- **クラス**: PascalCase（`EmployeeService.java`）
- **パッケージ**: lowercase（`com.example.teamdev`）
- **定数**: UPPER_SNAKE_CASE

### TypeScript/React
- **コンポーネント**: PascalCase（`SignInPage.tsx`）
- **フック**: camelCase with use prefix（`useAuth.ts`）
- **ユーティリティ**: camelCase（`apiClient.ts`）
- **型定義**: PascalCase（`Employee.ts`）

### データベース
- **テーブル**: snake_case（`stamp_history`）
- **カラム**: snake_case（`employee_id`）
- **マイグレーション**: 連番_説明（`01_schema.sql`）

## Import編成

### Java
```java
// 1. Java標準ライブラリ
import java.util.*;
import java.time.*;

// 2. Spring Framework
import org.springframework.*;

// 3. 外部ライブラリ
import lombok.*;

// 4. プロジェクト内部
import com.example.teamdev.*;
```

### TypeScript
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 内部絶対パス
import { apiClient } from '@/shared/api';

// 3. 相対パス
import { LoginForm } from './LoginForm';

// 4. 型インポート
import type { User } from '@/shared/types';
```

## 主要アーキテクチャ原則

### バックエンド（SOLID原則準拠）
- **単一責任の原則（SRP）**: 各サービスが1つの責務のみを持つ
  - 例: EmployeeQueryService（照会のみ）、EmployeeCommandService（更新のみ）
- **開放閉鎖の原則（OCP）**: ファサードパターンによる拡張性確保
- **依存性逆転の原則（DIP）**: Spring DIコンテナによるインターフェース駆動
- **トランザクション管理**: @Transactionalによる宣言的管理
- **例外処理**: GlobalExceptionHandlerによる統一処理
- **セキュリティ**: Spring Securityによる認証・認可

### フロントエンド
- **単一責任の原則**: コンポーネントは一つの責務
- **状態管理**: React QueryによるサーバーState管理
- **型安全性**: TypeScript strictモード
- **再利用性**: 共通コンポーネントの活用
- **コード品質**: Biomeによる統合管理

## ビルド成果物

### バックエンド
```
build/
├── classes/          # コンパイル済みクラス
├── libs/            # JARファイル
├── resources/       # リソースファイル
└── tmp/            # 一時ファイル
```

### フロントエンド
```
frontend/dist/
├── assets/         # 静的アセット
│   ├── index-*.js  # バンドルされたJS
│   └── index-*.css # バンドルされたCSS
├── index.html      # エントリーHTML
└── vite.svg       # ファビコン
```

## 設定ファイル

### ビルド設定
- `build.gradle`: Gradleビルド設定
- `settings.gradle`: Gradleプロジェクト設定
- `package.json`: Node.js依存関係
- `vite.config.ts`: Viteビルド設定
- `biome.jsonc`: Biome統合コード品質設定

### 開発環境設定
- `.env.example`: 環境変数テンプレート
- `application.properties`: Spring Boot設定
- `docker-compose.yml`: Docker環境設定

### CI/CD設定
- `.github/workflows/ci.yml`: メインCIパイプライン
- `.github/workflows/feature.yml`: フィーチャーブランチ検証
- `Dockerfile`: コンテナイメージ定義

## コード品質管理

### Biome設定構造
- **継承**: Ultracite設定をベースに拡張
- **プロジェクト固有ルール**:
  - バレルファイル（index.ts）パターンを許可
  - APIのsnake_case、定数の大文字を許可
  - kebab-case、PascalCase、camelCase対応
  - 最大複雑度15（警告レベル）
- **オーバーライド設定**:
  - UIコンポーネント: 名前空間インポート許可
  - テストファイル: マジックナンバー・複雑度チェック無効化
  - 認証機能: 非同期処理のvoid許可
  - 自動生成ファイル: リンティング無効化

## テスト構造

### バックエンドテスト
- **単体テスト**: JUnit 5 + Mockito
- **統合テスト**: Spring Boot Test + Testcontainers
- **APIテスト**: @Tag("api")でタグ付け
- **契約テスト**: OpenAPI仕様準拠（オプション）
- **カバレッジ**: 85%以上（サービス層）

### フロントエンドテスト
- **単体テスト**: Vitest + Testing Library
- **統合テスト**: MSW v2.11.3 + Vitest
- **E2Eテスト**: Playwright v1.49.1
- **カバレッジ**: 80%以上

## 開発ワークフロー

### Gitブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `fix/*`: バグ修正
- `chore/*`: 雑務・設定変更

### コミット規約
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` ビルド・設定

## Kiro仕様駆動開発

### 仕様構造
```
.kiro/
├── specs/        # 機能仕様書
│   └── [feature-name]/
│       ├── spec.json        # 仕様メタデータ
│       ├── requirements.md  # 要件定義
│       ├── design.md        # 技術設計
│       └── tasks.md         # 実装タスク
└── steering/     # プロジェクト指針
    ├── product.md     # 製品概要
    ├── tech.md        # 技術スタック
    └── structure.md   # プロジェクト構造
```

### 開発プロセス
1. `spec-init`: 仕様初期化
2. `spec-requirements`: 要件定義
3. `spec-design`: 技術設計
4. `spec-tasks`: タスク生成
5. `spec-impl`: 実装実行

---
*Last Updated: 2025-01-09*
*Structure Version: 2.0*