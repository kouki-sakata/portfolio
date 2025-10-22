# Option1: axiosClient統一 実装規模調査（2025-10-22）

## 現状整理
- 旧`frontend/src/shared/api/httpClient.ts`（今回廃止）が`fetch`ベースでCSRFトークンをCookieから直接取得しており、クロスオリジン環境で失敗していた。
- `frontend/src/shared/api/axiosClient.ts`にはCSRFレスポンスヘッダーをメモリ保持するインターセプターが実装済みで、403問題を解消できる。
- 認証・ホーム関連APIは関数レベルで`httpClient`を直接使用しており、同じ挙動を踏襲するリポジトリ層（`frontend/src/shared/repositories/httpClientAdapter.ts`）経由でも利用されている。

## 影響範囲サマリ
### APIラッパー関数
- 認証: `frontend/src/features/auth/api/login.ts`, `frontend/src/features/auth/api/logout.ts`, `frontend/src/features/auth/api/session.ts`, `frontend/src/features/auth/api/refresh.ts`（存在確認済み）
- ホーム: `frontend/src/features/home/api/homeDashboard.ts`, `frontend/src/features/home/api/stamp.ts`
- これらを`axiosClient`の`api`ヘルパーへ切り替える必要がある。

### リポジトリ層
- `frontend/src/shared/repositories/httpClientAdapter.ts`およびこれを利用する`AuthRepository`, `HomeRepository`が`httpClient`前提。
- 対応案:
  - A案: アダプター実装を`axiosClient`ベースに差し替え、`IHttpClient`インターフェースを維持。
  - B案: リポジトリ実装自体を直接`api`（axios）へ置換し、アダプター/インターフェースを縮退させる。
- 既存のZodバリデーションは流用できるが、リクエストボディのシリアライズ処理（`JSON.stringify`）をaxios任せにするためリファクタが必要。

### エラーハンドリングと型
- `HttpClientError`型に依存する箇所（例: `frontend/src/app/providers/routeLoaders.ts`, `frontend/src/app/config/error-interceptor.ts`, `frontend/src/features/home/hooks/useStamp.ts`, `frontend/src/features/home/hooks/useStamp.test.tsx`）が多数存在。
- axios側は`ApiError`（`frontend/src/shared/api/errors/ApiError.ts`）を返すため、型とエラーハンドリングロジックの呼応修正が必須。
- グローバルイベント`authEvents`とReact Queryエラーハンドリングに影響が及ぶため、401/403処理を`ApiError`ベースに置き換える必要がある。

### テスト
- `HttpClientError`をモックしている単体テスト（特に`useStamp`関連）を`ApiError`もしくはaxiosエラー相当に差し替え。
- axios向けインテグレーションテスト（`frontend/src/shared/api/__tests__/integration.test.ts`）は既に存在するため流用可能だが、新たにAPIラッパー用のモックを整備するか要検討。

## 変更タスク案
1. `httpClient`利用箇所の棚卸し（rgによる確認済みだが最終レビュー時に再チェック）。
2. `httpClientAdapter`を`axiosClient`ベースにリプレースし、`IHttpClient`契約を保つかどうかを決定。
3. APIラッパー（認証・ホーム）を`api`ヘルパーに置換し、依存モジュールへ新しい戻り値・例外仕様を伝播。
4. `HttpClientError`依存コードの`ApiError`化とハンドリング見直し。
5. 関連テスト・モック更新（Vitest, React Testing Library）。
6. ビルド・リンタ・ユニットテスト・主要React Queryフローの手動確認。

## 想定工数/難易度
- ボリューム: 中〜大（複数層に跨るリファクタ、およびエラー型変更による波及が大きい）
- 工数目安: 1.0〜1.5開発日（調整・レビュー含む）

## リスクと懸念
- エラー型切替時に既存のトースト表示・リダイレクトイベントが期待通り動作しなくなる可能性。
- axiosインターセプターとReact Queryエラーハンドリングの二重処理による副作用（重複トースト等）。
- 新旧クライアントが混在する期間のメンテナンス負担。

## 検証計画
- `npm run lint --prefix frontend` / `npm run test --prefix frontend` / 必要に応じて`npm run test:e2e --prefix frontend`
- 手動確認フロー: ログイン→ホームダッシュボード取得→打刻POSTのクロスオリジン再現

## 未決事項
- `httpClient`モジュール自体を削除するか、axiosラッパーとして再実装するかの判断。
- `IHttpClient`/リポジトリアダプターの存続方針（DIP維持 vs. シンプル化）。
- BEとの調整（CSRFヘッダー名やExposeヘッダー仕様の最終確認）は現状不要だが、フロント刷新時に再確認する余地あり。
