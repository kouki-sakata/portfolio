# TeamDev 勤怠管理システム

## 🌐 デプロイ先 & テストアカウント

**URL:** http://my-spring-app-env.eba-kmwuwpfp.ap-northeast-1.elasticbeanstalk.com/

下記アカウントでログインしてお試しいただけます。

* **ユーザ名:** `test@gmail.com`
* **パスワード:** `test`

⚠️ **注意**
本プロジェクトは現在も開発を継続しており、機能追加やリファクタリングを随時行っています。

---

## 📸 スクリーンショット

![home.png](src/main/resources/static/img/home.png)

## 🛠️ 技術スタック

| カテゴリ | 技術 |
| :--- | :--- |
| **バックエンド** | Java 21, Spring Boot 3.x, Spring Security |
| **フロントエンド** | HTML5, CSS3, JavaScript ES6, jQuery, DataTables |
| **テンプレートエンジン** | Thymeleaf |
| **データベース** | MySQL 8.0 |
| **ビルドツール** | Gradle 8.14.2 |
| **コンテナ** | Docker, Docker Compose |
| **インフラ** | AWS Elastic Beanstalk |
| **セキュリティ** | CSRF保護, パスワードハッシュ化, 認証・認可 |
| **開発・連携ツール**| Git, GitHub, GitHub Actions (CI/CD) |

## ✨ 概要

本アプリケーションは、職業訓練校のチーム開発で制作した企業向けの勤怠管理システムです。

チームメンバーと協力し、要件定義から設計、実装、テストまでの一連の開発プロセスを経験しました。本プロジェクトを通じて、Gitを用いたチームでの共同開発手法や、Spring
Bootによる実践的なWebアプリケーション開発スキルの習得を目的としています。

## 🌟 主な機能

### 🏠 ホーム画面
* **モダンなUI:** Glassmorphism デザインとSVGアニメーションロゴを採用
* **出退勤打刻:** 出勤・退勤時刻を記録します
* **夜勤対応:** 日をまたぐ勤務に対応した打刻が可能です
* **お知らせ表示:** 管理者が設定した重要なお知らせを表示します（公開フラグで制御）

### 👥 従業員管理
* **従業員情報の登録・更新:** 従業員の基本情報を管理します
* **管理者権限設定:** 管理者フラグにより、特定の従業員に管理者権限を付与できます
* **一括削除:** 複数の従業員情報を一括で削除できます
* **メールアドレス重複チェック:** 登録時のリアルタイムチェックで、データの一意性を保証します
* **DataTables統合:** ページング、ソート、検索機能付きの高機能テーブル表示

### 📊 データ管理・表示機能
* **DataTables統合:** 以下の画面で高機能なテーブル表示を実装
  - お知らせ管理画面
  - 従業員情報画面
  - 従業員情報出力画面
  - 打刻記録編集画面（従業員選択）
  - 操作履歴画面
* **操作履歴記録:** 全てのデータ操作（登録・更新・削除）の履歴を記録し、追跡可能です
* **日付フォーマット統一:** `yyyy-MM-dd` と `yyyy/MM/dd` 形式を自動で相互変換し、表示を統一します

### 🔒 セキュリティ機能
* **Spring Security統合:** 包括的な認証・認可システム
* **CSRF保護:** すべてのフォーム送信でCSRFトークンによる保護
* **パスワードハッシュ化:** BCryptによる安全なパスワード管理
* **セッション管理:** 安全なセッション管理とタイムアウト機能

## 💡 工夫した点・アピールポイント

### 🎨 UI/UXの改善
* **モダンなデザイン:** サインイン画面をshadcn/ui風のglassmorphismデザインに刷新
* **SVGロゴ:** 時計をモチーフとしたアニメーション付きSVGロゴを自作
* **DataTables統合:** 6つの主要画面にDataTablesを導入し、検索・ソート・ページング機能を実装
* **レスポンシブ対応:** Bootstrap 5とDataTablesの responsive オプションでモバイル対応

### 🔧 技術的な挑戦

* **共通処理のモジュール化:**
  日付フォーマットの変換など、複数箇所で利用されるロジックを`DateFormatUtil`などのユーティリティクラスに切り出しました。これにより、コードの重複を削減し、メンテナンス性を向上させています。

* **データ整合性の担保:**
  データベースのトランザクション管理を徹底し、従業員情報の一括削除や更新時にデータ不整合が発生しないよう設計しました。また、リアルタイムの入力検証によるメールアドレスの重複チェック機能も実装しています。

* **セキュリティ強化:**
  - Spring Securityによる包括的な認証・認可システム
  - CSRFトークンによる攻撃対策
  - BCryptによるパスワードハッシュ化
  - 包括的エラーハンドリングとロギング

* **DataTables最適化:**
  - サーバーサイドでのデータ処理とJSON応答
  - 重複初期化防止機能
  - 日本語化対応
  - CSRF対応のAjax通信

### 🏗️ 開発環境の整備
* **Docker化:** 開発環境をDocker Composeで統一し、環境構築の簡素化を実現
* **CI/CDパイプライン:** GitHub Actionsによる自動ビルド・テスト・デプロイ
* **テストデータ拡充:** 操作履歴テーブルに100件のテストデータを追加し、DataTablesの動作検証を充実

### 👥 チーム開発のプロセス
* **コーディング規約の策定:**
  チーム内で変数名やインデントなどのコーディング規約を定め、コードの可読性と保守性を高めました。

## 🏁 セットアップと実行方法

ローカル環境で本プロジェクトをセットアップする手順です。

### 🐳 Docker を使用した環境構築（推奨）

1. **リポジトリをクローンします。**
   ```bash
   git clone [リポジトリのURL]
   cd TeamDevelopBravo-main
   ```

2. **Docker Compose で環境を起動します。**
   ```bash
   # 環境変数ファイルをコピー
   cp .env.example .env
   
   # Docker環境を起動
   docker-compose up -d
   ```

3. **ブラウザで `http://localhost:8080` にアクセスしてください。**

### 💻 ローカル環境での直接実行

#### 前提条件
* Java 21
* MySQL 8.0
* Gradle 8.14.2

#### 手順

1. **リポジトリをクローンします。**
   ```bash
   git clone [リポジトリのURL]
   cd TeamDevelopBravo-main
   ```

2. **データベースをセットアップします。**
   ```bash
   # MySQLサーバーを起動
   # データベースとテーブルを作成
   mysql -u root -p < src/main/resources/01_schema.sql
   mysql -u root -p < src/main/resources/02_data.sql
   ```

3. **アプリケーション設定を確認します。**
   `src/main/resources/application.properties` のMySQL接続情報を環境に合わせて変更してください。

4. **アプリケーションをビルド・実行します。**
   ```bash
   ./gradlew bootRun
   ```

5. **ブラウザで `http://localhost:8080` にアクセスしてください。**

### ⚙️ 環境設定（Environment Profiles）

本アプリケーションは、環境に応じて異なる設定を適用できます。

#### 本番環境（デフォルト）
```bash
# デフォルト設定で起動
./gradlew bootRun
```

#### 開発環境
```bash
# 開発環境設定を使用
./gradlew bootRun --args='--spring.profiles.active=dev'

# または環境変数で指定
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
```

#### テスト環境（パスワードマイグレーション無効）
```bash
# テスト環境設定を使用（起動時のパスワードマイグレーションが無効化されます）
./gradlew bootRun --args='--spring.profiles.active=test'

# または環境変数で指定
SPRING_PROFILES_ACTIVE=test ./gradlew bootRun
```

#### 個別設定による制御
環境変数でパスワードマイグレーションのみを制御することも可能です：
```bash
# パスワードマイグレーションを無効化
PASSWORD_MIGRATION_ENABLED=false ./gradlew bootRun

# 環境識別子を設定
APP_ENVIRONMENT=test ./gradlew bootRun
```

### 🔧 開発用コマンド

```bash
# テスト実行
./gradlew test

# ビルド
./gradlew build

# Docker イメージビルド
docker build -t teamdev:latest .

# 開発ワークフロー実行
./scripts/dev-workflow.sh
```

## 📁 プロジェクト構成

```
TeamDevelopBravo-main/
├── .github/                    # GitHub Actions CI/CD設定
├── docker/                     # Docker関連設定
├── scripts/                    # 開発用スクリプト
├── src/
│   ├── main/
│   │   ├── java/com/example/teamdev/
│   │   │   ├── config/         # Spring設定クラス
│   │   │   ├── controller/     # MVCコントローラー
│   │   │   ├── dto/           # DataTables用DTO
│   │   │   ├── entity/        # データベースエンティティ
│   │   │   ├── mapper/        # MyBatisマッパー
│   │   │   ├── service/       # ビジネスロジック
│   │   │   ├── util/          # ユーティリティクラス
│   │   │   └── exception/     # 例外クラス
│   │   └── resources/
│   │       ├── static/        # CSS, JS, 画像ファイル
│   │       ├── templates/     # Thymeleafテンプレート
│   │       ├── *.sql         # データベーススキーマ・データ
│   │       └── *.properties  # アプリケーション設定
│   └── test/                  # テストコード
├── build.gradle              # Gradle設定
├── docker-compose.yml        # Docker Compose設定
└── README.md                 # このファイル
```

## 🎯 今後の拡張予定

### ✅ 完了済み
* **ユーザー認証・認可機能の強化** - Spring Securityによる包括的セキュリティ実装
* **CI/CDパイプラインの構築** - GitHub Actionsによる自動化
* **DataTables統合** - 高機能テーブル表示の全画面実装
* **UI/UXの改善** - モダンなデザインへの刷新

### 🚀 今後の計画
* **REST API化** - バックエンドのAPIサーバー化
* **フロントエンドのモダン化** - React/Vue.jsへの置き換え検討
* **テストカバレッジの向上** - JUnitによる単体テストの充実
* **パフォーマンス最適化** - データベースクエリ最適化
* **多言語対応** - 国際化機能の拡充
