# タイムゾーン移行実装の段階的改善プラン

マルチエージェントレビューで指摘された Critical/Important/Minor Issues を3つのフェーズに分けて修正します。
各フェーズ完了後にコミットを作成し、段階的に改善を進めます。

---

## Phase 1: Critical Issues 修正（データ整合性とタイムゾーン正確性）

### 目的
- データベースの二重アクセスによる整合性リスクを排除
- タイムゾーン変換の正確性を保証

### 作業内容

#### 1-1. StampHistoryPersistence の二重DBアクセス削除
- **ファイル**: `src/main/java/com/example/teamdev/service/stamp/StampHistoryPersistence.java`
- **修正箇所**: Line 123-124
- **内容**: TODO コメントと `stampHistoryMapper.save(entity);` を削除
- **理由**: 重複キーエラーリスク、トランザクション不整合、不要なDB I/O

#### 1-2. MyBatis クエリのタイムゾーン明示化
- **ファイル**: `src/main/resources/com/example/teamdev/mapper/StampHistoryMapper.xml`
- **修正箇所**: Line 26-28
- **内容**: `to_char()` 関数に `AT TIME ZONE 'Asia/Tokyo'` を追加
- **対象カラム**: in_time, out_time, update_date の3箇所

修正例:
```xml
<!-- 修正前 -->
to_char(sh.in_time, 'HH24:MI') AS "inTime"

<!-- 修正後 -->
to_char(sh.in_time AT TIME ZONE 'Asia/Tokyo', 'HH24:MI') AS "inTime"
```

#### 1-3. テストとビルド
- Backend: `./gradlew test`
- Frontend: `npm test`（504テスト全パス確認）
- Build: `./gradlew build`

#### 1-4. コミットメッセージ
```
fix: データ整合性とタイムゾーン正確性の改善

- StampHistoryPersistence の二重DBアクセスを削除
- MyBatis クエリに明示的なタイムゾーン変換を追加

```

---

## Phase 2: Important Issues 修正（パフォーマンスと移行計画）

### 目的
- 不要な型変換を排除してパフォーマンスを改善
- 移行完了のロードマップを明確化

### 作業内容

#### 2-1. StampEditService の変換パイプライン簡素化

**ファイル**: `src/main/java/com/example/teamdev/service/StampEditService.java`

**新規メソッド追加**（Line 145付近）:
```java
/**
 * 日付と時刻文字列を直接OffsetDateTimeに変換します。
 * 中間のTimestamp変換を排除し、パフォーマンスを改善します。
 *
 * @param year  年（YYYY）
 * @param month 月（MM）
 * @param day   日（DD）
 * @param time  時刻（HH:mm）
 * @return JST（+09:00）のOffsetDateTime
 */
private OffsetDateTime parseToOffsetDateTime(String year, String month,
                                              String day, String time) {
    if (time == null || time.isEmpty()) {
        return null;
    }
    String isoString = String.format("%s-%s-%sT%s:00+09:00",
                                      year, month, day, time);
    return OffsetDateTime.parse(isoString, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
}
```

**既存メソッド削除**:
- `convertInTime()` メソッド（Line 117-129）
- `convertOutTime()` メソッド（Line 131-143）

**processSingleStampEdit() の修正**（Line 100-114）:
```java
// Step 2: 時刻を直接OffsetDateTimeに変換
OffsetDateTime inTime = parseToOffsetDateTime(
    data.getYear(), data.getMonth(), data.getDay(), data.getInTime());
OffsetDateTime outTime = parseToOffsetDateTime(
    data.getYear(), data.getMonth(), data.getDay(), data.getOutTime());

// Step 3: 退勤時刻調整
OffsetDateTime adjustedOutTime = outTimeAdjuster.adjustOutTimeIfNeeded(inTime, outTime);

// Step 4: データ永続化
return stampPersistence.saveOrUpdate(data, inTime, adjustedOutTime, updateEmployeeId);
```

**依存クラスの修正**:
- `OutTimeAdjuster.java`: メソッドシグネチャを `adjustOutTimeIfNeeded(OffsetDateTime, OffsetDateTime)` に変更

#### 2-2. 移行完了計画の文書化

**新規ファイル**: `docs/migration/timestamptz-completion-plan.md`

内容: TIMESTAMPTZ 移行の完了手順、データ検証クエリ、旧カラム削除スクリプト

#### 2-3. テストとビルド
- Backend: `./gradlew test`
- Frontend: `npm test`
- Build: `./gradlew build`

#### 2-4. コミットメッセージ
```
improve: パフォーマンス改善と移行計画の文書化

- StampEditService の変換パイプラインを簡素化（4段階→2段階）
- 不要な中間Timestamp変換を削除
- TIMESTAMPTZ 移行完了計画を文書化

```

---

## Phase 3: Minor Issues 修正（技術的負債の整理）

### 目的
- 未解決の TODO コメントを明確化
- 将来的な改善提案を文書化

### 作業内容

#### 3-1. TODO コメントの整理

**ファイル**: `src/main/java/com/example/teamdev/service/StampEditService.java`
- Line 154 の TODO を具体的な説明に更新

修正例:
```java
// NOTE: 現在は全エントリで同じ従業員IDを想定している
// マルチテナント対応時には各エントリごとにログを記録する必要がある
```

#### 3-2. バッチAPI改善提案の文書化

**新規ファイル**: `docs/improvements/batch-api-proposal.md`

内容: バックエンドでのバッチエンドポイント実装提案

#### 3-3. テストとビルド
- Backend: `./gradlew test`
- Frontend: `npm test`
- Build: `./gradlew build`

#### 3-4. コミットメッセージ
```
docs: 技術的負債の文書化と改善提案

- TODO コメントを具体的な説明に更新
- バッチAPI改善提案を文書化

```

---

## 最終確認

### 全フェーズ完了後のE2Eテスト

1. **Docker 環境での動作確認**
```bash
docker-compose down
docker-compose up --build -d
sleep 60
docker-compose ps  # 全コンテナがhealthyであることを確認
```

2. **機能テスト**
- ブラウザで http://localhost:8080/signin にアクセス
- 打刻機能が正常に動作することを確認
- 打刻編集機能が正常に動作することを確認

3. **ログ確認**
```bash
docker logs teamdevelopbravo-main-app-1 --tail 50
```

---

## リスク評価

| Phase | リスクレベル | 理由 | 対策 |
|-------|------------|------|------|
| Phase 1 | 低 | 既存テストでカバー済み | テスト実行で検証 |
| Phase 2 | 中 | OutTimeAdjuster の変更が影響 | 段階的テスト実行 |
| Phase 3 | 低 | ドキュメント追加のみ | コード変更なし |

---

## 作業時間見積もり

- **Phase 1**: 30分（修正15分 + テスト15分）
- **Phase 2**: 1時間（実装30分 + テスト20分 + ドキュメント10分）
- **Phase 3**: 20分（ドキュメント作成のみ）
- **最終確認**: 15分
- **合計**: 約2時間5分

---

## 完了条件

✅ 全3フェーズの修正が完了
✅ 各フェーズでコミットを作成
✅ 全504テストがパス
✅ Docker環境で正常動作
✅ ログにエラーがない
