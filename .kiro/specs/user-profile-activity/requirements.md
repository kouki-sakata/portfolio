# Requirements Document

## Introduction
本仕様は勤怠管理システムにおいて従業員プロフィールの基本属性（氏名・住所・社員番号・部署）と活動履歴を統合的に把握・更新できるようにする機能拡張を対象とする。既存のReact + Spring Boot構成およびロールベースアクセス制御に整合させ、入力概要: 以下の機能を追加する プロフィール、 アクティビティ

## Requirements

### Requirement 1: プロフィール基本表示
**Objective:** As an 従業員, I want 自分の基礎情報を一目で確認したい, so that 業務に必要な自己情報の齟齬を即座に把握できる

#### Acceptance Criteria
1. WHEN 従業員がプロフィール画面を開いたとき THEN User Profile UI SHALL 氏名・住所・社員番号・部署・最終更新日時を表示する
2. IF プロフィール項目が未設定または取得不能である場合 THEN User Profile UI SHALL 未設定である旨と更新手段を明示する
3. WHILE プロフィールデータの取得が完了していない間 THE User Profile UI SHALL スケルトン表示を継続し重複リクエストを抑止する

### Requirement 2: 自己更新フロー
**Objective:** As an 従業員, I want 自身のプロフィールを安全に更新したい, so that 最新情報を反映し業務連絡の漏れを防げる

#### Acceptance Criteria
1. IF 入力値が許容文字数・フォーマット・禁止文字規則に違反した場合 THEN User Profile Service SHALL フィールドごとの検証エラーを返却する
2. WHEN プロフィール更新が成功したとき THEN User Profile UI SHALL 成功トーストと更新後の値を即時表示する
3. WHERE 更新処理が進行中である間 THE User Profile UI SHALL 送信ボタンを無効化し重複送信を防止する
4. WHEN プロフィール更新が成功したとき THEN User Profile Service SHALL employeeテーブルの`profile_metadata` JSONカラムに永続化し直後の再取得で同一内容を返却する

### Requirement 3: アクティビティ可視化
**Objective:** As an 従業員, I want 自分の活動履歴を追跡したい, so that プロフィール変更や関連操作の経緯を把握できる

#### Acceptance Criteria
1. WHEN 従業員が活動履歴セクションを開いたとき THEN User Activity Service SHALL 発生日時・実行者・操作種別を時系列降順で提供する
2. WHEN 活動レコード数が設定された閾値を超える場合 THEN User Profile UI SHALL ページネーションを付与する
3. 各テーブルカラムにソート機能を付与する

#### Acceptance Criteria
1. WHEN プロフィールまたは活動レコードが更新されたとき THEN Audit Logging Service SHALL 操作種別・対象ID・更新者ID・タイムスタンプを保存する

## 改善案・追加調査メモ
- **プロフィール閲覧API構成**: 詳細取得API（`/api/profile/{id}`）を作成する
- **UIルーティング設計**: Reactルーターに未実装の`/profile`経路を追加し、社員管理UIとは別の`features/profile`モジュールを新設するか、既存従業員モジュールを拡張するか判断する。shadcn/uiコンポーネントの再利用計画も明確化する。
- **活動履歴データソース**: `log_history`テーブルのoperation code拡張や差分情報格納方式、期間フィルタ最適化（LogHistoryMapper/QueryService）の影響範囲を調査し、プロフィール専用ビューで必要なメタ情報（操作詳細、対象項目など）を定義する。
- **プロフィールメタデータの永続化**: `employee.profile_metadata` JSONカラムを追加し、住所・部署・社員番号・活動メモなど自由入力項目を一元管理する。OpenAPI/DTO 整合とマイグレーション手順を要件化する。
