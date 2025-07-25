# TeamDev 勤怠管理システム - 開発ガイド

## プロジェクト概要
Spring Boot 3.x + Java 21で構築された企業向け勤怠管理システム。モダンなUIとセキュアな設計を特徴とし、DataTablesによる高機能なデータ表示機能を提供します。Spring Security、MyBatis、MySQL を使用したWebアプリケーションです。

## コーディング規約

### Java コーディング規約

#### 命名規則
- **クラス名**: PascalCase（例: `EmployeeService`, `HomeController`）
- **メソッド名**: camelCase（例: `createEmployee`, `getAllEmployees`）
- **変数名**: camelCase（例: `employeeId`, `updateDate`）
- **定数**: UPPER_CASE（例: `CACHE_DURATION_MS`, `MAX_CONNECTIONS`）
- **パッケージ名**: 小文字、ドット区切り（例: `com.example.teamdev.service`）

#### コメント規約
- **Javadoc**: publicメソッドには必須、パッケージプライベートも推奨
- **パラメータ説明**: `@param`で詳細に記述
- **戻り値説明**: `@return`で詳細に記述
- **例外説明**: `@throws`で発生条件を記述
- **日本語使用**: 業務ロジックの説明は日本語で記述可

```java
/**
 * 新しい従業員情報を作成します。
 * 指定されたメールアドレスが既に存在する場合は {@link DuplicateEmailException} をスローします。
 *
 * @param form             登録する従業員情報を含むフォームオブジェクト
 * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
 * @return 作成された従業員エンティティ
 * @throws DuplicateEmailException メールアドレスが重複している場合
 */
```

#### アノテーション規約
- **Service層**: `@Service`, `@Transactional`
- **Controller層**: `@Controller`, `@RequestMapping`
- **Repository層**: `@Mapper`（MyBatis使用）
- **DI**: `@Autowired`はコンストラクタインジェクション推奨

#### エラーハンドリング
- **業務例外**: `BusinessException`を継承したカスタム例外を使用
- **技術例外**: Spring標準例外を適切に処理
- **ログ出力**: SLF4Jを使用し、適切なレベルで記録

### フロントエンド規約

#### JavaScript
- **ES6+**: モダンなJavaScript構文を使用
- **jQuery**: DataTablesとの親和性を考慮して継続使用
- **命名**: camelCase（例: `employeeList`, `initDataTable`）

#### CSS
- **BEM記法**: 推奨（例: `.employee-list__item--active`）
- **レスポンシブ**: モバイルファーストアプローチ
- **カスタムプロパティ**: CSS変数を活用

#### HTML（Thymeleaf）
- **属性記法**: `th:*`属性を適切に使用
- **セキュリティ**: CSRF保護、XSS対策を徹底
- **アクセシビリティ**: WAI-ARIA属性を適切に付与

## プロジェクト構造

### ディレクトリ構成
```
src/main/java/com/example/teamdev/
├── TeamDevelopApplication.java    # メインクラス
├── config/                        # 設定クラス
│   ├── SecurityConfig.java        # Spring Security設定
│   ├── LocaleConfig.java         # 国際化設定
│   ├── StartupConfig.java        # 起動時処理
│   └── ShutdownConfig.java       # シャットダウン処理
├── controller/                    # MVCコントローラー
│   ├── advice/                    # 例外ハンドラー
│   │   └── GlobalExceptionHandler.java
│   ├── HomeController.java        # ホーム画面
│   ├── EmployeeListController.java
│   ├── EmployeeManageController.java
│   └── ...
├── service/                       # ビジネスロジック
│   ├── EmployeeService.java       # 従業員関連サービス
│   ├── StampService.java         # 打刻関連サービス
│   └── ...
├── mapper/                        # MyBatisマッパー
│   ├── EmployeeMapper.java
│   └── ...
├── entity/                        # データベースエンティティ
│   ├── Employee.java
│   └── ...
├── dto/                           # DataTables用DTO
│   ├── DataTablesRequest.java
│   ├── DataTablesResponse.java
│   └── ...
├── form/                          # フォームオブジェクト
│   ├── EmployeeManageForm.java
│   └── ...
├── exception/                     # カスタム例外
│   ├── BusinessException.java
│   ├── DuplicateEmailException.java
│   └── ...
├── util/                          # ユーティリティクラス
│   ├── DateFormatUtil.java        # 日付フォーマット変換
│   ├── SecurityUtil.java          # セキュリティ関連
│   └── ...
└── constant/                      # 定数クラス
    ├── AppConstants.java
    └── ...
```

### アーキテクチャパターン
- **レイヤードアーキテクチャ**: Controller → Service → Mapper の階層構造
- **DTOパターン**: フロントエンドとの通信にはDTOを使用
- **DIパターン**: Spring管理のBeanを活用
- **トランザクション管理**: Serviceレイヤで`@Transactional`を使用

### データベース設計
- **命名規則**: snake_case（例: `employee_id`, `update_date`）
- **インデックス**: 検索頻度の高いカラムに適切に設定
- **制約**: 外部キー制約、NOT NULL制約を適切に設定

## 共通ワークフロー

### 開発フロー

#### 1. ブランチ戦略
```bash
# メインブランチ
main          # 本番用（直接コミット禁止）
develop       # 開発統合用

# フィーチャーブランチ
feature/機能名   # 新機能開発用
bugfix/バグ名    # バグ修正用
hotfix/修正名    # 緊急修正用
```

#### 2. 開発手順
```bash
# ブランチ作成
git checkout -b feature/employee-search
git push -u origin feature/employee-search

# 開発・コミット
git add .
git commit -m "feat: 従業員検索機能を追加"

# 品質チェック
./scripts/dev-workflow.sh --quick

# プッシュ・プルリクエスト
git push origin feature/employee-search
```

#### 3. コミットメッセージ規約
```
タイプ: 変更内容の要約

詳細な説明（必要に応じて）
```

**タイプ一覧:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `perf`: パフォーマンス改善

### テスト戦略

#### 1. テスト種別
- **単体テスト**: JUnit 5 + Mockito
- **統合テスト**: Spring Boot Test
- **E2Eテスト**: 手動テスト（現在）

#### 2. テスト実行
```bash
# 単体テスト
./gradlew test

# 統合テスト（Docker環境）
./scripts/dev-workflow.sh --full

# 品質チェック付きテスト
./scripts/dev-workflow.sh --security
```

#### 3. カバレッジ目標
- **Service層**: 80%以上
- **Controller層**: 70%以上
- **Util層**: 90%以上

### ビルド・デプロイ

#### 1. ローカル環境
```bash
# Dockerで起動
docker-compose up -d

# Gradleで起動
./gradlew bootRun
```

#### 2. CI/CD パイプライン
- **GitHub Actions**: `.github/workflows/`配下で管理
- **自動テスト**: PR作成時、mainブランチマージ時
- **自動デプロイ**: AWS Elastic Beanstalk（本番環境）

#### 3. 環境設定
- **開発環境**: `application-dev.properties`
- **本番環境**: 環境変数で設定
- **Docker環境**: `docker-compose.yml`で管理

### セキュリティ対策

#### 1. 開発時チェック項目
- **CSRF保護**: 全フォームでCSRFトークン使用
- **XSS対策**: Thymeleafの自動エスケープ機能活用
- **SQL インジェクション**: MyBatisの PreparedStatement 使用
- **認証・認可**: Spring Security で実装

#### 2. セキュリティスキャン
```bash
# 依存関係脆弱性チェック
./gradlew dependencyCheckAnalyze

# 機密情報チェック
./scripts/dev-workflow.sh --security
```

### パフォーマンス最適化

#### 1. データベース最適化
- **N+1問題対策**: バッチ取得、適切なJOIN使用
- **キャッシュ活用**: Service層でのメモリキャッシュ
- **インデックス最適化**: 検索条件に応じたインデックス設計

#### 2. フロントエンド最適化
- **DataTables**: サーバーサイドでのページング・検索
- **レスポンシブデザイン**: モバイルファーストアプローチ
- **リソース最適化**: CSS/JS の圧縮・統合

### 運用・メンテナンス

#### 1. ログ管理
- **アプリケーションログ**: `logs/teamdev.log`
- **エラーログ**: `logs/teamdev-error.log`
- **セキュリティログ**: `logs/teamdev-security.log`
- **パフォーマンスログ**: `logs/teamdev-performance.log`

#### 2. 監視項目
- **レスポンス時間**: 2秒以内目標
- **エラー率**: 1%以下維持
- **CPU使用率**: 70%以下維持
- **メモリ使用率**: 80%以下維持

## 開発ツール・コマンド

### 主要コマンド
```bash
# テスト実行
./gradlew test

# ビルド
./gradlew build

# 起動
./gradlew bootRun

# 開発支援スクリプト
./scripts/dev-workflow.sh --help

# Docker環境
docker-compose up -d
docker-compose down
```

### IDE設定推奨
- **Java**: OpenJDK 21
- **文字コード**: UTF-8
- **インデント**: スペース4文字
- **改行コード**: LF

## 注意事項

### セキュリティ
- **機密情報**: ハードコード禁止、環境変数使用
- **パスワード**: BCryptでハッシュ化
- **セッション**: 適切なタイムアウト設定

### パフォーマンス
- **データ取得**: 必要最小限のデータのみ取得
- **トランザクション**: 適切なスコープで管理
- **キャッシュ**: データの更新頻度を考慮して実装

### 可読性・保守性
- **コメント**: 業務ロジックは日本語で詳細に記述
- **メソッド分割**: 1メソッド50行以内目標
- **クラス分割**: 単一責任の原則を遵守