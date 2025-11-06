# Requirements Document

## Introduction
本仕様はホームダッシュボードおよび勤怠履歴に休憩開始・休憩終了・残業情報と当日勤務ステータスバッジを追加し、従業員が自分の勤務状況をリアルタイムかつ履歴ベースで把握できるようにすることを目的とする。

## Requirements

### Requirement 1: ホーム休憩時刻表示
**Objective:** As a 従業員, I want ホームで当日の休憩開始・終了時刻を把握したい, so that 休憩状況を即時に確認できる。

#### Acceptance Criteria
1. WHEN 当日の休憩開始時刻が勤怠データに存在する THEN Home Dashboard SHALL 休憩開始欄に24時間形式（HH:mm）で時刻を表示する。
2. IF 当日の休憩開始時刻が存在しない THEN Home Dashboard SHALL 休憩開始欄を「未登録」バッジで表示する。
3. WHEN 当日の休憩終了時刻が勤怠データに存在する THEN Home Dashboard SHALL 休憩終了欄に24時間形式（HH:mm）で時刻を表示する。
4. IF 当日の休憩終了時刻が存在しない AND 休憩開始時刻が存在する THEN Home Dashboard SHALL 休憩終了欄を「入力待ち」バッジで表示する。

### Requirement 2: 当日勤務ステータスバッジ
**Objective:** As a 従業員, I want ホームで当日の勤務ステータスを視覚的に知りたい, so that 次の行動（休憩開始・再開・退勤）を判断できる。

#### Acceptance Criteria
1. WHEN 当日の出勤打刻が存在しない THEN Home Dashboard SHALL バッジを「未出勤」と表示する。
2. WHEN 当日の出勤打刻が存在し AND 休憩開始打刻が存在しない AND 退勤打刻が存在しない THEN Home Dashboard SHALL バッジを「勤務中」と表示する。
3. WHEN 当日の休憩開始打刻が存在し AND 休憩終了打刻が存在しない THEN Home Dashboard SHALL バッジを「休憩中」と表示する。
4. WHEN 当日の退勤打刻が存在する THEN Home Dashboard SHALL バッジを「勤務終了」と表示する。

### Requirement 3: 勤怠履歴休憩・残業表示
**Objective:** As a 従業員, I want 過去の休憩と残業の記録を勤怠履歴で確認したい, so that 申請や自己管理に必要な証跡を得られる。

#### Acceptance Criteria
1. WHEN 勤怠履歴エントリを表示する THEN Attendance History View SHALL 各行に休憩開始時刻と休憩終了時刻を表示する。
2. IF 勤怠履歴エントリに休憩開始または休憩終了が未記録 THEN Attendance History View SHALL 対応セルを「未登録」と表示する。
3. WHEN 勤怠履歴エントリの残業時間が計算される THEN Attendance History View SHALL 残業時間を時間または時間:分形式で表示する。
4. IF 残業時間が0以下 THEN Attendance History View SHALL 残業列に0時間として表示する。

## 実装方針プラン
- **データモデル拡張**: `stamp_history` に休憩開始・休憩終了・残業時間（日次）の保持カラムを追加し、既存の月次集計ロジック（StampHistoryMapper.findMonthlyStatistics）と整合するよう変換ロジックを設計する。過去データは `NULL` 前提でUI側に「未登録」表示を行う。
- **ホームAPI拡張**: `/api/home/overview` を拡張して当日の勤怠サマリ（出勤/退勤/休憩状態、残業見込み）を返却する新DTOを追加し、`HomeRepository` と `HomePageRefactored` に新しいセクション（休憩時刻表示・勤務ステータスバッジ）を実装する。
- **勤怠履歴表示強化**: `/api/stamp-history` レスポンスに休憩開始/終了・残業時間フィールドを追加し、`StampHistoryPage` のテーブル列とバリデーションを拡張、既存の月次サマリ計算も休憩控除とバックエンド計算結果に合わせて補正する。
- **共通ロジック再利用**: Profile統計で使用している残業算出と休憩控除の処理をユーティリティ化し、ホーム・履歴双方で一貫した計算ロジックを適用する。必要に応じてReact Queryキャッシュキーの拡張や無効化範囲を見直す。
- **移行とテスト**: Flyway/SQLマイグレーションでカラム追加→既存データ初期化、OpenAPIスキーマ更新、フロント/バック双方の型生成を同期する。統合テスト（StampHistoryMapper、HomeRestController）とE2Eテストを追加し、休憩・ステータス表示の回帰を防止する。
