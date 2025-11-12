# パフォーマンス最適化対応計画

## 背景
Issue で示された N+1 クエリ解消、DB インデックス追加、`stamp_history` の DATE 化、`NewsMapper` の `SELECT *` 排除を実現するための実行計画を整理する。作業は Flyway マイグレーションとアプリケーション変更が密接に依存するため、順序と検証手順を明確化する。

## タスク一覧

### 1. V4 マイグレーション（インデックス追加）
- [x] `src/main/resources/db/migration/V4__add_performance_indexes.sql` を作成し、要求された 13 個のインデックスを `CREATE INDEX CONCURRENTLY` で定義済み。
- [x] `docs/runbooks/performance-index-rollout.md` に適用手順・ANALYZE・ロールバック手順を追記済み。
- [ ] ステージング DB での適用 + `EXPLAIN ANALYZE` / ロック計測（Docker/ネットワーク許可後に実施）。

> 計測テンプレ・記録場所: `docs/performance-tuning.md` の「1. V4 インデックス適用の概要」。

### 2. V5 マイグレーション（DATE 列＋移行計画）
- [x] `stamp_date` 列追加・既存 `year/month/day` からの更新・同期トリガー・ `idx_stamp_history_stamp_date` を含む `V5__add_stamp_history_date_column.sql` を追加済み。
- [x] `docs/runbooks/stamp-date-migration.md` で移行/ロールバック手順を記載、`docs/issues/stamp-date-normalization.md` に完全移行のフォローアップを書き起こし済み。
- [ ] ステージング適用→移行時間計測→ロールバック手順のリハーサル（Testcontainers or 実DB準備後に実施）。

### 3. バッチ取得メソッド実装で N+1 解消
- [x] `StampHistoryMapper` に `getStampHistoryByYearMonthEmployeeIds` を追加し、従業員×日付のクロス結合 SQL を実装。
- [x] `StampOutputService` を新メソッド利用に切り替えて 1 パス整形に変更、ファクトリーとの連携を検証。
- [x] `./gradlew test --tests com.example.teamdev.service.StampOutputServiceTest` は成功、`StampHistoryMapperBatchFetchTest` は Testcontainers ダウンロード制限で未完 → Docker 許可後に `./gradlew test --tests com.example.teamdev.mapper.StampHistoryMapperBatchFetchTest` を再実行。

### 4. NewsMapper の列限定化
- [x] 4 クエリを XML の `<sql id="newsColumns">` に差し替えて列リストを共通化、`resultMap` で Java との整合を保持。
- [x] `./gradlew test --tests com.example.teamdev.service.HomeNewsServiceTest` で主要シナリオを確認済み。

### 5. 総合検証とドキュメント整備
- [x] `docs/performance-tuning.md` に V4/V5 の内容・テストログ・残タスクを記録、Runbook/Issue とのリンクを整理。
- [x] 残作業を `docs/issues/stamp-date-normalization.md` / `docs/issues/jsonb-dependency-reduction.md` として登録。
- [ ] `./gradlew check` および `StampHistoryMapperBatchFetchTest` を含む Testcontainers 系テストは Docker 制限でタイムアウト中。環境が整い次第リトライし、結果をドキュメントへ追記。

## 依存関係
1 → 2 は独立だが、アプリ改修（タスク 3/4）は Flyway マイグレーションが適用済みであることを前提に進める。`stamp_date` を参照する改修は V5 適用後かつトリガー同期が機能している状態で実施する。

## 完了条件
- 計測タスク（V4/V5 適用、`./gradlew check` 再実行）が完了し、クエリ数削減と性能改善が実測で確認できている。
- Runbook とドキュメントが最新の結果を反映しており、後続の `stamp_date` 正常化および JSONB 依存削減タスクが Issue ベースで追跡できている。
