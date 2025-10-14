# バッチAPI改善提案

## 概要

現在のフロントエンドは、複数の打刻編集を1つずつ個別のAPIコールで処理していますが、バックエンドで専用のバッチエンドポイントを提供することで、トランザクションの一貫性とパフォーマンスを大幅に向上できます。

## 現在の問題点

### フロントエンドでのバッチ処理

```typescript
// frontend/src/features/stampHistory/hooks/useStampHistoryExport.ts (Line 47-83)
async function processBatchEdits(editList: StampEditData[]): Promise<void> {
  for (const item of editList) {
    await editStampEntry(item);  // ← 1つずつAPIコール
  }
}
```

### 問題

1. **ネットワークオーバーヘッド**
   - N個の編集に対してN回のHTTPリクエストが発生
   - 各リクエストのレイテンシが累積
   - 大量編集時にパフォーマンスが劣化

2. **トランザクションの一貫性**
   - フロントエンドで個別にAPIコールするため、途中で失敗した場合の一貫性が保証されない
   - 例: 10個中5個が成功、5個が失敗した場合の処理が複雑

3. **エラーハンドリングの複雑さ**
   - 各リクエストごとにエラーハンドリングが必要
   - 部分的な失敗の管理が困難

4. **サーバーリソースの無駄**
   - 同じセッション認証を何度も検証
   - データベースコネクションの無駄な開閉

## 提案: バックエンドでのバッチエンドポイント

### 新規エンドポイント

```
POST /api/stamps/batch
```

### リクエストボディ

```json
{
  "updates": [
    {
      "id": 123,
      "employeeId": 100,
      "year": "2025",
      "month": "10",
      "day": "1",
      "inTime": "09:00",
      "outTime": "18:00"
    },
    {
      "id": 124,
      "employeeId": 100,
      "year": "2025",
      "month": "10",
      "day": "2",
      "inTime": "09:30",
      "outTime": "18:30"
    }
  ],
  "updateEmployeeId": 1
}
```

### レスポンス

#### 成功時 (200 OK)

```json
{
  "success": true,
  "totalProcessed": 10,
  "totalSucceeded": 10,
  "totalFailed": 0,
  "results": [
    {
      "index": 0,
      "id": 123,
      "status": "success"
    },
    {
      "index": 1,
      "id": 124,
      "status": "success"
    }
  ]
}
```

#### 部分的失敗 (207 Multi-Status)

```json
{
  "success": false,
  "totalProcessed": 10,
  "totalSucceeded": 8,
  "totalFailed": 2,
  "results": [
    {
      "index": 0,
      "id": 123,
      "status": "success"
    },
    {
      "index": 8,
      "id": null,
      "status": "error",
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid time format"
      }
    }
  ]
}
```

### バックエンド実装例

#### Controller

```java
@RestController
@RequestMapping("/api/stamps")
public class StampBatchController {

    private final StampEditService stampEditService;

    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<BatchEditResponse> batchEdit(
            @Valid @RequestBody BatchEditRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        int updateEmployeeId = extractEmployeeId(userDetails);

        BatchEditResponse response = stampEditService.executeBatch(
            request.getUpdates(),
            updateEmployeeId
        );

        HttpStatus status = response.getTotalFailed() > 0
            ? HttpStatus.MULTI_STATUS
            : HttpStatus.OK;

        return ResponseEntity.status(status).body(response);
    }
}
```

#### Service Layer

```java
@Service
public class StampEditService {

    /**
     * バッチ処理を実行します。
     * 全ての更新を1つのトランザクションで処理し、
     * 個別のエラーを記録しながら可能な限り多くの更新を適用します。
     *
     * @param updates 更新データのリスト
     * @param updateEmployeeId 更新者のID
     * @return バッチ処理の結果
     */
    @Transactional
    public BatchEditResponse executeBatch(
            List<StampEditData> updates,
            int updateEmployeeId) {

        List<BatchEditResult> results = new ArrayList<>();
        int succeeded = 0;
        int failed = 0;

        for (int i = 0; i < updates.size(); i++) {
            StampEditData data = updates.get(i);
            try {
                boolean saved = processSingleStampEdit(data, updateEmployeeId);
                if (saved) {
                    results.add(BatchEditResult.success(i, data.getId()));
                    succeeded++;
                } else {
                    results.add(BatchEditResult.error(i, "SAVE_FAILED", "Failed to save entity"));
                    failed++;
                }
            } catch (Exception e) {
                results.add(BatchEditResult.error(i, "EXCEPTION", e.getMessage()));
                failed++;
            }
        }

        // ログ履歴を一度だけ記録
        if (succeeded > 0) {
            recordBatchLogHistory(updates, updateEmployeeId, succeeded, failed);
        }

        return new BatchEditResponse(
            failed == 0,
            updates.size(),
            succeeded,
            failed,
            results
        );
    }

    private void recordBatchLogHistory(
            List<StampEditData> updates,
            int updateEmployeeId,
            int succeeded,
            int failed) {
        // バッチ処理の結果をログに記録
        logHistoryService.execute(
            4,  // 操作種別: 打刻編集
            3,  // ログレベル
            String.format("Batch edit: %d succeeded, %d failed", succeeded, failed),
            updates.get(0).getEmployeeId(),
            updateEmployeeId,
            Timestamp.valueOf(LocalDateTime.now())
        );
    }
}
```

#### DTO

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BatchEditRequest {
    @NotNull
    @Size(min = 1, max = 100)
    private List<StampEditData> updates;

    @NotNull
    private Integer updateEmployeeId;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BatchEditResponse {
    private boolean success;
    private int totalProcessed;
    private int totalSucceeded;
    private int totalFailed;
    private List<BatchEditResult> results;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BatchEditResult {
    private int index;
    private Integer id;
    private String status;  // "success" | "error"
    private ErrorDetail error;

    public static BatchEditResult success(int index, Integer id) {
        return new BatchEditResult(index, id, "success", null);
    }

    public static BatchEditResult error(int index, String code, String message) {
        return new BatchEditResult(index, null, "error", new ErrorDetail(code, message));
    }
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorDetail {
    private String code;
    private String message;
}
```

### フロントエンド実装例

```typescript
// frontend/src/features/stampHistory/api/index.ts

export async function batchEditStampHistory(
  updates: StampEditData[],
  updateEmployeeId: number
): Promise<BatchEditResponse> {
  const response = await apiClient.post<BatchEditResponse>('/api/stamps/batch', {
    updates,
    updateEmployeeId,
  });
  return response.data;
}

// frontend/src/features/stampHistory/hooks/useStampHistoryExport.ts

async function processBatchEdits(editList: StampEditData[]): Promise<void> {
  // Before: 1つずつAPIコール
  // for (const item of editList) {
  //   await editStampEntry(item);
  // }

  // After: 1回のバッチAPIコール
  const response = await batchEditStampHistory(editList, currentEmployeeId);

  if (!response.success) {
    // 失敗した項目のみ再試行 or ユーザーに通知
    const failedItems = response.results
      .filter(r => r.status === 'error')
      .map(r => editList[r.index]);

    console.error(`${response.totalFailed} items failed:`, failedItems);
  }
}
```

## メリット

### パフォーマンス

- **ネットワークリクエスト数**: N回 → 1回
- **データベーストランザクション**: N回 → 1回
- **認証検証**: N回 → 1回
- **レスポンスタイム**: 大幅に短縮（特にN > 10の場合）

### トランザクションの一貫性

- 全ての更新が1つのトランザクション内で処理
- ロールバックが可能（オプション）
- データベースレベルでの一貫性が保証

### エラーハンドリング

- 個別のエラーを統一的に管理
- 部分的な成功/失敗を明確に報告
- リトライロジックの簡素化

### スケーラビリティ

- サーバーリソースの効率的な利用
- データベースコネクションプールの最適化
- 将来的な並列処理の実装が容易

## 実装優先度

**優先度: 中**

### 理由

- 現在のフロントエンド実装は動作しているが、パフォーマンス改善の余地あり
- バッチ編集の頻度が高い場合は優先度を上げるべき
- API変更が必要なため、フロントエンド・バックエンド両方の修正が必要

### 実装タイミング

以下のタイミングで実装を検討：

1. **大量データ編集の要件が発生した場合**
   - 月次締め処理など、一度に大量の打刻を編集する必要がある場合

2. **パフォーマンス問題が顕在化した場合**
   - ユーザーから編集処理が遅いとフィードバックがあった場合

3. **API v2 のリリース時**
   - 既存APIとの互換性を保ちながら新APIを追加

## 移行計画

### フェーズ 1: バックエンド実装

1. バッチエンドポイントの追加
2. 単体テスト・統合テストの作成
3. OpenAPI仕様の更新

### フェーズ 2: フロントエンド実装

1. バッチAPIクライアントの追加
2. バッチ処理ロジックの実装
3. エラーハンドリングの改善
4. E2Eテストの作成

### フェーズ 3: 段階的ロールアウト

1. 一部のユーザーでベータテスト
2. パフォーマンスモニタリング
3. 全ユーザーへの展開

### フェーズ 4: 旧APIの廃止

1. 旧APIを非推奨に設定
2. 移行期間（3-6ヶ月）
3. 旧APIの削除

## 参考資料

- [REST API Design: Batch Operations](https://restfulapi.net/rest-api-design-best-practices/)
- [Spring Boot Batch Processing](https://spring.io/guides/gs/batch-processing/)
- [HTTP Status Code 207 (Multi-Status)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207)

## 変更履歴

| 日付 | 変更者 | 変更内容 |
|------|--------|----------|
| 2025-10-14 | Claude | 初版作成 |
