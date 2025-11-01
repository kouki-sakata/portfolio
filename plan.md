# 勤怠履歴API 整備計画

## 現状整理
- フロントエンドは `/api/stamp-history` の取得とともに、`PUT /api/stamps/{id}`・`DELETE /api/stamps/{id}` を呼び出している。
- バックエンドには `GET /api/stamp-history` のみ存在し、更新・削除エンドポイントが未実装のため 404 が発生している。
- `StampEditService` および `StampDeleteService` が既に存在するが、REST 向けの薄いアダプタ層が不足している。

## 実装タスク
1. **RESTコントローラ追加**
   - `@RestController` で `/api/stamps/{id}` 系をハンドルする `StampRestController` (仮称) を新設。
   - `PUT /api/stamps/{id}`: `UpdateStampRequest` DTO を受け取り `StampEditService` を単一更新用に呼び出す。
   - `DELETE /api/stamps/{id}`: ID パラメータから `StampDeleteService` を呼び出し、対象打刻を削除する。
   - Service 既存メソッドが複数件向けであれば、単件向けラッパーメソッドを追加してから呼び出す。

2. **DTO / マッパー整備**
   - フロント送信ペイロードと整合する `UpdateStampRequest` / `DeleteStampRequest` を backend 側にも定義。
   - 必要に応じて `StampEditService` 入力形式（`Map` ベース）から DTO 変換ユーティリティを作成。

3. **Spring Security 設定更新**
   - `/api/stamp/**` を認可対象として許可ルールに追加し、既存の `/api/home/**` との整合を確認。
   - CSRF 設定とロール要件を確認（従業員権限で利用できる想定）。

4. **OpenAPI と生成型更新**
   - `api.yaml`（存在する場合）へ新エンドポイントを追記し、`npm run generate:api --prefix frontend` を再実行。
   - `frontend/src/schemas/api.ts`・`frontend/src/types/types.gen.ts` など自動生成ファイルを更新。

5. **フロントエンド修正**
   - `updateStamp` が `{ data: { ... } }` を送信しているため、バックエンドの受け口に合わせてボディ形式を統一。
   - 必要なら `stampApi.test.ts` のモック呼び出しと期待値を調整。

6. **テスト・検証**
   - `./gradlew test` でバックエンドテストを実行。必要なら `@WebMvcTest` を追加。
   - `npm run test --prefix frontend` でフロントユニットテスト。
   - 手動または E2E で勤怠履歴画面の更新・削除フローを確認。

## 依存・検討事項
- `StampDeleteService` の現在のインターフェースが単件削除に適さない場合、サービス層を拡張する必要がある。
- 更新・削除操作の権限が一般従業員に許可されているかをプロダクト側と確認。
- 夜勤跨ぎや退勤未登録など特殊ケースのバリデーション要件を明確化。

## 完了条件
- `/api/stamps/{id}` の PUT/DELETE が 2xx を返し、フロントの勤怠履歴画面で更新・削除が正常に完了する。
- テストがグリーンで、OpenAPI/ドキュメントの齟齬が解消されている。
