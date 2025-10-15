# TIMESTAMPTZ 移行完了計画

## 概要

このドキュメントは、`stamp_history` テーブルの TIMESTAMPTZ 移行を完全に完了させるための手順を記載します。現在、新旧両方のカラムが存在していますが、将来的には旧カラムを削除し、TIMESTAMPTZ カラムのみを使用する計画です。

## 現在の状態

### データベーススキーマ

```sql
-- 現在のカラム構成
ALTER TABLE stamp_history
  ADD COLUMN in_time_tz TIMESTAMPTZ,         -- 新: タイムゾーン対応出勤時刻
  ADD COLUMN out_time_tz TIMESTAMPTZ,        -- 新: タイムゾーン対応退勤時刻
  ADD COLUMN update_date_tz TIMESTAMPTZ;     -- 新: タイムゾーン対応更新日時

-- 旧カラム（削除予定）
-- in_time TIMESTAMP WITHOUT TIME ZONE
-- out_time TIMESTAMP WITHOUT TIME ZONE
-- update_date TIMESTAMP WITHOUT TIME ZONE
```

### アプリケーションコード

- **Java Entity**: `OffsetDateTime` 型を使用（新カラムにマッピング済み）
- **MyBatis Mapper**: `AT TIME ZONE 'Asia/Tokyo'` 句を使用してJST変換済み
- **Service Layer**: Timestamp → OffsetDateTime 変換パイプラインを簡素化済み

## 移行完了までのステップ

### ステップ 1: データ検証

旧カラムと新カラムのデータ整合性を確認します。

#### 1-1. 全レコードの整合性確認

```sql
-- 出勤時刻の整合性チェック
SELECT
  id,
  in_time,
  in_time_tz,
  in_time_tz AT TIME ZONE 'Asia/Tokyo' AS in_time_tz_jst
FROM stamp_history
WHERE in_time IS NOT NULL
  AND in_time_tz IS NOT NULL
  AND in_time::timestamp <> (in_time_tz AT TIME ZONE 'Asia/Tokyo')::timestamp
ORDER BY id;
```

```sql
-- 退勤時刻の整合性チェック
SELECT
  id,
  out_time,
  out_time_tz,
  out_time_tz AT TIME ZONE 'Asia/Tokyo' AS out_time_tz_jst
FROM stamp_history
WHERE out_time IS NOT NULL
  AND out_time_tz IS NOT NULL
  AND out_time::timestamp <> (out_time_tz AT TIME ZONE 'Asia/Tokyo')::timestamp
ORDER BY id;
```

```sql
-- 更新日時の整合性チェック
SELECT
  id,
  update_date,
  update_date_tz,
  update_date_tz AT TIME ZONE 'Asia/Tokyo' AS update_date_tz_jst
FROM stamp_history
WHERE update_date IS NOT NULL
  AND update_date_tz IS NOT NULL
  AND update_date::timestamp <> (update_date_tz AT TIME ZONE 'Asia/Tokyo')::timestamp
ORDER BY id;
```

#### 1-2. NULL 値の確認

```sql
-- NULL 値の不整合チェック
SELECT
  COUNT(*) AS total_records,
  COUNT(in_time) AS in_time_count,
  COUNT(in_time_tz) AS in_time_tz_count,
  COUNT(out_time) AS out_time_count,
  COUNT(out_time_tz) AS out_time_tz_count,
  COUNT(update_date) AS update_date_count,
  COUNT(update_date_tz) AS update_date_tz_count
FROM stamp_history;
```

**期待される結果**: 各カラムのレコード数が一致していること

### ステップ 2: 検証期間

**推奨検証期間**: 最低 2 週間（本番環境での動作確認）

検証期間中に確認すべき項目：
- [ ] 打刻登録が正常に動作する
- [ ] 打刻編集が正常に動作する
- [ ] 打刻履歴の取得が正常に動作する
- [ ] タイムゾーンの変換が正確である
- [ ] エラーログに異常がない
- [ ] パフォーマンスの劣化がない

### ステップ 3: 旧カラム削除の準備

#### 3-1. バックアップの作成

```bash
# データベース全体のバックアップ
pg_dump -U postgres -d teamdev_db -F c -b -v -f "backup_before_column_drop_$(date +%Y%m%d_%H%M%S).dump"

# stamp_history テーブルのみのバックアップ（CSV形式）
psql -U postgres -d teamdev_db -c "\COPY stamp_history TO 'stamp_history_backup_$(date +%Y%m%d_%H%M%S).csv' CSV HEADER"
```

#### 3-2. ロールバックプランの準備

旧カラムを削除した後に問題が発生した場合のロールバック手順を準備します。

```sql
-- ロールバックスクリプト（削除後に問題が発生した場合）
-- 1. 旧カラムを再作成
ALTER TABLE stamp_history
  ADD COLUMN in_time TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN out_time TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN update_date TIMESTAMP WITHOUT TIME ZONE;

-- 2. 新カラムから旧カラムにデータをコピー
UPDATE stamp_history
SET
  in_time = (in_time_tz AT TIME ZONE 'Asia/Tokyo')::timestamp,
  out_time = (out_time_tz AT TIME ZONE 'Asia/Tokyo')::timestamp,
  update_date = (update_date_tz AT TIME ZONE 'Asia/Tokyo')::timestamp;

-- 3. アプリケーションを旧バージョンにロールバック
```

### ステップ 4: 旧カラムの削除

検証期間が完了し、全ての確認が完了したら、旧カラムを削除します。

#### 4-1. マイグレーションファイルの作成

```sql
-- File: src/main/resources/db/migration/V002__drop_old_timestamp_columns.sql

-- 旧カラムを削除
ALTER TABLE stamp_history
  DROP COLUMN IF EXISTS in_time,
  DROP COLUMN IF EXISTS out_time,
  DROP COLUMN IF EXISTS update_date;

-- 新カラムの名前を変更（オプション）
-- NOTE: 現在は新旧両方のカラム名を保持していますが、
-- 将来的には _tz サフィックスを削除して統一することも検討できます
-- ALTER TABLE stamp_history
--   RENAME COLUMN in_time_tz TO in_time;
-- ALTER TABLE stamp_history
--   RENAME COLUMN out_time_tz TO out_time;
-- ALTER TABLE stamp_history
--   RENAME COLUMN update_date_tz TO update_date;
```

#### 4-2. Entity クラスの更新

カラム名を変更した場合は、Entity クラスの `@Column` アノテーションを更新します。

```java
// StampHistory.java
@Column(name = "in_time")  // _tz サフィックスを削除した場合
private OffsetDateTime inTime;

@Column(name = "out_time")
private OffsetDateTime outTime;

@Column(name = "update_date")
private OffsetDateTime updateDate;
```

### ステップ 5: 本番環境への適用

#### 5-1. メンテナンスウィンドウの設定

**推奨メンテナンス時間**: 深夜 2:00 - 4:00（システム利用が最も少ない時間帯）

#### 5-2. 適用手順

1. **アプリケーション停止**
   ```bash
   docker-compose down
   ```

2. **データベースバックアップ**
   ```bash
   pg_dump -U postgres -d teamdev_db -F c -b -v -f "backup_before_migration_$(date +%Y%m%d_%H%M%S).dump"
   ```

3. **マイグレーション実行**
   ```bash
   docker-compose up -d db
   # マイグレーションは Flyway が自動実行
   ```

4. **アプリケーション起動**
   ```bash
   docker-compose up -d
   ```

5. **動作確認**
   - ヘルスチェック: `curl http://localhost:8080/actuator/health`
   - ログ確認: `docker logs teamdevelopbravo-main-app-1 --tail 100`
   - 機能テスト: 打刻登録・編集の動作確認

### ステップ 6: 移行完了後の確認

#### 6-1. データベース確認

```sql
-- テーブル定義の確認
\d stamp_history

-- レコード数の確認
SELECT COUNT(*) FROM stamp_history;

-- 最新データの確認
SELECT * FROM stamp_history ORDER BY update_date_tz DESC LIMIT 10;
```

#### 6-2. アプリケーションログ確認

```bash
# エラーログの確認
docker logs teamdevelopbravo-main-app-1 | grep -i error

# 警告ログの確認
docker logs teamdevelopbravo-main-app-1 | grep -i warn
```

#### 6-3. パフォーマンス確認

```sql
-- クエリ実行計画の確認
EXPLAIN ANALYZE
SELECT * FROM stamp_history
WHERE employee_id = 1
  AND year = '2025'
  AND month = '10'
ORDER BY day;
```

## トラブルシューティング

### 問題 1: データ不整合が発見された

**対応**:
1. 不整合レコードのIDを特定
2. 手動でデータを修正
3. 修正後、再度検証クエリを実行

### 問題 2: マイグレーション実行中にエラー

**対応**:
1. エラーメッセージを確認
2. バックアップから復元
3. マイグレーションスクリプトを修正して再実行

### 問題 3: パフォーマンス劣化

**対応**:
1. インデックスの再構築
   ```sql
   REINDEX TABLE stamp_history;
   ```
2. VACUUM ANALYZE の実行
   ```sql
   VACUUM ANALYZE stamp_history;
   ```

## 完了条件

以下の条件を全て満たした場合、移行完了とみなします：

- [ ] 全てのデータ検証クエリでエラーが0件
- [ ] 検証期間中（最低2週間）にエラーが発生しない
- [ ] 本番環境で全機能が正常に動作
- [ ] パフォーマンスの劣化がない
- [ ] バックアップが正常に取得できている
- [ ] ロールバックプランが準備されている
- [ ] 関係者全員の承認が得られている

## 参考資料

- [PostgreSQL TIMESTAMPTZ Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Flyway Migration Documentation](https://flywaydb.org/documentation/)
- [Java OffsetDateTime API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/OffsetDateTime.html)

## 変更履歴

| 日付 | 変更者 | 変更内容 |
|------|--------|----------|
| 2025-10-14 | Claude | 初版作成 |
