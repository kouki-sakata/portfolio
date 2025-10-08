# 実装計画

## ベースライン測定

- [ ] 1. パフォーマンスベースラインの測定とメトリクス記録
  - Spring Boot Actuatorを使用してAPI応答時間（p95, p99）を測定
  - Vite build analysisでフロントエンドバンドルサイズを測定
  - MyBatis SQLログでデータベースクエリ実行時間を測定
  - 測定結果を`baseline-metrics.json`に記録し、spec.jsonに参照を追加
  - _Requirements: 5.3, 5.6, 非機能要件_

## StampServiceリファクタリング

- [ ] 2. StampServiceの複雑度削減とユーティリティクラス作成
  - `StampDateCalculator.java`を作成（日付計算ロジックを抽出）
  - `calculateTargetDate()`メソッドで打刻時刻と夜勤フラグから対象日を計算
  - `splitDateParts()`メソッドでTimestampを年月日配列に分割
  - `StampDateResult`値オブジェクトを作成してデータを保持
  - JavaDocコメントで計算ロジックの意図を文書化
  - _Requirements: 2.1, 2.2, 7.1_

- [ ] 2.1 夜勤判定ロジックの分離
  - `NightWorkDetector.java`を作成（夜勤判定ロジックを抽出）
  - `isNightWorkStamp()`メソッドで打刻種別と夜勤フラグから判定
  - 深夜勤務のエッジケース（23:00-02:00）を考慮した実装
  - JavaDocコメントで判定基準を明示
  - _Requirements: 2.2, 7.1_

- [ ] 2.2 StampService.execute()のリファクタリング
  - `StampService.java`のexecute()メソッドを修正
  - StampDateCalculatorとNightWorkDetectorを依存性注入で導入
  - execute()メソッドを`buildStampHistory()`と日付計算処理に分割
  - 認知的複雑度を10以下に削減（現状80+行→40行以下）
  - 既存のテストが引き続き成功することを確認
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 2.3 リファクタリング後のドキュメント追加
  - StampServiceの公開メソッドにJavaDocコメントを追加
  - パラメータ、戻り値、例外について文書化
  - 打刻処理のビジネスロジックをインラインコメントで説明
  - _Requirements: 7.1, 7.2, 7.3_

## 型安全性の強化

- [ ] 3. TypeScriptのany型排除と型ガード実装
  - Serena MCPの`search_for_pattern`で`: any`パターンを検索
  - 自動生成ファイル（`schemas/api.ts`, `types/**`）を除外
  - 検出された7箇所のany型を具体的型定義またはジェネリック型に置き換え
  - API型定義をOpenAPI仕様から自動生成された型に統一
  - _Requirements: 3.1, 3.3_

- [ ] 3.1 型ガード関数の実装
  - `isApiError()`型述語関数を実装してunknown型を安全に絞り込み
  - フォームバリデーション用のZodスキーマを作成
  - 外部ライブラリの不完全な型定義をカスタム型定義ファイル（.d.ts）で補完
  - 型キャストが必要な箇所を型述語関数に置き換え
  - _Requirements: 3.2, 3.4, 3.6_

## テストカバレッジの向上

- [ ] 4. ユーティリティクラスのユニットテスト作成
  - `StampDateCalculatorTest.java`を作成
  - 深夜勤務（23:00-翌2:00）のエッジケーステスト
  - 日跨ぎ（23:59, 00:00, 00:01）のboundaryケーステスト
  - うるう年（2月29日）のテストケース
  - `NightWorkDetectorTest.java`を作成して夜勤判定のテストケース実装
  - カバレッジ100%を達成
  - _Requirements: 4.1, 4.2_

- [ ] 4.1 StampServiceの統合テスト強化
  - `StampServiceIntegrationTest.java`を作成（Testcontainers使用）
  - リファクタリング後の既存テストが全て成功することを検証
  - トランザクション境界の検証テストを追加
  - データ整合性確認テストを追加
  - エラーハンドリングのテストケース（ValidationException、BusinessException）を追加
  - カバレッジ90%以上を達成
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [ ] 4.2 クリティカルパスのE2Eテスト追加
  - Playwrightで通常勤務の出勤・退勤フロー（Happy Path）をテスト
  - 深夜勤務の打刻フローをテスト（エッジケース1）
  - 日跨ぎ打刻の履歴表示をテスト（エッジケース2）
  - E2Eテストの実行時間を15分以内に収める
  - _Requirements: 4.4_

## Serena MCP解析スクリプト開発

- [ ] 5. 認知的複雑度チェックスクリプトの実装
  - `scripts/serena/analyze-complexity.ts`を作成
  - Serena MCPの`find_symbol`でJavaメソッドシンボルを取得（include_kinds: [6]）
  - 正規表現でif/else/switch/for/while/catch/&&/||をカウントして複雑度計算
  - 閾値15を超えるメソッドを`ComplexityResult[]`として出力
  - ユニットテストで複雑度計算ロジックを検証
  - _Requirements: 1.1, 1.2, 2.1_

- [ ] 5.1 型安全性チェックスクリプトの実装
  - `scripts/serena/analyze-types.ts`を作成
  - Serena MCPの`search_for_pattern`で`: any`および`: unknown`パターンを検索
  - 自動生成ファイル（`schemas/api.ts`, `types/**`）を除外パターンに追加
  - 型ガード使用の有無を検証（`isXXX`型述語関数の存在確認）
  - `TypeSafetyViolation[]`を出力（ファイルパス、行番号、違反タイプ）
  - ユニットテストで型検出ロジックを検証
  - _Requirements: 1.3, 3.1_

- [ ] 5.2 コード重複検出スクリプトの実装
  - `scripts/serena/analyze-duplicates.ts`を作成
  - Serena MCPの`search_for_pattern`で10行以上のコードブロックを検索
  - Levenshtein距離アルゴリズムでコードブロックの類似度を計算
  - 3箇所以上で出現するパターンを`DuplicationResult[]`として出力
  - ユニットテストで重複検出ロジックを検証
  - _Requirements: 1.6, 6.1, 6.2_

## CI/CD統合

- [ ] 6. GitHub Actions品質チェックワークフローの作成
  - `.github/workflows/quality-check.yml`を作成
  - Pull Request作成/更新時にトリガー
  - `analyze-complexity.ts`, `analyze-types.ts`, `analyze-duplicates.ts`を順次実行
  - 複雑度>15、any型検出、重複>3箇所の場合はワークフロー失敗
  - 解析結果をJSON形式のアーティファクトとして保存
  - _Requirements: 1.2, 非機能要件（Biome警告0件）_

- [ ] 6.1 PRコメント自動投稿機能の実装
  - `scripts/ci/post-pr-comment.ts`を作成
  - GitHub Actions `@actions/github`パッケージを使用
  - 解析結果JSONを読み込んでマークダウン形式にフォーマット
  - GitHub APIでPRにコメント投稿
  - 違反が0件の場合は成功メッセージを投稿
  - _Requirements: 1.2_

## 検証とドキュメント

- [ ] 7. 最終検証と非機能要件の達成確認
  - 全テストスイート実行（単体、統合、E2E）
  - パフォーマンスメトリクス測定（Task 1のベースラインと比較）
  - API応答時間が現状比10%改善されていることを確認
  - バンドルサイズが現状比15%削減されていることを確認
  - データベースクエリ時間が現状比30%改善されていることを確認
  - テストカバレッジ85%以上を達成していることを確認
  - 認知的複雑度15超のメソッド0件を確認
  - any型使用0件（自動生成ファイル除く）を確認
  - Biome警告0件を確認
  - Exit Criteriaを全て満たしていることを検証
  - _Requirements: All requirements need final validation_
