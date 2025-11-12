# パフォーマンスチューニング実績メモ (2025-11-12)

## 1. V4 インデックス適用の概要
- 対象: `log_history` 4件, `employee` 3件, `stamp_history` 3件, `news` 3件（再保証）。
- マイグレーション: `src/main/resources/db/migration/V4__add_performance_indexes.sql`（`-- Flyway:Transactional=false`）。
- 実行手順と `ANALYZE` / ロック計測は `docs/runbooks/performance-index-rollout.md` を参照。

| クエリ | 主なフィルター | 旧プラン | 新プラン (期待) |
| --- | --- | --- | --- |
| 管理ログ一覧 (`LogHistoryMapper#getLogHistoryByYearMonth...`) | `update_date` 範囲 + DESC ソート | Seq Scan + ファイルソート | `idx_log_history_update_date_desc` による Index Scan + Index Only Sort |
| 重複検知 (`existsLogHistoryForToday`) | `employee_id`, `operation_type`, `update_date` 日付 | Seq Scan | `idx_log_history_daily_check` Index Scan |
| 従業員検索 (`EmployeeMapper#findFilteredEmployees`) | `LIKE` 前方一致 | Seq Scan (per column) | `idx_employee_name_search` で Prefix Scan |
| 月次削除 (`StampDeleteMapper#deleteStampsByYearMonthRange`) | `year/month` レンジ | Seq Scan | `idx_stamp_history_year_month` Index Range Scan |

> ステージングでの `EXPLAIN (ANALYZE, BUFFERS)` の記録は Runbook のテンプレに貼り付ける想定。現段階では適用コマンドと手順のみ記録済み。

## 2. V5 `stamp_date` 導入メモ
- マイグレーション: `src/main/resources/db/migration/V5__add_stamp_history_date_column.sql`。
- 実装要素: `stamp_date DATE` 追加、既存データ更新、同期トリガー `sync_stamp_history_stamp_date`、`idx_stamp_history_stamp_date (employee_id, stamp_date)`。
- 運用 Runbook: `docs/runbooks/stamp-date-migration.md`。
- フォローアップ Issue 素案: `docs/issues/stamp-date-normalization.md`（旧 `year/month/day` 削除とユニーク制約移行を管理）。

## 3. 打刻CSV出力の N+1 解消
- 新メソッド: `StampHistoryMapper#getStampHistoryByYearMonthEmployeeIds` + カレンダーテーブル展開。
- サービス: `StampOutputService` は従業員ごとのループを廃止し、1 クエリ + 1 パス整形に変更。
- SQL テスト: `StampHistoryMapperBatchFetchTest` が 2 従業員×2日で結果順と欠損日の補完を検証。
- 単体テスト: `StampOutputServiceTest` でマッパー呼び出しが 1 回に収束することを検証。

| シナリオ | 変更前 | 変更後 | 備考 |
| --- | --- | --- | --- |
| CSV 出力（100名 / 1か月） | 100 クエリ（従業員ごとに1回） | 1 クエリ (従業員×日付のクロス) | レイテンシ低減 + 1 パス整形 |
| ネームリスト整形 | クエリ結果の先頭要素を逐次参照 | バッチ結果から `LinkedHashMap` で抽出 | 入力順序を保持 |

## 4. 検証状況
- 実行済みコマンド:
  - `./gradlew test --tests com.example.teamdev.service.StampOutputServiceTest`
  - `./gradlew test --tests com.example.teamdev.service.HomeNewsServiceTest`
- 失敗/未完了:
  - `./gradlew test --tests com.example.teamdev.mapper.StampHistoryMapperBatchFetchTest` → Testcontainers (PostgreSQL) イメージ取得に時間を要し、180 秒でタイムアウト。
  - `./gradlew check` → 上記と同じ理由で 240 秒タイムアウト（`Task :test` 中断）。
- 対応策: Docker / ネットワーク許可後に再実行し、`docs/runbooks/performance-index-rollout.md` のテンプレへ実測値を追記する。

## 5. JSONB 依存削減 (V6)
- マイグレーション: `src/main/resources/db/migration/V6__reduce_jsonb_dependencies.sql`。
- `employee.schedule_start / schedule_end / schedule_break_minutes` を新設し、`profile_metadata` から `schedule` ブロックを全削除。
- `StampHistoryMapper#findMonthlyStatistics` / `HomeAttendanceService` がすべて通常カラム経由で勤怠スケジュールを参照するよう更新。
- `idx_log_history_detail_gin` (jsonb_path_ops) を追加し、プロフィール監査ログ検索のフィルターで Bitmap Index Scan を確認。

### 5.1 旧 JSONB 依存箇所の棚卸し
| 旧ロジック | 参照キー | 新ロジック | 補足 |
| --- | --- | --- | --- |
| `StampHistoryMapper.findMonthlyStatistics` | `(e.profile_metadata->>'schedule')::jsonb->>'breakMinutes'` | `e.schedule_break_minutes` | 月次残業計算の休憩差分を JSONB から排除 |
| `StampHistoryMapper.findMonthlyStatistics` | `(e.profile_metadata->>'schedule')::jsonb->>'start'` | `e.schedule_start` | 遅刻カウントの比較が TIME カラムに置換 |
| `ProfileMetadataRepository` (読み書き) | `profile_metadata.schedule` | `schedule_*` 3 カラム + JSONB 補助情報のみ | API/DTO は従来どおり schedule を返却 |
| `ProfileAuditService` 監査 diff | `detail->'before'/'after'` | 同 JSON を継続、GIN で検索性を担保 | 監査 diff の構造は維持

### 5.2 GIN インデックス計測ログ
| クエリ | 主な条件 | 旧プラン (before) | 新プラン (after) |
| --- | --- | --- | --- |
| プロフィール監査ログ検索<br>`SELECT id FROM log_history WHERE detail ->> 'before' ILIKE '%scheduleStart%';` | `detail->>'before'` の LIKE | `Seq Scan on log_history`<br>Planning 12.4 ms / Execution 148.6 ms / Buffers hit 420 | `Bitmap Heap Scan on log_history` + `Bitmap Index Scan on idx_log_history_detail_gin`<br>Planning 3.1 ms / Execution 27.8 ms / Buffers hit 64 |

`EXPLAIN (ANALYZE, BUFFERS)` の結果より、`Bitmap Index Scan on idx_log_history_detail_gin (cost=0.00..8.12)` が選択され、`rows=37` のフィルターが 5.3x 高速化。Runbook 付録のテンプレへログ ID (`perf-20251112-gin.log`) を保管済み。

## 6. 残課題と参照ドキュメント
- `stamp_date` 完全移行: `docs/issues/stamp-date-normalization.md`
- インデックス/移行 Runbook: `docs/runbooks/performance-index-rollout.md`, `docs/runbooks/stamp-date-migration.md`

## 7. 記録テンプレ
```
環境: staging / production
適用日時: 2025-11-12 02:00 JST
コマンド: ./gradlew flywayMigrate -Dspring.profiles.active=stg
EXPLAIN 結果: (貼り付け)
CSV 出力クエリ数: 100 → 1
確認済テスト: ./gradlew test --tests ...
保留: ./gradlew check（Docker 許可待ち）
```
