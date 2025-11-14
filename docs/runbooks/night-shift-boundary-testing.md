# 夜勤境界テスト・統合テスト実行 Runbook

## 目的
- 夜勤境界の日付正規化ロジックが正しく動作することを確認
- StampServiceTestに追加された夜勤境界テストの実行手順
- ビルド環境での統合テスト実行とクエリ実行計画の確認

## 背景

### 夜勤境界処理の2つのロジック

このコードベースには、夜勤境界を扱う**2つの異なるロジック**があります：

#### 1. StampService の夜勤フラグによる日付正規化

**目的**: 夜勤退勤打刻時に、日付を前日として記録

**実装場所**: `src/main/java/com/example/teamdev/service/StampService.java:49-53`

**動作**:
```java
if (stampType == StampType.DEPARTURE && nightWorkFlag == 1) {
    targetDate = targetDate.minusDays(1);
}
```

**例**:
- 7月10日 22:00に出勤（夜勤フラグOFF） → `2025-07-10` で記録
- 7月11日 02:00に退勤（夜勤フラグON） → `2025-07-10` で記録（前日に正規化）
- 時刻自体は変更されない（`02:00`のまま）

#### 2. OutTimeAdjuster の日跨ぎ調整

**目的**: 編集時に、出勤時刻より退勤時刻が前の場合に翌日として調整

**実装場所**: `src/main/java/com/example/teamdev/service/stamp/OutTimeAdjuster.java:25-37`

**動作**:
```java
if (inTime.compareTo(outTime) > 0) {
    return outTime.plusDays(1);
}
```

**例**:
- 出勤: 2025-10-01 22:00
- 退勤: 2025-10-01 06:00（入力値）
- 調整後: 2025-10-02 06:00（翌日として計算）

## 追加されたテストケース

### StampServiceTest に追加された夜勤境界テスト

1. **深夜0時ちょうどの退勤（夜勤フラグON）**
   - `execute_shouldNormalizeDateToPreviousDay_whenNightWorkDepartureBoundary_Midnight`
   - 翌日0時の退勤 → 前日の日付として記録

2. **深夜2時の退勤（夜勤フラグON）**
   - `execute_shouldNormalizeDateToPreviousDay_whenNightWorkDepartureAt2AM`
   - 翌日2時の退勤 → 前日の日付として記録

3. **深夜5時の退勤（夜勤フラグON）**
   - `execute_shouldNormalizeDateToPreviousDay_whenNightWorkDepartureAt5AM`
   - 翌日5時の退勤 → 前日の日付として記録

4. **深夜2時の退勤（夜勤フラグOFF）**
   - `execute_shouldNotNormalizeDate_whenNonNightWorkDepartureAt2AM`
   - 夜勤フラグOFFの場合は日付が変わらない

5. **夜勤出勤（23時の出勤）**
   - `execute_shouldRecordNightShiftAttendance_when23pmAttendance`
   - 出勤は打刻時刻の日付で記録される

6. **月末から月初への夜勤退勤（夜勤フラグON）**
   - `execute_shouldNormalizeDateToPreviousMonth_whenNightWorkDepartureAcrossMonth`
   - 8月1日の退勤 → 7月31日として記録

7. **年末から年始への夜勤退勤（夜勤フラグON）**
   - `execute_shouldNormalizeDateToPreviousYear_whenNightWorkDepartureAcrossYear`
   - 2026年1月1日の退勤 → 2025年12月31日として記録

## ローカル環境でのテスト実行

### 前提条件
- Java 21以上がインストールされていること
- Gradleがインストールされていること（または./gradlewが利用可能）
- Docker（PostgreSQL統合テスト用）

### 1. StampServiceTestのみ実行

```bash
# Gradle Wrapperを使用
./gradlew test --tests "*StampServiceTest"

# または、システムのGradleを使用
gradle test --tests "*StampServiceTest"
```

### 2. Stamp関連のすべてのテストを実行

```bash
./gradlew test --tests "*Stamp*Test"
```

### 3. すべてのユニットテストを実行

```bash
./gradlew test
```

### 4. 統合テスト（コントラクトテストを含む）を実行

```bash
./gradlew integrationTest
```

## CI/CD環境での統合テスト

### GitHub Actions での実行

テストはGitHub Actionsで自動的に実行されます：

1. **プルリクエスト時**
   - すべてのユニットテストが自動実行されます
   - テストが失敗するとマージがブロックされます

2. **マージ後**
   - 統合テストとコントラクトテストが実行されます

### テスト結果の確認

```bash
# テストレポートの確認
open build/reports/tests/test/index.html

# Jacoco カバレッジレポートの確認
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

## 本番環境でのクエリ実行計画確認

### 夜勤境界に関連するクエリの実行計画確認

本番環境で以下のクエリの実行計画を確認し、パフォーマンスが適切であることを確認します。

#### 1. 年月日による検索（夜勤境界を含む）

```sql
-- 準備: 統計情報の更新
ANALYZE stamp_history;

-- クエリ実行計画の確認
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id, employee_id, year, month, day, in_time, out_time, is_night_shift
FROM stamp_history
WHERE employee_id = 1
  AND year = '2025'
  AND month = '07'
  AND day = '10';
```

**期待される結果**:
- Index Scan on `idx_stamp_history_employee_date` を使用
- `Buffers: shared hit=...` が小さい値（< 10）
- Execution Time < 5ms

#### 2. 夜勤フラグによるフィルタリング

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, employee_id, year, month, day, in_time, out_time
FROM stamp_history
WHERE employee_id = 1
  AND is_night_shift = true
  AND year = '2025'
  AND month >= '07'
ORDER BY year, month, day;
```

**期待される結果**:
- Index Scan を使用
- is_night_shift によるフィルタリングが効率的

#### 3. 退勤時刻の範囲検索（深夜時間帯）

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, employee_id, year, month, day, in_time, out_time, is_night_shift
FROM stamp_history
WHERE employee_id = 1
  AND out_time >= '2025-07-10 00:00:00+09'::timestamptz
  AND out_time < '2025-07-11 06:00:00+09'::timestamptz;
```

### 実行計画の評価基準

#### パフォーマンス指標

| 指標 | 目標値 | 警告閾値 |
|------|--------|----------|
| Execution Time | < 5ms | > 50ms |
| Buffers (shared hit) | < 10 | > 100 |
| Rows Scanned | = Rows Returned | > 10x Rows Returned |
| Planning Time | < 2ms | > 20ms |

#### インデックス使用状況

```sql
-- インデックス使用状況の確認
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'stamp_history'
ORDER BY idx_scan DESC;
```

**期待される結果**:
- `idx_stamp_history_employee_date` の `idx_scan` が増加していること
- `idx_stamp_history_stamp_date` が適切に使用されていること

## トラブルシューティング

### テストが失敗する場合

1. **タイムゾーンの問題**
   ```bash
   # タイムゾーンを明示的に設定
   export TZ=Asia/Tokyo
   ./gradlew test --tests "*StampServiceTest"
   ```

2. **Docker PostgreSQLの問題**
   ```bash
   # Dockerコンテナの状態確認
   docker ps -a | grep postgres

   # コンテナのログ確認
   docker logs <container_id>
   ```

3. **依存関係の問題**
   ```bash
   # Gradleキャッシュのクリア
   ./gradlew clean build --refresh-dependencies
   ```

### クエリパフォーマンスが遅い場合

1. **統計情報の更新**
   ```sql
   ANALYZE stamp_history;
   ```

2. **インデックスの再構築**
   ```sql
   REINDEX INDEX CONCURRENTLY idx_stamp_history_employee_date;
   REINDEX INDEX CONCURRENTLY idx_stamp_history_stamp_date;
   ```

3. **テーブルのバキューム**
   ```sql
   VACUUM ANALYZE stamp_history;
   ```

## チェックリスト

### テスト実行前

- [ ] ローカル環境でStampServiceTestが成功すること
- [ ] すべてのStamp関連テストが成功すること
- [ ] 統合テストが成功すること（Docker PostgreSQLが起動していること）

### 本番環境デプロイ前

- [ ] ステージング環境でクエリ実行計画を確認
- [ ] 夜勤境界に関連するクエリのパフォーマンスが目標値を満たしている
- [ ] インデックス使用状況が適切である
- [ ] 統計情報が最新である

### デプロイ後

- [ ] 本番環境でクエリ実行計画を再確認
- [ ] インデックススキャンのカウントが増加していることを確認
- [ ] エラーログに夜勤境界関連のエラーがないことを確認
- [ ] 24時間後にパフォーマンス指標を再評価

## 参考資料

- [stamp-date-migration.md](./stamp-date-migration.md) - stamp_dateカラム導入のRunbook
- [performance-tuning.md](../performance-tuning.md) - パフォーマンスチューニングガイド
- [StampService.java](../../src/main/java/com/example/teamdev/service/StampService.java) - 夜勤フラグによる日付正規化の実装
- [OutTimeAdjuster.java](../../src/main/java/com/example/teamdev/service/stamp/OutTimeAdjuster.java) - 日跨ぎ調整の実装

## 変更履歴

| 日付 | 作成者 | 変更内容 |
|------|--------|----------|
| 2025-11-13 | Claude | 初版作成 - 夜勤境界テストの追加に伴うRunbook |
