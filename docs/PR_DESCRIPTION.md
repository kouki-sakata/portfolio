# 勤怠履歴の新規作成機能追加とバグ修正

## 概要

勤怠履歴ページでレコードが存在しない日付に対して新規作成できるように機能改善を実施しました。
また、関連する6つのバグを修正し、コード品質を向上させました。

## 主要な変更

### 1. 新規作成機能の追加

**Before**
- レコードがない日付は編集ボタンが無効
- 新規作成ができない

**After**
- 全ての日付で編集ボタンが有効
- レコードがない日付で編集ボタンをクリックすると新規作成ダイアログが開く
- 削除ボタンは引き続きレコード存在時のみ有効

### 2. ID 0エラーの修正（404 Not Found）

**問題**
```
POST /api/stamps/0 → 404 Not Found
```

**原因**
- `isCreateMode = entry === null` の判定が不適切
- レコードなし日付では `entry = {id: null, ...}` となり、誤って更新モードと判定
- ID 0でPUTリクエストが送信されていた

**解決**
```typescript
const isCreateMode = !entry?.id;  // entry?.id が null/undefined なら新規作成
```

### 3. 無限レンダリングエラーの修正

**問題**
```
Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
```

**原因**
- `form.reset()` がレンダリング中に直接呼び出されていた

**解決**
```typescript
useEffect(() => {
  if (open) {
    form.reset({...});
  }
}, [entry?.id, open]);
```

### 4. 日付フォーマット不一致の修正

**問題**
- DBにデータが存在するのに、画面では全て「-」と表示

**原因**
- API: `day: "01", "05"` (ゼロパディング)
- フロントエンド: `day: "1", "5"` (ゼロパディングなし)

**解決**
```typescript
const dayStr = day.toString().padStart(2, '0');
```

### 5. バリデーションエラーの修正

**問題**
```json
{
  "field": "day",
  "rejectedValue": "05",
  "code": "Pattern"
}
```

**解決**
```java
// Before
@Pattern(regexp = "^([1-9]|[12][0-9]|3[01])$")

// After
@Pattern(regexp = "^(0?[1-9]|[12][0-9]|3[01])$")  // ゼロパディング許可
```

### 6. DBカラム欠落の修正

**問題**
- `is_night_shift`, `break_start_time`, `break_end_time` が常にnull

**解決**
- `StampHistoryMapper.java` のSELECT文にカラムを追加

### 7. 空文字列による休憩時間削除

**解決**
```java
@Pattern(regexp = "^$|^([0-1][0-9]|2[0-3]):[0-5][0-9]$")  // 空文字列を許可
```

## コード品質改善

### 複雑度の削減

**EditStampDialog**: 20 → 15未満
- `onSubmit` を3つの関数に分割
- ネストされた三項演算子を関数化

**StampHistoryPage**: 16 → 15未満
- `createDummyEntry` を独立した関数に抽出
- `forEach` → `for...of` に変更

## テスト

### フロントエンド
```
✅ 722 tests passed
✅ 0 linter errors
✅ Build successful
```

### バックエンド
- ✅ 統合テスト5件を追加
  - レコードなし日付への新規作成
  - 夜勤フラグありの新規作成
  - 最小限フィールドでの新規作成
  - 権限チェック（403エラー）
  - 新規作成→更新の統合シナリオ

## 変更ファイル

**バックエンド（3ファイル）**
- `StampCreateRequest.java` - バリデーションパターン修正
- `StampUpdateRequest.java` - 空文字列許可
- `StampHistoryMapper.java` - SELECT文修正
- `StampRestControllerTest.java` - テスト追加

**フロントエンド（5ファイル）**
- `EditStampDialog.tsx` - 新規作成判定修正、複雑度削減
- `StampHistoryPage.tsx` - 日付フォーマット統一、複雑度削減
- `StampHistoryCard.tsx` - 編集ボタン有効化
- `StampHistoryCard.test.tsx` - テスト更新
- `stampApi.ts` - リンター自動修正

## デプロイ時の注意事項

### ⚠️ バックエンドの再起動が必須

バリデーションパターンの変更がクラスファイルに反映されるため、必ず再起動してください。

```bash
# Dockerの場合
docker-compose restart app

# または
./gradlew bootRun
```

### 動作確認手順

1. 勤怠履歴ページへ移動
2. レコードがない日付の編集ボタンをクリック
3. 「打刻新規作成」ダイアログが開くことを確認
4. データを入力して「作成」ボタンをクリック
5. 201 Created が返り、一覧に表示されることを確認

## 関連ドキュメント

詳細な実装ドキュメント: `docs/attendance-history-improvements.md`

## スクリーンショット

(必要に応じて追加)
