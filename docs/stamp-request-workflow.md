# 打刻修正申請ワークフロー

## 概要

打刻修正申請ワークフローは、従業員が打刻の修正や打刻忘れの申請を行い、管理者が承認・却下するための機能です。

## 機能詳細

### 1. 申請パターン

#### 1.1 既存打刻の修正申請
- **対象**: 既に打刻記録が存在する日
- **stampHistoryId**: 対象の勤怠記録ID（整数値）
- **動作**: 承認時に既存の勤怠記録を更新

**例**:
```json
POST /api/stamp-requests
{
  "stampHistoryId": 101,
  "requestedInTime": "2025-11-15T08:30:00+09:00",
  "requestedOutTime": "2025-11-15T17:30:00+09:00",
  "reason": "実際の退勤時刻と異なっていたため修正をお願いします。"
}
```

#### 1.2 打刻忘れの申請
- **対象**: 打刻記録が存在しない日（完全に打刻を忘れた日）
- **stampHistoryId**: `null`
- **動作**: 承認時に新規の勤怠記録を作成

**例**:
```json
POST /api/stamp-requests
{
  "stampHistoryId": null,
  "requestedInTime": "2025-11-15T09:00:00+09:00",
  "requestedOutTime": "2025-11-15T18:00:00+09:00",
  "requestedBreakStartTime": "2025-11-15T12:00:00+09:00",
  "requestedBreakEndTime": "2025-11-15T13:00:00+09:00",
  "requestedIsNightShift": false,
  "reason": "打刻を完全に忘れていました。"
}
```

### 2. 承認処理の詳細

#### 2.1 既存打刻の修正承認
1. 申請の `stampHistoryId` から既存の勤怠記録を取得
2. スナップショット検証（申請時と承認時で元データが一致するか確認）
3. 既存レコードを申請内容で更新
4. 申請ステータスを `APPROVED` に変更

#### 2.2 打刻忘れ申請の承認
1. 重複チェック: 同じ日付・従業員IDの勤怠記録が既に存在しないか確認
2. 新規勤怠記録の作成:
   - `stamp_date`: 申請日付
   - `year`, `month`, `day`: 申請日付から自動生成（ゼロパディング）
   - `in_time`, `out_time`, `break_start_time`, `break_end_time`: 申請内容
   - `is_night_shift`: 申請内容
   - `update_employee_id`: 承認者ID
3. 申請の `stampHistoryId` に新規作成されたレコードIDを設定
4. 申請ステータスを `APPROVED` に変更

### 3. エラーハンドリング

#### 3.1 打刻忘れ申請の承認時エラー

**409 Conflict - 重複レコード検出**:
```json
{
  "message": "この日付の勤怠記録は既に登録されています。申請を却下してください。"
}
```

**発生条件**:
- 申請時は `stampHistoryId=null` だったが、承認時には既に同じ日付の勤怠記録が登録されている
- 例: 従業員が申請後に手動で打刻を行った、別の申請が先に承認されたなど

**対処方法**:
1. 管理者が申請を却下
2. 従業員に既存の勤怠記録の修正申請を行うよう依頼

## データベース設計

### stamp_history テーブル

```sql
CREATE TABLE stamp_history (
    id SERIAL PRIMARY KEY,
    stamp_date DATE,                    -- 日付（DATE型）
    year VARCHAR(4),                    -- 年（互換性のため保持）
    month VARCHAR(2),                   -- 月（互換性のため保持）
    day VARCHAR(2),                     -- 日（互換性のため保持）
    employee_id INTEGER NOT NULL,
    in_time TIMESTAMPTZ,
    out_time TIMESTAMPTZ,
    break_start_time TIMESTAMPTZ,
    break_end_time TIMESTAMPTZ,
    is_night_shift BOOLEAN DEFAULT FALSE,
    update_employee_id INTEGER,
    update_date TIMESTAMPTZ,

    -- 重複防止のための一意制約
    CONSTRAINT uq_stamp_history_date_employee
        UNIQUE (stamp_date, employee_id)
);
```

### stamp_request テーブル

```sql
CREATE TABLE stamp_request (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    stamp_history_id INTEGER,           -- NULL許容（打刻忘れの場合）
    stamp_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,        -- PENDING, APPROVED, REJECTED, CANCELLED
    reason TEXT NOT NULL,

    -- 元の値（スナップショット）
    original_in_time TIMESTAMPTZ,
    original_out_time TIMESTAMPTZ,
    original_break_start_time TIMESTAMPTZ,
    original_break_end_time TIMESTAMPTZ,
    original_is_night_shift BOOLEAN,

    -- 申請内容
    requested_in_time TIMESTAMPTZ,
    requested_out_time TIMESTAMPTZ,
    requested_break_start_time TIMESTAMPTZ,
    requested_break_end_time TIMESTAMPTZ,
    requested_is_night_shift BOOLEAN,

    -- 承認・却下情報
    approval_employee_id INTEGER,
    approval_note TEXT,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (stamp_history_id) REFERENCES stamp_history(id)
);
```

**重要**: `stamp_history_id` は NULL を許容します。これにより打刻忘れ申請が可能になります。

## バックエンド実装

### StampRequestApprovalService

```java
@Transactional
public StampRequest approveRequest(Integer requestId, Integer approverId, String approvalNote) {
    StampRequest request = findEditableRequest(requestId);
    OffsetDateTime now = store.now();

    if (request.getStampHistoryId() != null) {
        // ケースA: 既存の打刻レコードを更新
        StampHistory history = loadStampHistory(request);
        assertStampHistorySnapshot(history, request);
        applyRequestedValuesToHistory(history, request, approverId, now);
        stampHistoryMapper.update(history);
    } else {
        // ケースB: 打刻忘れのため新規レコードを作成
        assertNoExistingStampHistory(request);
        StampHistory newHistory = createNewStampHistory(request, approverId, now);
        stampHistoryMapper.save(newHistory);
        request.setStampHistoryId(newHistory.getId());
    }

    request.setStatus(StampRequestStatus.APPROVED.name());
    request.setApprovalEmployeeId(approverId);
    request.setApprovalNote(approvalNote);
    request.setUpdatedAt(now);
    return store.save(request);
}
```

### MyBatis マッパー

```xml
<insert id="save" parameterType="com.example.teamdev.entity.StampHistory"
        useGeneratedKeys="true" keyProperty="id" keyColumn="id">
    INSERT INTO stamp_history (
        stamp_date, year, month, day, employee_id,
        in_time, out_time, break_start_time, break_end_time,
        is_night_shift, update_employee_id, update_date
    ) VALUES (
        #{stampDate}, #{year}, #{month}, #{day}, #{employeeId},
        #{inTime}, #{outTime}, #{breakStartTime}, #{breakEndTime},
        #{isNightShift}, #{updateEmployeeId}, #{updateDate}
    )
</insert>
```

**重要**: `useGeneratedKeys="true"` により、INSERT後にIDを自動取得します。

## フロントエンド実装

### RequestCorrectionModal.tsx

```typescript
type RequestCorrectionForm = {
  stampHistoryId?: number | null;  // nullable対応
  requestedInTime?: string | null;
  requestedOutTime?: string | null;
  requestedBreakStartTime?: string | null;
  requestedBreakEndTime?: string | null;
  requestedIsNightShift?: boolean;
  reason: string;
};

const normalizePayload = (values: RequestCorrectionForm): StampRequestCreatePayload => ({
  stampHistoryId: values.stampHistoryId === 0 ? null : (values.stampHistoryId ?? null),
  requestedInTime: values.requestedInTime || null,
  requestedOutTime: values.requestedOutTime || null,
  requestedBreakStartTime: values.requestedBreakStartTime || null,
  requestedBreakEndTime: values.requestedBreakEndTime || null,
  requestedIsNightShift: values.requestedIsNightShift ?? false,
  reason: values.reason,
});
```

### OpenAPI スキーマ

```typescript
const StampRequestCreateRequest = z.object({
  stampHistoryId: z.number().int().nullish(),  // nullable + optional
  requestedInTime: z.string().datetime({ offset: true }).optional(),
  requestedOutTime: z.string().datetime({ offset: true }).optional(),
  requestedBreakStartTime: z.string().datetime({ offset: true }).optional(),
  requestedBreakEndTime: z.string().datetime({ offset: true }).optional(),
  requestedIsNightShift: z.boolean().optional(),
  reason: z.string().min(1, "理由は必須です"),
});
```

## テスト

### バックエンドユニットテスト

打刻忘れ申請の承認に関する4つのテストケースを実装:

1. **基本的な成功ケース**: 新規レコードが作成され、IDが設定される
2. **日付フィールド検証**: year/month/day が正しくゼロパディングされる
3. **重複検出**: 既存レコードがある場合に409エラーを返す
4. **全フィールド反映**: 休憩時間・夜勤フラグを含むすべての申請内容が反映される

### フロントエンドユニットテスト

- RequestCorrectionModal の型定義テスト
- nullable stampHistoryId のバリデーション
- ペイロード正規化ロジック（undefined → null変換）

## API仕様

詳細は [OpenAPI仕様書](/openapi/openapi.yaml) を参照してください。

### 主要エンドポイント

- `POST /api/stamp-requests` - 申請作成
- `POST /api/stamp-requests/{id}/approve` - 承認
- `POST /api/stamp-requests/{id}/reject` - 却下
- `GET /api/stamp-requests/my-requests` - 自分の申請一覧
- `GET /api/stamp-requests/pending` - 承認待ち一覧（管理者）

## セキュリティ考慮事項

1. **権限チェック**:
   - 申請作成: 本人のみ
   - 承認・却下: 管理者のみ

2. **スナップショット検証**:
   - 既存打刻の修正時、元データが変更されていないか確認
   - 不一致の場合は409エラー

3. **重複防止**:
   - 打刻忘れ申請の承認時、既存レコードの有無を確認
   - 重複がある場合は409エラー

4. **トランザクション保証**:
   - 承認処理全体を`@Transactional`で保護
   - 勤怠記録の作成/更新と申請ステータス更新をアトミックに実行

## パフォーマンス考慮事項

1. **インデックス**:
   ```sql
   CREATE INDEX idx_stamp_history_date_employee
       ON stamp_history(stamp_date, employee_id);

   CREATE INDEX idx_stamp_request_status
       ON stamp_request(status);
   ```

2. **N+1クエリ対策**:
   - 承認待ち一覧取得時に従業員情報をJOINで取得

## 今後の拡張性

1. **一括承認機能**: 複数の申請を一度に承認
2. **自動承認ルール**: 特定条件下で自動承認
3. **通知機能**: 申請状態変更時にメール/プッシュ通知
4. **監査ログ**: 承認・却下の履歴を詳細に記録

## リリースノート

### v1.1.0 (2025-11-17)

#### 新機能
- 打刻忘れの日に対する新規申請機能を追加
  - `stampHistoryId=null` で申請可能
  - 承認時に自動で新規勤怠記録を作成
  - 重複登録防止のための409エラー対応

#### 技術的変更
- `StampRequestCreateRequest.stampHistoryId` を nullable に変更
- `StampRequestApprovalService` に INSERT ロジックを追加
- MyBatis マッパーに `useGeneratedKeys` を設定
- OpenAPI 仕様書に詳細な説明とサンプルを追加

#### テスト
- バックエンド: 4件の新規ユニットテスト追加
- フロントエンド: 型定義とバリデーションテストを修正

#### ドキュメント
- README.md に機能説明を追加
- OpenAPI 仕様書に詳細な説明とサンプルを追加
- 本技術ドキュメント（stamp-request-workflow.md）を新規作成
