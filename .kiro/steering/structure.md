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
├── gradle/           # Gradle Wrapper
├── logs/             # アプリケーションログ
├── node_modules/     # Node.js依存関係（ルート）
├── scripts/          # 開発支援スクリプト
├── src/              # Javaソースコード
├── .classpath        # Eclipseクラスパス
├── .dockerignore     # Docker除外設定
├── .env.example      # 環境変数テンプレート
├── .gitattributes    # Git属性設定
├── .gitignore        # Git除外設定
├── .mcp.json         # MCPサーバー設定
├── .nvmrc            # Node.jsバージョン指定
├── .project          # Eclipseプロジェクト設定
├── AGENTS.md         # エージェント設定ドキュメント
├── biome.jsonc       # Biome設定
├── build.gradle      # Gradleビルド設定
├── CLAUDE.md         # Claude AI指示書
├── docker-compose.yml # Docker Compose設定
├── Dockerfile        # Dockerイメージ定義
├── gradlew           # Gradle Wrapper（Unix）
├── gradlew.bat       # Gradle Wrapper（Windows）
├── HELP.md           # Spring Bootヘルプ
├── package.json      # Node.js依存関係（ルート）
├── package-lock.json # 依存関係ロックファイル
├── qodana.yaml       # Qodana静的解析設定
├── README.md         # プロジェクト概要
├── settings.gradle   # Gradle設定
├── tsconfig.json     # TypeScript設定（ルート）
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
│   │   │   └── StartupConfig.java
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
│   │   │   │   ├── HomeRestController.java
│   │   │   │   └── StampHistoryRestController.java
│   │   │   ├── EmployeeListController.java
│   │   │   ├── EmployeeManageController.java
│   │   │   ├── HomeController.java
│   │   │   ├── LogHistoryController.java
│   │   │   ├── NewsManageController.java
│   │   │   ├── SignInController.java
│   │   │   ├── SpaForwardingController.java
│   │   │   ├── StampDeleteController.java
│   │   │   ├── StampEditController.java
│   │   │   ├── StampHistoryController.java
│   │   │   └── StampOutputController.java
│   │   ├── dto/               # データ転送オブジェクト
│   │   │   ├── api/           # API用DTO
│   │   │   │   ├── auth/      # 認証関連
│   │   │   │   ├── common/    # 共通
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
│   │   ├── service/           # ビジネスロジック
│   │   │   ├── AuthenticationService.java
│   │   │   ├── CustomUserDetailsService.java
│   │   │   ├── EmployeeService.java
│   │   │   ├── HomeNewsService.java
│   │   │   ├── LogHistoryQueryService.java
│   │   │   ├── LogHistoryRegistrationService.java
│   │   │   ├── NewsManageDeletionService.java
│   │   │   ├── NewsManageRegistrationService.java
│   │   │   ├── NewsManageReleaseService.java
│   │   │   ├── NewsManageService.java
│   │   │   ├── PasswordMigrationService.java
│   │   │   ├── StampDeleteService.java
│   │   │   ├── StampEditService.java
│   │   │   ├── StampHistoryService.java
│   │   │   ├── StampOutputService.java
│   │   │   └── StampService.java
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
│       ├── static/            # 静的リソース
│       ├── templates/         # Thymeleafテンプレート（レガシー）
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
├── node_modules/      # Node.js依存関係
├── public/            # 静的アセット
│   ├── img/          # 画像ファイル
│   └── vite.svg      # Viteロゴ
├── src/
│   ├── app/          # メインアプリケーション
│   │   ├── App.css
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── MainLayout.tsx
│   │   └── routes.tsx
│   ├── assets/       # アセットファイル
│   ├── features/     # 機能別モジュール
│   │   ├── auth/     # 認証機能
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── employee/ # 従業員管理
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── types/
│   │   ├── home/     # ホーム画面
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── types/
│   │   └── stamp/    # 打刻機能
│   │       ├── api/
│   │       ├── components/
│   │       └── types/
│   ├── shared/       # 共通コンポーネント
│   │   ├── api/      # API共通設定
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── styles/       # グローバルスタイル
│   │   └── index.css
│   ├── test/         # テストユーティリティ
│   │   └── setup.ts
│   ├── main.tsx      # エントリーポイント
│   └── vite-env.d.ts # Vite型定義
├── .env.development   # 開発環境変数
├── .env.example       # 環境変数テンプレート
├── .env.local         # ローカル設定（git-ignored）
├── .eslintrc.json     # ESLint設定
├── .prettierrc        # Prettier設定
├── index.html         # HTMLテンプレート
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

### レイヤードアーキテクチャ
- **プレゼンテーション層**: Controller（Spring MVC/REST）
- **ビジネスロジック層**: Service
- **データアクセス層**: Mapper（MyBatis）
- **エンティティ層**: Entity/DTO

### フロントエンド構造
- **機能ベース**: features/配下に機能別モジュール
- **共通コンポーネント**: shared/に再利用可能なコンポーネント
- **型定義**: 各機能のtypes/に型定義を集約

### API設計パターン
- **RESTful**: リソースベースのAPI設計
- **DTOパターン**: データ転送用オブジェクトの活用
- **統一レスポンス**: 一貫性のあるレスポンス形式

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

### バックエンド
- **依存性注入**: Spring DIコンテナ活用
- **トランザクション管理**: @Transactionalによる宣言的管理
- **例外処理**: GlobalExceptionHandlerによる統一処理
- **セキュリティ**: Spring Securityによる認証・認可

### フロントエンド
- **単一責任の原則**: コンポーネントは一つの責務
- **状態管理**: React QueryによるサーバーState管理
- **型安全性**: TypeScript strictモード
- **再利用性**: 共通コンポーネントの活用

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

### 開発環境設定
- `.env.example`: 環境変数テンプレート
- `application.properties`: Spring Boot設定
- `docker-compose.yml`: Docker環境設定

### CI/CD設定
- `.github/workflows/ci.yml`: メインCIパイプライン
- `.github/workflows/feature.yml`: フィーチャーブランチ検証
- `Dockerfile`: コンテナイメージ定義

## テスト構造

### バックエンドテスト
- **単体テスト**: JUnit 5 + Mockito
- **統合テスト**: Spring Boot Test
- **APIテスト**: @Tag("api")でタグ付け
- **契約テスト**: OpenAPI仕様準拠（オプション）

### フロントエンドテスト
- **単体テスト**: Vitest + Testing Library
- **E2Eテスト**: Playwright
- **カバレッジ**: Vitest Coverage

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