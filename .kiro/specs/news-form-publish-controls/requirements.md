# Requirements Document

## Introduction
本仕様は管理者が利用するお知らせ管理の新規作成・編集フォームに公開状態トグル、タイトル入力欄、ラベル選択欄を追加し、関連ビューに一貫した表示と検証を提供することを目的とする。

## Requirements

### Requirement 1: フォーム構成の拡充
**Objective:** As a 管理者, I want 新規および既存お知らせのフォームで公開状態・タイトル・ラベルを編集したい, so that 一度の操作で必要な属性を整備できる

#### Acceptance Criteria
1. WHEN 管理者が新規お知らせ作成フォームを開いたとき THEN News管理フォーム SHALL 公開状態トグル・タイトル入力欄・ラベル選択欄を初期表示する。
2. WHEN 管理者が既存お知らせの編集フォームを開いたとき THEN News管理フォーム SHALL 対象お知らせの公開状態・タイトル・ラベルを各入力欄に自動反映する。

### Requirement 2: ラベル体系と表示一貫性
**Objective:** As a 管理者, I want 定義済みラベルを選択してお知らせを分類したい, so that 一覧や公開ビューで統一されたカテゴリ表示を保てる

#### Acceptance Criteria
1. WHEN 管理者がラベル選択欄を展開したとき THEN News管理フォーム SHALL ラベル候補として「重要」「システム」「一般」を提示する。
2. IF 管理者が定義外のラベル値で保存しようとしたとき THEN News管理フォーム SHALL 保存処理を拒否し、許可されたラベルの選択を促す。
3. WHEN お知らせが保存されたとき THEN News管理一覧ビュー SHALL 指定されたラベルを各行のバッジ表示に反映する。

### Requirement 3: 入力検証と既定値
**Objective:** As a 管理者, I want 入力項目が品質基準を満たすことを確認したい, so that 不完全な情報が登録されない

#### Acceptance Criteria
1. WHEN 管理者がタイトルを空欄のまま保存操作を実行したとき THEN News管理フォーム SHALL エラーを表示し保存を阻止する。
2. WHEN 管理者がタイトルに101文字以上のテキストを入力して保存しようとしたとき THEN News管理フォーム SHALL 文字数制限のエラーを表示し保存を阻止する。
3. IF 管理者がラベルを選択せずに保存しようとしたとき THEN News管理フォーム SHALL 既定ラベル「一般」を自動適用して保存処理に進む。
4. WHEN 管理者が公開トグルを操作した直後 THEN News管理フォーム SHALL 現在の公開状態をフォーム内のステータス表示に即時反映する。

### Requirement 4: 公開状態の保存と応答
**Objective:** As a 管理者, I want 公開可否をフォームから切り替えたい, so that 公開中リストが最新状態を反映できる

#### Acceptance Criteria
1. WHEN 管理者が公開トグルを有効化して保存したとき THEN News管理サービス SHALL 対象お知らせを公開状態で保存し公開中リストに含める。
2. WHEN 管理者が公開トグルを無効化して保存したとき THEN News管理サービス SHALL 対象お知らせを非公開状態で保存し公開中リストから除外する。
3. WHERE 公開状態が保存後に変化したとき THE News管理サービス SHALL 更新後の公開状態・タイトル・ラベルをレスポンスに含める。

