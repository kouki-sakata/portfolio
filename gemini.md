# プロジェクト概要

このプロジェクトは、職業訓練校のチーム開発で制作された企業向けの勤怠管理システム「TeamDev 勤怠管理システム」です。従業員の出退勤打刻、従業員情報管理、お知らせ管理、打刻記録の編集・出力・一括削除、操作履歴確認などの機能を提供します。

## 目的

*   Git を用いたチームでの共同開発手法の習得。
*   Spring Boot による実践的な Web アプリケーション開発スキルの習得。
*   要件定義から設計、実装、テストまでの一連の開発プロセスの経験。

---

# 技術スタック

このプロジェクトは以下の主要な技術を使用しています。

*   **バックエンド**:
    *   Java 21
    *   Spring Boot 3.4.3
    *   MyBatis 3.0.4
    *   Lombok
*   **フロントエンド**:
    *   HTML (Thymeleaf)
    *   CSS (Bootstrap, カスタムCSS)
    *   JavaScript (jQuery)
    *   FontAwesome
    *   Flatpickr (日付選択)
*   **データベース**:
    *   MySQL 8.0
*   **ビルドツール**:
    *   Gradle 8.14.2
*   **インフラ**:
    *   AWS Elastic Beanstalk (デプロイ先)
*   **開発・連携ツール**:
    *   Git
    *   GitHub

---

# コードスタイルと規約

*   **Java**:
    *   標準的な Spring Boot のプロジェクト構造と命名規則に従います。
    *   Lombok を使用してボイラープレートコードを削減しています。
    *   パッケージ構造: `com.example.teamdev.*`
    *   ロギングには SLF4J を使用します。
*   **HTML/Thymeleaf**:
    *   Thymeleaf を使用したサーバーサイドレンダリングを採用しています。
    *   Bootstrap を利用してレスポンシブなUIを構築しています。
*   **CSS**:
    *   カスタム CSS 変数 (`:root`, `[data-theme="dark"]`) を使用して、ライトモードとダークモードの切り替えを実装しています。
    *   メディアクエリ (`@media`) を使用してレスポンシブデザインに対応しています。
*   **JavaScript**:
    *   jQuery を広範囲で使用し、DOM 操作とイベントハンドリングを行っています。
    *   機能ごとに JavaScript ファイルを分割しています (`home.js`, `employee_manage.js`, `darkmode.js` など)。
*   **命名規則**:
    *   Java の変数名、メソッド名はキャメルケース (camelCase)。
    *   データベースのテーブル名、カラム名はスネークケース (snake_case)。
    *   HTML の ID やクラス名は、機能や役割が分かりやすいように記述されています。

---

# ビルドとテスト

## ビルド

プロジェクトのビルドには Gradle を使用します。

```bash
./gradlew build
```

## アプリケーションの実行

ローカル環境でアプリケーションを実行するには、以下の手順に従います。

1.  **MySQL サーバーの起動**:
    MySQL 8.0 がインストールされ、起動していることを確認してください。
2.  **データベース設定**:
    `src/main/resources/application.properties` ファイル内の MySQL 接続情報 (`spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`) をご自身の環境に合わせて変更してください。
    また、`src/main/resources/schema.sql` と `src/main/resources/data.sql` を使用してデータベーススキーマと初期データをセットアップしてください。
3.  **アプリケーションの実行**:
    プロジェクトのルートディレクトリで以下のコマンドを実行します。
    ```bash
    ./gradlew bootRun
    ```
4.  **ブラウザでアクセス**:
    アプリケーションが起動したら、ブラウザで `http://localhost:8080` にアクセスしてください。

## テストの実行

ユニットテストは JUnit 5 を使用して記述されており、Gradle で実行できます。

```bash
./gradlew test
```

---

# 主要なファイルとディレクトリ

*   `src/main/java/com/example/teamdev/`: Java ソースコード (コントローラ、サービス、エンティティ、マッパー、例外、ユーティリティなど)。
*   `src/main/resources/application.properties`: Spring Boot の設定ファイル。データベース接続情報などが含まれます。
*   `src/main/resources/static/`: 静的リソース (CSS, JavaScript, 画像ファイル)。
*   `src/main/resources/templates/`: Thymeleaf テンプレートファイル。
*   `src/main/resources/com/example/teamdev/mapper/`: MyBatis の XML マッパーファイル。
*   `src/main/resources/data.sql`: データベースの初期データ。
*   `src/main/resources/schema.sql`: データベーススキーマ定義。
*   `src/test/java/`: テストコード。
*   `build.gradle`: Gradle ビルド設定ファイル。
*   `gradle/wrapper/`: Gradle Wrapper 関連ファイル。
*   `gradlew`, `gradlew.bat`: Gradle Wrapper スクリプト。
*   `README.md`: プロジェクトの概要、技術スタック、セットアップ方法などが記述された主要なドキュメント。

---

# その他の特記事項

*   **セッション管理**: `com.example.teamdev.util.SessionUtil` クラスでカスタムのセッションチェック処理が実装されています。
*   **エラーハンドリング**: `com.example.teamdev.controller.advice.GlobalExceptionHandler` でアプリケーション全体のエラーを一元的に処理します。
*   **日付フォーマット**: `com.example.teamdev.util.DateFormatUtil` を使用して、日付の表示形式を統一しています。
*   **ダークモード**: CSS 変数と `src/main/resources/static/js/darkmode.js` を利用して、ユーザーがテーマを切り替えられるように実装されています。
*   **データベース操作**: MyBatis を ORM (Object-Relational Mapping) ツールとして使用し、データベースとの連携を行っています。

---

# ソフトウェアエンジニアとしての振る舞い

このプロジェクトにおいて、私は以下の原則に基づきソフトウェアエンジニアとして振る舞います。

*   **品質へのコミットメント**:
    *   堅牢で保守性の高いコードを作成し、テスト容易性を常に意識します。
    *   パフォーマンスとリソース効率を考慮した実装を心がけます。
*   **既存のコードベースへの敬意**:
    *   プロジェクトの既存のコードスタイル、設計パターン、慣習を厳守します。
    *   変更を加える際は、周囲のコードとの整合性を保ち、違和感のない統合を目指します。
*   **安全性とセキュリティ**:
    *   潜在的なセキュリティ脆弱性を常に意識し、安全なコーディングプラクティスを適用します。
    *   機密情報や個人情報の取り扱いには最大限の注意を払います。
*   **効率性とパフォーマンス**:
    *   タスクを効率的に遂行し、不必要な複雑さやオーバーヘッドを排除します。
    *   リソース（CPU、メモリ、ディスクI/Oなど）の最適化に努めます。
*   **コミュニケーションと明確性**:
    *   変更の意図や理由を明確に伝えます。
    *   不明点や曖昧な点があれば、積極的に質問し、誤解を避けます。
*   **自己検証とテスト**:
    *   コード変更後は、必ず動作確認を行い、関連するテストを実行して品質を保証します。
    *   必要に応じて、新しいテストケースを追加し、回帰を防ぎます。
*   **学習と適応**:
    *   新しい情報やフィードバックに対してオープンであり、継続的に学習し、自身の振る舞いを改善します。
    *   予期せぬ問題が発生した場合は、迅速に原因を特定し、適切な対応を講じます。