# 申請ワークフロー実装計画

## 前提と方針
- **テストデータ**: Flyway の repeatable (`R__seed_stamp_requests.sql`) で投入し、`application-test.yml` では `spring.flyway.locations=classpath:db/migration,classpath:db/seed/test` を読み込む。本番 (`application-prod.yml`) では seed ディレクトリを含めない運用を README/Runbook に明記。
- **権限制御**: `useAuth()`/`ProtectedRoute` でロール (ROLE_ADMIN/ROLE_USER) を提供し、UI/ルーティング/API の全レイヤーで 403 を統一処理。
- **通知**: ドメインイベント→`NotificationService`→afterCommit で挿入。未読 API＋バッチ削除を Week3 に実装。
- **品質目標**: TDD、統合テストカバレッジ 80% 目標（未達でもエラーにしない）。

## Week1: バックエンド (6日)
### Day1-2: DB 設計 & Flyway
1. `stamp_requests` / `notifications` テーブルをカラム定義型で作成（元値カラム、重複防止 UNIQUE、CHECK 制約、監査列）。
2. Repeatable seed (`R__seed_stamp_requests.sql`) を追加し、ID/日付/ロールの整理表を docs に追記。
3. `application-test.yml` で `spring.flyway.locations=classpath:db/migration,classpath:db/seed/test` を設定し、`application-prod.yml` では seed パスを含めないことを確認。

### Day3: Entity & Mapper (TDD)
1. `StampRequest`/`Notification` エンティティと Request/Response DTO を定義（Entity は公開しない）。
2. `StampRequestMapperTest` 等で CRUD・フィルタ・バルク INSERT（通知）を作成し、MyBatis XML を実装。
3. JSONB 排除後の複合条件クエリや UNIQUE 制約違反ケースをテストに追加。

### Day4: Service 層 (TDD)
1. `StampRequestService` で申請作成/承認/却下/取り下げ/重複チェックを実装し、`@Transactional` で打刻更新と状態遷移を一括管理。
2. `NotificationService` を afterCommit で実行。取り下げ時は通知不要と明記。
3. Forbidden/BadRequest 例外メッセージを国際化またはメッセージ定数化し、単体テストを 85% 以上に。

### Day5-6: REST + 通知 API
1. `StampRequestRestController`/`NotificationRestController` を MockMvc TDD（作成/一覧/承認/却下/取消、通知取得/未読数/既読化/全既読）。承認 API には `@PreAuthorize("hasAuthority('ADMIN')")`、他 API にも `@PreAuthorize` を適用。
2. OpenAPI にエンドポイントと 403/422 応答を追記し、`SecurityUtil` から社員 ID を取得する方法を記述。
3. Integration テストで seed データを用いたハッピーパス＋エラーパス（USER が承認 API にアクセスして 403 になるケースを含む）を網羅し、jacoco 80% 近辺まで確認。

## Week2: フロントエンド (5日)
### Day6-7: 申請起票 UI
1. `useAuth()` で `currentUser.role` を取得、`ProtectedRoute({ roles: ['ADMIN'] })` を実装。
2. 勤怠画面にロール別ボタンを配置（USER→申請モーダルのみ、ADMIN も原則申請経由に統一し、例外運用の可否を Week1 終了時までにプロダクト側と確定）。
3. `frontend/src/features/stampRequests/` 配下に API/hooks/components を追加し、フォーム・バリデーション・403 トーストを含む単体テストを作成。

### Day8: 申請一覧ページ
1. `/requests` を USER 専用に実装（ステータスフィルタ、取消アクション、React Query キャッシュ操作）。
2. `RequestCard` を Storybook でレビューし、Rejected 表示/理由表示を確認。

### Day9-10: 承認管理ページ
1. `/admin/approvals` を ADMIN 専用に実装（テーブル、承認/却下、Reject ダイアログ）。
2. Nav/Menu から ADMIN 以外をガード、API 403 を UI で捕捉。
3. Hooks (`usePendingRequests` など) を分離し、操作後に `invalidateQueries` で反映。

## Week3: 通知 & 統合 (2日)
### Day11: 通知ベル & クリーンアップ
1. `NotificationBell` をヘッダーへ追加し、未読カウントポーリング（60s）と `markAsRead` を実装。
2. 通知一覧（ドロップダウン or `/notifications`）で 50 件上限・無限スクロール準備。
3. `@Scheduled` で既読 30 日超を削除するジョブを作成（保持期間は設定ファイル化）、Mapper/Service テストを追加。

### Day12: 統合 & カバレッジ
1. `./gradlew test jacocoTestReport` と `npm run test --prefix frontend` で結果を確認し、必要なら追加テスト。
2. README/開発者ガイドに seed 運用、権限制御仕様、通知ライフサイクル、テスト手順を追記。
3. 一般ユーザー/管理者/通知フローの UAT を実施し、残タスクを洗い出して完了報告。
