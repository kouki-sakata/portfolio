# ポートフォリオサイト (My Portfolio)

> ⚠️ **現在、このプロジェクトは開発中です。** 機能の追加やコードのリファクタリングを継続的に行っています。

![ポートフォリオサイトのスクリーンショットをここに挿入](ここに画像のURLやパスを記載)

## 概要 ✨

これは、私自身の技術スキルや制作物を紹介するために作成したポートフォリオサイトです。
設計から実装、デプロイまでを一貫して行い、Webアプリケーション開発における実践的なスキルを証明することを目的としています。**本プロジェクトは現在も開発を続けており、今後さらに機能を追加していく予定です。**

## デモ 🚀

実際に動作するサイトはこちらからご覧いただけます。

**URL:** `[ここにデプロイ先のURLを記載してください。例: https://kouki-sakata-portfolio.com]`

# TeamDev 勤怠管理システム

Spring Bootを使用して構築された企業向け勤怠管理Webアプリケーションです。従業員の出退勤打刻、従業員情報管理、お知らせ機能などを提供します。

## 🌟 主な機能

### ホーム画面機能
- **出退勤打刻**: 出勤・退勤時刻の記録
- **夜勤対応**: 夜勤者向けの特別打刻機能
- **お知らせ表示**: 重要な情報の表示（公開フラグによる制御）

### 従業員管理機能
- **従業員情報登録・更新**: 従業員の基本情報管理
- **管理者権限設定**: 管理者フラグによる権限制御
- **一括削除**: 複数従業員の同時削除
- **メールアドレス重複チェック**: データ整合性の確保

### データ管理機能
- **操作履歴記録**: 全操作の履歴追跡
- **日付フォーマット統一**: yyyy-MM-dd ⇄ yyyy/MM/dd の自動変換

## 技術スタック 🛠️

このプロジェクトで使用した主な技術です。

*   **バックエンド**:
    *   ![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)
    *   ![Spring](https://img.shields.io/badge/Spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
*   **フロントエンド**:
    *   ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
    *   ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
    *   ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
    *   ![jquery](https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white)
    *   ![Thymeleaf](https://img.shields.io/badge/Thymeleaf-005F0F?style=for-the-badge&logo=Thymeleaf&logoColor=white)
*   **データベース**:
    *   ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
*   **ビルドツール**:
    *   ![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
*   **インフラ・デプロイ環境**:
    *   `[デプロイ先、例: AWS (EC2, S3), Heroku, Render]`
*   **その他**:
    *   ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
    *   ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

## 工夫した点・アピールポイント 💡

*   **[例: データベース設計]**:
    *   `[具体的な内容を記述。例: 制作物と使用技術を多対多の関係で設計し、柔軟なデータ管理を可能にしました。]`
*   **[例: セキュリティ対策]**:
    *   `[具体的な内容を記述。例: Spring Securityを導入し、認証・認可機能を実装。お問い合わせフォームにはCSRF対策と入力値のバリデーションを施しました。]`
*   **[例: UI/UXへの配慮]**:
    *   `[具体的な内容を記述。例: レスポンシブデザインに対応し、PCでもスマートフォンでも快適に閲覧できるようレイアウトを調整しました。]`

## セットアップと実行方法 🏁

ローカル環境でこのプロジェクトを動かす手順です。

1.  **リポジトリをクローンします。**
    ```bash
    git clone https://github.com/kouki-sakata/portfolio.git
    cd portfolio
    ```

2.  **[もしあれば] データベースの接続情報を設定します。**
    `[もし設定が必要な場合は、その方法を記述します。例: MySQLサーバーを起動
     src/main/resources/application.properties にあるMySQLの接続情報を、ご自身の環境に合わせて変更してください。]`

3.  **アプリケーションをビルド・実行します。**
    ```bash
    ./gradlew bootRun
    ```

4.  ブラウザで `http://localhost:8080` にアクセスしてください。

## 💡 主要な実装ポイント

### 日付処理の統一化
- `DateFormatUtil`クラスによる日付フォーマットの統一
- ハイフン形式とスラッシュ形式の相互変換対応

### 夜勤対応の打刻システム
- 夜勤フラグによる日付調整機能
- 日をまたぐ勤務時間の適切な管理

### データ整合性の確保
- メールアドレス重複チェック
- トランザクション管理による整合性保証

### 操作履歴の追跡
- `LogHistoryService01`による全操作の履歴記録
- 監査証跡の確保

## 🎯 今後の拡張予定

- [ ] ユーザー認証・認可機能の追加
- [ ] REST API化
- [ ] フロントエンド技術の導入（React/Vue.js）
- [ ] 単体テストの充実
- [ ] CI/CDパイプラインの構築
