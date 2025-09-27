# Requirements Document - 武道ONE 勤怠管理システム

## Introduction

武道ONE勤怠管理システムは、武道団体向けに特化したマルチテナント型勤怠・工数管理SaaSプラットフォームです。各組織が独自のサブドメインを通じて独立した環境で安全にデータを管理し、Web打刻による勤怠記録、リアルタイムの勤怠追跡、月次集計、レポート生成などの包括的な勤怠管理機能を提供します。

本システムの主要な価値提案は、Row Level Security (RLS)による完全なテナント分離、直感的なWeb UIによる簡単な打刻操作、自動化された勤怠計算、そして将来的なGPS連動打刻と工数管理機能への拡張性です。

## Requirements

### Requirement 1: マルチテナント管理とアクセス制御

**User Story:** As a 組織管理者, I want 独自のサブドメインでアクセスできる独立した環境, so that 他組織とデータが完全に分離された安全な勤怠管理ができる

#### Acceptance Criteria

1. WHEN ユーザーが組織固有のサブドメインURL（例：`https://[組織名].budo-one.jp`）にアクセスする THEN システム SHALL そのテナントの環境のみを表示する
2. IF ユーザーが異なるテナントのURLにアクセスしようとする THEN システム SHALL アクセスを拒否してエラーページを表示する
3. WHERE データベースクエリが実行される THE システム SHALL Row Level Securityポリシーを適用してテナント間のデータ分離を保証する
4. WHEN 新規組織が登録される THEN システム SHALL 自動的に独自のサブドメインを割り当ててテナント環境を初期化する
5. WHILE ユーザーがシステムを使用している THE システム SHALL 現在のテナントコンテキストを維持してすべての操作をそのテナントに限定する

### Requirement 2: ユーザー認証とセッション管理

**User Story:** As a システムユーザー, I want 安全な認証メカニズム, so that 承認されたユーザーのみがシステムにアクセスできる

#### Acceptance Criteria

1. WHEN ユーザーが正しいメールアドレスとパスワードでログインする THEN システム SHALL 認証してセッションを作成する
2. IF ユーザーが間違った認証情報を入力する THEN システム SHALL アクセスを拒否して適切なエラーメッセージを表示する
3. WHEN ユーザーがパスワードリセットを要求する THEN システム SHALL 登録メールアドレスにリセットリンクを送信する
4. WHERE セッションタイムアウト期間が経過する THE システム SHALL 自動的にユーザーをログアウトする
5. WHEN ユーザーがログアウトする THEN システム SHALL セッションを終了してすべての認証トークンを無効化する
6. IF ユーザーが連続して5回ログインに失敗する THEN システム SHALL そのアカウントを15分間ロックする

### Requirement 3: ユーザー管理と権限制御

**User Story:** As a 管理者, I want ユーザーの登録・編集・削除機能, so that 組織内のスタッフの勤怠管理ができる

#### Acceptance Criteria

1. WHEN 管理者が新規ユーザーを作成する THEN システム SHALL ユーザー情報（氏名、メール、雇用形態、部署、権限レベル）を保存する
2. IF ユーザーが管理者権限を持つ THEN システム SHALL すべてのユーザー管理機能へのアクセスを許可する
3. IF ユーザーが一般権限を持つ THEN システム SHALL 自分の情報の閲覧のみを許可する
4. WHEN 管理者がユーザー情報を更新する THEN システム SHALL 変更履歴を記録する
5. WHERE ユーザーが退職する THE システム SHALL ユーザーを無効化して過去のデータは保持する
6. WHEN 管理者が雇用形態（正社員/契約社員/アルバイト）を設定する THEN システム SHALL その形態に応じた勤怠ルールを適用する

### Requirement 4: Web打刻機能

**User Story:** As a 従業員, I want Webブラウザから簡単に打刻できる機能, so that 出退勤と休憩時間を正確に記録できる

#### Acceptance Criteria

1. WHEN ユーザーが出勤ボタンをクリックする THEN システム SHALL 現在時刻を秒単位で記録して出勤状態にする
2. WHEN ユーザーが退勤ボタンをクリックする THEN システム SHALL 現在時刻を記録して勤務時間を計算する
3. IF ユーザーが既に出勤している状態で出勤ボタンをクリックする THEN システム SHALL エラーメッセージを表示して打刻を拒否する
4. WHEN ユーザーが休憩開始ボタンをクリックする THEN システム SHALL 休憩開始時刻を記録する
5. WHEN ユーザーが休憩終了ボタンをクリックする THEN システム SHALL 休憩時間を計算して実働時間から控除する
6. WHERE ユーザーがモバイルデバイスからアクセスする THE システム SHALL レスポンシブUIで打刻機能を提供する
7. WHILE 打刻処理が実行中 THE システム SHALL リアルタイムでサーバーと同期して記録の整合性を保証する

### Requirement 5: 打刻修正機能

**User Story:** As a 管理者, I want 打刻記録を修正できる機能, so that 打刻忘れや誤った打刻を訂正できる

#### Acceptance Criteria

1. WHEN 管理者が打刻記録を修正する THEN システム SHALL 元の記録を保持して修正履歴を作成する
2. IF 打刻修正が行われる THEN システム SHALL 修正理由の入力を必須とする
3. WHERE 修正された打刻記録が表示される THE システム SHALL 修正済みであることを明示的に表示する
4. WHEN 管理者が修正履歴を確認する THEN システム SHALL 修正日時、修正者、修正前後の値、修正理由を表示する
5. IF 一般ユーザーが自分の打刻修正を申請する THEN システム SHALL 管理者に承認依頼を送信する

### Requirement 6: 勤怠自動計算

**User Story:** As a 管理者, I want 勤怠時間の自動計算機能, so that 正確な労働時間管理ができる

#### Acceptance Criteria

1. WHEN 日次の勤怠が確定する THEN システム SHALL 実働時間（総勤務時間 - 休憩時間）を自動計算する
2. IF 勤務時間が8時間を超える THEN システム SHALL 超過分を残業時間として計算する
3. WHERE 22時から5時の間に勤務する THE システム SHALL その時間を深夜勤務時間として計算する
4. WHEN 休日に勤務する THEN システム SHALL 休日勤務時間として別途計算する
5. WHILE 月次集計を実行する THE システム SHALL すべての日次データを集計して月間勤務時間を算出する
6. IF 計算エラーが発生する THEN システム SHALL エラーログを記録して管理者に通知する

### Requirement 7: 月次集計とレポート

**User Story:** As a 管理者, I want 月次勤怠集計とレポート機能, so that 給与計算や労務管理に必要なデータを取得できる

#### Acceptance Criteria

1. WHEN 管理者が月次集計を実行する THEN システム SHALL 個人別・部署別の勤怠サマリーを生成する
2. WHERE 月次レポートが生成される THE システム SHALL 総勤務時間、残業時間、深夜勤務時間、休日勤務時間を含める
3. WHEN 管理者がCSVエクスポートを実行する THEN システム SHALL 給与システム連携用フォーマットでデータを出力する
4. IF エクスポート対象が1000件を超える THEN システム SHALL 10秒以内に処理を完了する
5. WHEN カスタムフィールドが定義されている THEN システム SHALL それらのフィールドもエクスポートに含める
6. WHERE データがエクスポートされる THE システム SHALL 文字コードをShift-JISまたはUTF-8から選択可能にする

### Requirement 8: GPS連動打刻（Phase 2）

**User Story:** As a 管理者, I want GPS位置情報による打刻管理, so that リモートワークや外出先での勤怠を適切に管理できる

#### Acceptance Criteria

1. WHEN ユーザーがGPS打刻を有効にする THEN システム SHALL 位置情報の取得許可を要求する
2. IF ユーザーが打刻する際にGPS機能が有効 THEN システム SHALL 緯度・経度・精度情報を記録する
3. WHERE 許可された範囲（緯度・経度・半径）が設定されている THE システム SHALL 打刻位置がその範囲内かを判定する
4. WHEN 範囲外からの打刻が検出される THEN システム SHALL 管理者に通知して承認フローを開始する
5. IF 位置情報の精度が50メートル以上 THEN システム SHALL 警告を表示して精度改善を促す
6. WHILE GPS打刻が処理される THE システム SHALL プライバシー保護のため最小限の位置情報のみを保存する

### Requirement 9: 工数管理（Phase 2）

**User Story:** As a プロジェクトマネージャー, I want プロジェクト別の工数管理機能, so that 作業時間の配分と原価管理ができる

#### Acceptance Criteria

1. WHEN ユーザーが作業時間を入力する THEN システム SHALL プロジェクト別・タスク別に時間を記録する
2. IF 日次の総工数が実働時間を超える THEN システム SHALL エラーを表示して修正を要求する
3. WHERE プロジェクト別レポートが生成される THE システム SHALL 工数集計、コスト計算、進捗率を表示する
4. WHEN 承認者が工数を承認する THEN システム SHALL 承認済みステータスに更新して変更をロックする
5. WHILE 月次工数集計を実行する THE システム SHALL プロジェクト別・タスク別・担当者別の分析レポートを生成する

### Requirement 10: システムパフォーマンスと可用性

**User Story:** As a システム利用者, I want 高速で安定したシステム, so that 業務に支障なく勤怠管理ができる

#### Acceptance Criteria

1. WHEN ユーザーが画面遷移する THEN システム SHALL 2秒以内にページを表示する
2. WHERE APIリクエストが送信される THE システム SHALL 1秒以内にレスポンスを返す
3. IF 同時接続数が100（Phase 1）または500（Phase 2）に達する THEN システム SHALL パフォーマンス劣化なく処理を継続する
4. WHEN システム障害が発生する THEN システム SHALL 自動的にフェイルオーバーして15分以内に復旧する
5. WHILE システムが稼働している THE システム SHALL 99.9%以上の可用性を維持する（Phase 2）
6. WHERE データバックアップが実行される THE システム SHALL 日次で自動バックアップして30日間保持する
