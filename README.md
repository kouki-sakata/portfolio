TeamDev 勤怠管理システム

⚠️ 現在、このプロジェクトは開発中です。 機能の追加やコードのリファクタリングを継続的に行っています。
💡 これは職業訓練校のチーム開発で制作したプロジェクトです。

![alt text](ここに画像のURLやパスを記載)

概要 ✨

これは、職業訓練校のチーム開発で制作した、企業向けの勤怠管理Webアプリケーションです。チームメンバーと協力し、要件定義から設計、実装、テストまでの一連の開発プロセスを経験しました。

本プロジェクトを通じて、チームでの協調性やGitを用いた共同開発手法、そしてSpring Bootによる実践的なWebアプリケーション開発スキルを習得することを目的としています。

チームと役割分担 👥

本プロジェクトは、以下のメンバーで開発を行いました。（※氏名はサンプルです）

[山田 太郎]: プロジェクトリーダー、バックエンド開発（従業員管理機能）、DB設計

[鈴木 花子]: フロントエンド開発（HTML/CSS）、UI/UXデザイン

[佐藤 次郎]: バックエンド開発（お知らせ機能）、テスト設計・実施

[あなたの名前]: [あなたの役割や担当機能を記述。例: バックエンド開発（出退勤打刻機能、夜勤対応ロジック）]

🌟 主な機能
ホーム画面機能

出退勤打刻: 出勤・退勤時刻の記録

夜勤対応: 夜勤者向けの特別打刻機能

お知らせ表示: 重要な情報の表示（公開フラグによる制御）

従業員管理機能

従業員情報登録・更新: 従業員の基本情報管理

管理者権限設定: 管理者フラグによる権限制御

一括削除: 複数従業員の同時削除

メールアドレス重複チェック: データ整合性の確保

データ管理機能

操作履歴記録: 全操作の履歴追跡

日付フォーマット統一: yyyy-MM-dd ⇄ yyyy/MM/dd の自動変換

技術スタック 🛠️

このプロジェクトでチームとして選定・使用した主な技術です。

バックエンド:

![alt text](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)

![alt text](https://img.shields.io/badge/Spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white)

フロントエンド:

![alt text](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

![alt text](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

![alt text](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

![alt text](https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white)

![alt text](https://img.shields.io/badge/Thymeleaf-005F0F?style=for-the-badge&logo=Thymeleaf&logoColor=white)

データベース:

![alt text](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

ビルドツール:

![alt text](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)

開発・連携ツール:

![alt text](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

![alt text](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

[その他、Slack, Trello, Backlogなど使用したツールがあれば記載]

工夫した点・アピールポイント 💡
チーム開発のプロセス

コーディング規約の策定:
チーム内で変数名やインデントなどのコーディング規約を定め、コードの可読性と保守性を高める努力をしました。

技術的な挑戦

共通処理のモジュール化:
日付フォーマットの変換など、複数の箇所で利用される処理をDateFormatUtilのようなユーティリティクラスに切り出しました。これにより、コードの重複をなくし、保守性を向上させました。

堅牢なデータ管理:
データベースのトランザクション管理を徹底し、従業員情報の一括削除や更新時におけるデータ不整合が発生しないよう設計しました。特にメールアドレスの重複チェックは、リアルタイムでの入力検証を実装しました。

セットアップと実行方法 🏁

ローカル環境でこのプロジェクトを動かす手順です。

前提条件:

Java [バージョン]

MySQL [バージョン]

Gradle [バージョン]

リポジトリをクローンします。

git clone [リポジトリのURL]
cd [リポジトリのディレクトリ名]


データベースをセットアップします。

MySQLサーバーを起動します。

src/main/resources/application.properties にあるMySQLの接続情報（URL, ユーザー名, パスワード）を、ご自身の環境に合わせて変更してください。

アプリケーションをビルド・実行します。

./gradlew bootRun
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

ブラウザで http://localhost:8080 にアクセスしてください。

💡 主要な実装ポイント
日付処理の統一化

DateFormatUtilクラスによる日付フォーマットの統一

ハイフン形式とスラッシュ形式の相互変換対応

夜勤対応の打刻システム

夜勤フラグによる日付調整機能

日をまたぐ勤務時間の適切な管理

データ整合性の確保

メールアドレス重複チェック

トランザクション管理による整合性保証

操作履歴の追跡

LogHistoryService01による全操作の履歴記録

監査証跡の確保

🎯 今後の拡張予定

チームとして議論した、今後実装したい機能です。

ユーザー認証・認可機能の追加 (Spring Security)

REST API化

フロントエンド技術の導入（React/Vue.jsへの置き換え）

単体テストの充実 (JUnit)

CI/CDパイプラインの構築 (GitHub Actions)
