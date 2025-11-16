# Steering Documents Changelog

## 2025-11-16 (Update 38)

### Updated Documents
- `product.md` - 勤怠申請ワークフローを「完了済み」に移行、OpenAPIギャップ警告を削除
- `tech.md` - Stamp Request OpenAPI/契約ギャップセクションを削除、実装完了を反映

### Code Drift Resolution
- ✅ **勤怠申請ワークフロー実装完了（PR #123, 2025-11-16）**
  - OpenAPI定義: `/api/stamp-requests/**` 全9エンドポイント + 10種類のスキーマ定義完了
  - 型生成: TypeScript型とZodスキーマが `npm run generate:api` で正常生成済み
  - バックエンド: StampRequestRestController + V7/V8マイグレーション + サービス層完備
  - フロントエンド: 20+コンポーネント + 統合テスト556行完備
  - Update 37で警告されていた「OpenAPI未追加」問題は完全解消

### Impact
- ステアリングファイルが最新のコードベース（PR #123マージ後）と完全同期
- 新規メンバーが勤怠申請ワークフローの完全実装状況を正確に把握可能
- 「実装中」として誤認されるリスクを排除、本番デプロイ準備完了の正確な認識を促進

### Note
Update 37（2025-11-15）時点では実装中だった勤怠申請ワークフローが、翌日のPR #123マージにより完全実装済みとなったため、ステアリングを即日更新。残タスクはPlaywright E2Eテスト（Task 8）のみ。

---

## 2025-11-15 (Update 37)

### Updated Documents
- `product.md` - 勤怠申請ワークフローを「E2E実装済み」として整理し、`StampRequestRestController`/サービス群/V7マイグレーションのパターンと OpenAPI 同期ギャップを記録。
- `tech.md` - Stamp Request API セクションを追加し、`StampRequestStore`・MyBatis・MockMvc の連携、V7 インデックスを技術指針に反映。ギャップ部分を「OpenAPI/契約同期」に更新。
- `structure.md` - service/dto/mapper の構造に StampRequest 系クラスを追加し、ワークフロー節をバックエンド+フロント接続の両面で再記述。frontend ツリーの `stampRequestWorkflow` コメントを最新化。

### Code Drift Warnings
- ⚠️ `openapi/openapi.yaml` に `/api/stamp-requests/**` のパス/スキーマが未追加のため、`npm run generate:api-types`/`generate:zod-schemas` では型が生成されず `features/stampRequestWorkflow/types.ts` が手書きのまま。OpenAPI追記→型再生成→contract test 追従まで spec 化が必要。

### Impact
- Steering が実際の Spring Boot + Flyway 実装（V7）と整合し、モバイル勤怠申請フローの API/DB/キャッシュパターンを新規メンバーが把握できる。
- Drift 警告が契約未整備によるリリースリスク（TypeScript 型の乖離）を明示し、次の spec タスクへ誘導する。

## 2025-11-15 (Update 36)

### Updated Documents
- `product.md` - 勤怠申請ワークフローUIのパターンを新規追加し、プロフィール勤怠統計APIを「完了済み」に更新。開発中セクションで `/stamp-requests` API/DB 未整備の警告を掲示。
- `tech.md` - フロントエンド設計パターンに打刻申請ワークフロー（フィルタ、⌘K、Zod、React Queryキャッシュ）を追加。バックエンド節に `/stamp-requests` API 未実装ギャップを明記。
- `structure.md` - features/ツリーへ `stampRequestWorkflow/` を追加し、`ProfileAppService#getProfileStatistics` を唯一の統計ファサードとして記載。打刻申請ワークフロー構造とバックエンド不足を整理。
- `CHANGELOG.md` - Update 36 を記録。

### Code Drift Warnings
- ⚠️ **打刻申請ワークフロー（UI先行 / API未実装）**
  - Frontend: `frontend/src/app/providers/AppProviders.tsx` が `/stamp-requests/my` を公開し、`stampRequestWorkflow/api/stampRequestApi.ts` から `/stamp-requests` POST/GET/cancel を実行、`RequestCorrectionModal`/`CancellationDialog` が React Query 連動で運用開始済み。
  - Backend: `rg "stamp-requests" src/main/java src/main/resources/db/migration openapi -n` が0件で、Controller/Service/Flyway/OpenAPI が全て未作成。Plan.md（Week1-3）に設計メモのみ存在し、UIを本番有効化すると 404 が発生するため、 spec 起票→API実装→Flyway 追加の順で差分解消が必要。

### Impact
- プロフィール統計に関する過去のドリフト（API未配線/サービス重複）は完全に解消済みであることを steering 上で明確化し、新メンバーが最新アーキテクチャを把握しやすくなった。
- 打刻申請ワークフローの UI/UX パターンを steering に取り込み、React Query キャッシュ戦略やモーダル設計を再利用できる形で残した。
- `/stamp-requests` のサーバー実装ギャップを全ファイルで強調したことで、コードレビューや spec タスク化の優先度を即座に判断できる。

### Note
Stamp Request Workflow の UI は `features/stampHistory` と密結合しながら完成している一方、バックエンド/API/DB/仕様は Plan.md に留まっている。 steering 上でも UI 先行であることとギャップ箇所（REST、Flyway、OpenAPI）を明文化し、AI-DLC の spec タスク化トリガーとして扱えるようにした。

## 2025-11-13 (Update 35)

### Updated Documents
- `tech.md` - JSONB依存削減、パフォーマンス最適化、データベース設計の3セクションを追加、既存セクションを圧縮（233行→179行）
- `structure.md` - プロフィール統計レイヤーのJSONB参照を通常カラム参照に修正
- `CHANGELOG.md` - Update 18-25をアーカイブ化（478行→328行、150行削減）

### Code Drift Resolution
- ✅ **JSONB依存削減（V6マイグレーション）のSteering反映完了**
  - `employee.schedule_start/end/break_minutes` 通常カラム化をtech.mdとstructure.mdに記録
  - `StampHistoryMapper.findMonthlyStatistics` が通常カラム参照に変更済みを明記
  - JSONB活用指針（使用推奨・非推奨ケース）を文書化
- ✅ **パフォーマンス最適化の文書化完了**
  - V4/V5マイグレーションのインデックス戦略（13個+GIN+部分インデックス）を記録
  - N+1クエリ解消パターン（バッチフェッチ、カレンダーテーブル展開）を文書化
  - 100クエリ→1クエリへの最適化実績を記録
- ✅ **データベース設計の文書化完了**
  - Flyway マイグレーション管理（V1-V6の履歴）を整理
  - インデックス設計（B-Tree、GIN、部分インデックス）を文書化
  - PostgreSQL 16 + MyBatis + Repository ハイブリッドアーキテクチャを記録

### Key Changes
- **tech.md の大幅な圧縮と再構成**（233行→179行、54行削減）
  - フロントエンド設計パターン: 72行→16行（56行削減、箇条書き化で要点を保持）
  - サービス層・API層・テスト戦略: 計45行削減（詳細説明を簡略化）
  - 新規セクション追加: 62行（JSONB戦略13行、パフォーマンス25行、DB設計24行）
  - 最終結果: 300行以内の目標を大幅に達成（179行）

- **CHANGELOG.md のメンテナンス**（478行→328行、150行削減）
  - Update 18-25をアーカイブ化（2025-10-04〜2025-10-17の履歴）
  - 古いエントリの参照範囲を Update 1-17 → Update 1-25 に拡大
  - 推奨サイズ（300行程度）に近づける

### Impact
- **コードドリフトの完全解消**: V6マイグレーション（PR #119）の JSONB削減がSteeringに反映され、新規開発者が正しいパターンを参照可能に
- **パフォーマンス知見の共有**: インデックス戦略とN+1解消パターンが文書化され、今後の最適化作業の指針が確立
- **データベース設計の可視化**: マイグレーション履歴とインデックス設計が整理され、スキーマ進化の全体像が把握可能に
- **Steeringの保守性向上**: tech.mdが推奨サイズ（200行程度）に収まり、可読性と保守性が向上
- **CHANGELOGの持続可能性**: 定期的なアーカイブ化により、CHANGELOGが肥大化せず適切なサイズを維持

### Technical Achievements
- **Steering圧縮**: tech.mdを300行以内に収めつつ、重要な新規情報（JSONB削減、パフォーマンス、DB設計）を追加
- **コード同期度向上**: Steeringとコードベースの乖離（Code Drift）を解消し、整合性スコアを向上
- **文書化戦略の確立**: 詳細は別ファイル化せず、tech.md内で箇条書き化することで統合性を維持

### Note
V6マイグレーション（PR #119、commit 6157041）で完了したJSONB依存削減がSteeringに反映されていなかったコードドリフトを解消。同時に、パフォーマンス最適化（V4/V5マイグレーション）とデータベース設計の知見を文書化し、プロジェクトの技術資産を整理しました。tech.mdは大幅な圧縮により、推奨サイズ（200行程度）を達成し、可読性と保守性が向上しています。

---

## 2025-11-07 (Update 34)

### Updated Documents
- `CHANGELOG.md` - Update 33 で報告されたコードドリフトの解消を記録

### Code Drift Resolution
- ✅ `/api/profile/me/statistics` エンドポイント実装完了
  - コミット 2ce033c, 309a515 で `UserProfileRestController` に GET マッピング追加（117-122行目）
- ✅ `ProfileAttendanceStatisticsService` 削除完了
  - 重複ロジックを `ProfileAppService#getProfileStatistics` に統合
  - 単一集計実装への移行達成
- ✅ Recharts 3.3.0 統合完了
  - 統計ビジュアライゼーション機能本稼働
  - `ProfileSummaryCard` と `ProfileMonthlyDetailCard` で正常表示中

### Note
Update 33（2025-11-06）で懸念されていたプロフィール勤怠統計のAPIギャップとサービス重複問題は、
同日および翌日のコミット群（c109137, 206655c, 66987c6, 2ce033c, 309a515 等）で完全解決済み。
コードベースとステアリングの整合性は良好。

---

## 2025-11-06 (Update 33)

### Updated Documents
- `product.md` - プロフィール勤怠統計UIの進捗と未公開APIを記録
- `tech.md` - Rechartsビジュアライゼーションと集計フローを追記
- `structure.md` - プロフィール統計レイヤーとサービス構成、ドリフト注意点を追加

### Key Changes
- フロントエンドの `ProfileSummaryCard` / `ProfileMonthlyDetailCard` と `useProfileStatisticsQuery` による勤怠分析パターンを明文化。
- バックエンドの `ProfileAppService#getProfileStatistics` と `StampHistoryMapper.findMonthlyStatistics` を紐付け、JSONB勤務予定を利用した統計生成の意図を記録。
- プロフィール勤怠統計 UI が実装済みである一方、APIエンドポイントが未配線である現状をステアリングに残し、ギャップの可視化を実施。

### Code Drift Warnings
- `/profile/me/statistics` をフェッチする `fetchProfileStatistics` / `ProfileRoute` 実装に対し、`UserProfileRestController` に GET マッピングが存在せず 404 になる。`ProfileAppService#getProfileStatistics` へのルーティング追加が必要。
- `ProfileAttendanceStatisticsService` が従来ロジックを保持し、`ProfileAppService` 側の新集計と重複している。二重定義による値不一致リスクがあるため統合方針を決めること。

### Recommendations
- `/api/profile/me/statistics` を `ProfileAppService#getProfileStatistics` 経由で公開し、React Query の統計取得と整合させる。
- 既存の `ProfileAttendanceStatisticsService` を統合または廃止し、単一の集計実装に集約した上で OpenAPI を更新する。

## 2025-11-05 (Update 32)

### Updated Documents
- `product.md` - プロフィール管理機能の完全実装を追記
- `tech.md` - DDDアーキテクチャとProfileのView Model変換パターンを追加
- `structure.md` - Profile機能のDDD構造を反映
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **プロフィール管理機能の完全実装**
  - 2025-11-03時点でプロフィール管理機能（PR #98）が完全実装済みであることを文書化
  - REST API、フロントエンド、テストの全実装が完了（8コンポーネント全てにテスト完備）
  - DDD（Domain-Driven Design）アーキテクチャの初導入事例として記録

- **DDDアプローチの段階的導入を明文化**
  - **Application Service層**: `ProfileAppService`によるユースケースオーケストレーション
  - **Domain Model層**: `service/profile/model/`配下にAggregate、Value Objects、Command/Query Objectsを配置
  - **Repository層**: `ProfileMetadataRepository`がJdbcTemplate経由でPostgreSQL JSONBを直接操作（MyBatis不使用）
  - **アクセス制御**: `enforceAccess`メソッドで自己アクセス/管理者権限を検証
  - **監査ログ**: `ProfileAuditService`で閲覧・更新イベントを記録

- **アーキテクチャ進化の二重性を記録**
  - 既存機能（News, StampHistory）: MyBatis + 従来型Serviceパターンを継続
  - Profile機能: DDD + Repository + Application Serviceの新しいアプローチ
  - DDDを採用すべきタイミングの判断基準を明記（複雑なビジネスルール、柔軟なデータ構造等）

- **ProfileのView Model変換パターンの確立**
  - 複数変換関数パターン: 用途別に3つの変換関数（Overview/Form/Activity）を提供
  - 型安全な正規化: Nullable値のデフォルト処理（`toNullable`, `toWorkStyle`, `toStatus`）
  - Enum制約: `workStyle`, `status`など限定値をTypeScript型で保証
  - スナップショット正規化: 監査ログのbefore/afterスナップショットをnull-safe変換

- **ドメインモデル配置の新パターン**
  - `service/profile/model/`配下にドメインモデルを集約（従来の`entity/`や`dto/`とは異なる役割）
  - 9つのドメインモデル: Aggregate, Value Objects, Command/Query Objects, Change Tracking, Page Objects
  - DocumentパターンでJSONBスキーマを型安全に管理

### Impact
- DDD実装の参照モデルとして、今後の複雑な機能実装時の設計指針が確立
- MyBatisとRepositoryパターンの使い分け基準が明確化され、適切なアーキテクチャ選択が可能に
- JSONB活用のドキュメントストアパターンが実証され、柔軟なスキーマ要件への対応手法を獲得
- View Model変換パターンが複数変換関数パターンに進化し、画面種別ごとの最適化が可能に
- アーキテクチャの段階的移行戦略が文書化され、レガシー/モダンパターンの共存が正当化

### Code Drift Warnings
なし。コードベースと steering の内容は一致しています。

### Note
プロフィール管理機能は2025-11-03のPR #98でマージ完了。本更新（Update 32）はProfile機能のDDDアーキテクチャとアーキテクチャ進化戦略を詳細化し、今後の複雑な機能開発における設計指針を確立しました。既存機能は従来型パターンを維持し、新規の複雑な機能にはDDDアプローチを検討するという二重アーキテクチャの共存戦略を明文化しています。

---

## 2025-11-03 (Update 31)

### Updated Documents
- `product.md` - ホーム打刻クロック機能と実装状況を追記
- `tech.md` - ホーム時刻同期、AdminGuard、打刻更新APIの技術指針を追加
- `structure.md` - AdminGuardの配置とホーム時刻同期パターンを反映
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **ホーム打刻クロックの標準化**
  - `useHomeClock` と `HomeClockPanel` によるJST固定タイムスタンプ供給とフェールオーバー処理を記録
  - StampCardの `captureTimestamp` 連携でUI表示とAPI送信の時刻を同期するパターンを明文化
- **ルートガード/アクセス制御の前段強化**
  - `shared/components/guards/AdminGuard` の役割を構造・技術両面で追加し、ニュース/従業員/ログ画面の前段保護を指針化
- **打刻更新APIの再編**
  - `/api/stamps/{id}` PUT/DELETE の導線を技術指針に反映し、既存値フォールバックと `StampEditService` オーケストレーションの整合性を説明
- **ドキュメントドリフトの修正**
  - 廃止済みの `InterceptableHttpClient` 記述を削除し、`defaultHttpClient` のエラー正規化を明示

### Impact
- フロントとバックで共有する時刻処理とアクセス制御の基盤が明文化され、新規機能が既存パターンに揃えやすくなった
- 打刻APIの単体更新／削除に関する指針が追加され、今後のステップ実装とテスト設計が簡素化

### Code Drift Warnings
- なし

### Note
- ホーム打刻クロックは 2025-11-03 commit (`feat-home-clock-display`) を反映。AdminGuard導入は 2025-10-31 の `b2c6e82` を参照。

## 2025-10-28 (Update 30)

### Updated Documents
- `product.md` - お知らせ管理機能の完了状況を最終化、実装詳細を追記
- `tech.md` - お知らせ管理の確立されたパターンを詳細化
- `structure.md` - お知らせ機能の完全構造を反映
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **お知らせ管理機能の完了宣言**
  - 2025-10-28時点でお知らせ管理機能が完全実装済みであることを明確化
  - REST API、フロントエンド、テストの全実装が完了
  - リッチテキストエディタは将来機能として計画に移動（現在はTextarea実装）

- **ロールベースアクセス制御の明文化**
  - `@PreAuthorize("hasRole('ADMIN')")`による管理者専用エンドポイント
  - EMPLOYEE権限での閲覧のみアクセス（`/api/news/published`）
  - SecurityUtil経由の操作者ID取得パターン

- **フロントエンドパターンの詳細化**
  - View Model変換パターン: 型拡張（`NewsViewModel = NewsResponse & {...}`）による型安全性の保持を追記
  - TanStack Table統合: 共通DataTableコンポーネントの再利用パターンを明記
  - 選択状態管理: TanStack TableのRowSelectionStateとアプリケーション側ID配列の双方向同期パターンを詳細化
  - React Query楽観的更新: バルク操作の部分成功処理とトースト通知を追記

- **バックエンドパターンの詳細化**
  - Controller層での複数専門サービスの組み立てパターン（NewsRestController例）
  - ファサードパターンの役割明確化（読み取り専用の統合ポイント）
  - バルクAPIエラー戦略: ResponseStatusExceptionによるHTTPステータス制御を追記
  - 専門サービスの命名規則（NewsManage*Service）と単一責任の徹底

- **構造文書の詳細化**
  - news/components配下の全コンポーネントを列挙（8コンポーネント）
  - サービス層の専門サービス5つを明記（Registration/Release/Deletion/Bulk*）
  - SOLID原則に基づくレイヤー責務の明確化

### Impact
- お知らせ管理機能が完全実装済みであることが明確になり、類似CRUD機能実装時の完全な参照モデルとして機能
- ロールベースアクセス制御の実装パターンが確立され、他の管理機能への適用が容易化
- View Model変換、TanStack Table統合、選択状態管理の実装パターンが詳細化され、再利用性が向上
- Controller層でのサービス組み立てパターンが明文化され、SOLID原則に基づく設計指針が明確化
- E2Eテストがスキップ状態であることが明記され、今後のテスト拡充タスクが可視化

### Code Drift Warnings
なし。コードベースと steering の内容は一致しています。

### Note
お知らせ管理機能は2025-10-17のUpdate 25/27で初回文書化、2025-10-26のUpdate 29でUI改善パターンを追記済み。本更新（Update 30）は機能完了宣言と実装パターンの最終詳細化を行い、リッチテキストエディタなど未実装の要素を今後の計画へ明確に分離しました。

---

## 2025-10-26 (Update 29)

### Updated Documents
- `tech.md` - View Model変換パターンとTanStack Table統合パターンを追加
- `structure.md` - news機能のlib/とカラムフック構造を詳細化
- `product.md` - お知らせ管理UI完成版とE2Eテスト状況を更新
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **View Model変換パターンの確立**
  - APIレスポンスからUI専用モデルへの変換レイヤー（`NewsViewModel`）
  - コンテンツ解析による派生データ生成（タイトル、カテゴリの自動抽出）
  - `lib/`ディレクトリによるビジネスロジック分離パターン
  - カテゴリマッピング（`【カテゴリ】`パターン → Badge variant）

- **TanStack Table統合パターンの文書化**
  - カラム定義のカスタムフック化（`useNewsColumns`）でUI層からロジック分離
  - イベント伝播制御によるテーブル行クリックとチェックボックス/ボタンの分離
  - レスポンシブ対応パターン（モバイル/デスクトップ切り替え）
  - 複数ソート・フィルタ機能統合（`DataTableColumnHeader`）

- **お知らせ管理UI完成版の構造反映**
  - テーブルベース管理画面へのリファクタリング完了（カードグリッド→Data Table）
  - 公開中お知らせ専用セクション（`PublishedNewsGrid`）の追加
  - Playwright E2Eテスト完備（`news-management.spec.ts`）

### Impact
- View Model変換パターンが確立され、API型とUI型の責務分離が明確化。他機能でも再利用可能
- TanStack Table統合の標準パターンが文書化され、データ密度の高い管理画面実装の参照モデルとなる
- lib/ディレクトリ配置方針が明確化され、ビジネスロジックの再利用性とテスタビリティが向上
- お知らせ管理機能の全体構造が完成し、類似CRUD機能実装時の完全なリファレンスとして機能

### Note
お知らせ管理機能は 2025-10-17 の Update 25/27 でバックエンド実装とReact Queryパターンが文書化済み。本更新（Update 29）はその後のUI改善（テーブル化、View Model導入）により新たに確立されたフロントエンド設計パターンを追記するものです。

---

## 2025-10-20 (Update 28)

### Updated Documents
- `product.md` - Feature Flag 基盤とグローバルエラーハンドリングの実装状況を追記
- `tech.md` - Feature Flag UI トグル、エラーイベント連携、Repository 抽象化を反映
- `structure.md` - フロント共有基盤と `/api/public` / デバッグAPI の構造指針を更新
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **Feature Flag UI基盤の文書化**
  - `/api/public/feature-flags` と `FeatureFlagService` によるプロファイル別フラグ提供を整理
  - `FeatureFlagProvider` + UI Wrapper で shadcn/ui を安全にトグルするパターンを明文化
- **グローバルエラーハンドリング指針**
  - `GlobalErrorHandler`・`authEvents`・QueryClient エラーフック連携による 401/403 処理と Toast 通知を記録
  - Route Loader とリダイレクト戦略を合わせて記述し、プリフェッチと権限制御の流れを統一
- **共有リポジトリ/ユーティリティ構造**
  - `shared/repositories` の IHttpClient アダプターと Zod 検証パターンを追加
  - 共有ディレクトリ（contexts, error-handling, components/layout など）の役割と再利用方針を整理

### Impact
- Feature Flag に依存する UI/UX 変更を安全に展開するための手順が明確化され、段階的リリース時の判断基準が整備された。
- エラー通知とセッション制御の統一パターンが明文化され、複数機能で一貫した UX を保ちながら保守できる。
- 共有リポジトリ層の抽象化が文書化され、追加機能でも DIP を守ったデータ取得実装を再利用しやすくなった。

### Note
Feature Flag 実装とエラーハンドリング改善は 2025-10-20 時点の main ブランチを反映。既存セクションは保持しつつ加筆のみで差分を可視化している。

## 2025-10-17 (Update 27)

### Updated Documents
- `tech.md` - フロントエンド設計パターン、バルクAPIエラー戦略、MyBatis実装パターンを追加
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **フロントエンド設計パターンの文書化**
  - 選択状態管理の分離パターン（`useNewsSelection`）
    - Set型による効率的なID管理（O(1)検索・追加・削除）
    - バルク操作後の選択同期（失敗IDのみ保持）
    - チェックボックス3状態管理（all/indeterminate/none）
  - React Query楽観的更新パターン
    - `onMutate`によるキャッシュ直接更新（即時UI反映）
    - `onError`によるロールバック（エラー時整合性保証）
    - `onSettled`によるサーバー再検証（最終整合性確保）
    - 複数キャッシュキー同時無効化パターン

- **バルクAPIエラー戦略の詳細化**
  - `extractRootCause`メソッドによるネストされた例外の根本原因抽出
  - バリデーションエラー（IllegalArgumentException）とシステムエラーの分離処理
  - 部分成功時のログ出力（成功件数/失敗件数の詳細記録）

- **MyBatis実装パターンの明確化**
  - 動的SQL使い分け基準の確立
    - アノテーションベース: シンプルなクエリ（`@Delete` + `<script>`、`@Select` + `<foreach>`）
    - XML定義: 複雑な更新ロジック（`bulkUpdate*`、条件分岐、複数カラム更新）
  - ResultMap定義によるsnake_case→camelCase変換の一元管理

### Impact
- フロントエンド設計の再利用可能パターンが確立され、他機能への展開が容易化
- React Query楽観的更新の実装指針が明確化され、UX向上の一貫性を実現
- バルクAPIエラーハンドリングの詳細戦略が文書化され、保守性と可読性が向上
- MyBatis動的SQL使い分け基準が確立され、データベース操作の最適化指針を提供

### Note
news-management機能は既に完了済み（Update 25）。本更新はコードベース検証で発見された汎用パターンを文書化し、ステアリングとコードの乖離を解消する作業です。これらのパターンはニュース管理専用ではなく、他機能でも再利用可能な設計パターンとして抽出されました。

---

## 2025-10-17 (Update 26)

### Updated Documents
- `product.md` - stampHistory機能の完全実装を反映
- `tech.md` - 打刻サブコンポーネントパターンとMap型レスポンス変換を追記
- `structure.md` - features/stampHistory配下の詳細構造とlibディレクトリパターンを明記
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **stampHistory機能の文書化完了**
  - REST API: `GET /api/stamp-history`（年月指定履歴取得）、`PUT /api/stamp/{id}`（編集）、`DELETE /api/stamp/{id}`（削除）
  - CSV/TSV/Excel-CSVエクスポート機能（Shift-JIS with BOM対応、バッチ処理最大1000件）
  - 月次統計計算（totalWorkingDays、averageWorkingHours等）
  - カレンダー形式表示、編集・削除ダイアログ

- **サービス層の細分化パターン**
  - `service/stamp/`サブディレクトリでSOLID原則に基づく専門コンポーネント分離
  - `StampHistoryPersistence`: 永続化専用、`OutTimeAdjuster`: 退勤時刻調整
  - `TimestampConverter`: 型変換、`StampFormDataExtractor`: データ抽出
  - オーケストレーターパターン（`StampEditService`）による全体フロー制御

- **フロントエンドlibディレクトリパターン**
  - `lib/`配下にビジネスロジック分離（batch-processor、csv-generator、blob-downloader、summary）
  - カスタムフック `useStampHistoryExport`でエクスポート機能統合
  - 大量データ対応（バッチ処理、進捗表示）

- **Map型レスポンス変換パターン**
  - Service層: `List<Map<String, Object>>`でカレンダー形式データ返却（全日付を含む）
  - Controller層: record DTO（`StampHistoryEntryResponse`）に型安全変換
  - ObjectMapperによる柔軟なデータ変換

### Impact
- 打刻履歴管理機能のパターンが文書化され、類似機能（勤怠承認等）実装時の参照モデルとなる
- サービス層の細分化パターンが確立され、複雑なビジネスロジックの保守性向上指針を提供
- libディレクトリによるビジネスロジック分離パターンの実例が追加され、フロントエンド設計指針が明確化
- CSV/TSVエクスポート機能の実装パターンが共有され、他機能への展開が容易化

### Note
stampHistory機能は既に実装済みであり、本更新はコードベースと既存パターンの乖離を解消する文書化作業です。打刻機能の二重送信防止、夜勤対応等の既存実装も含めて包括的に記録しました。

---


*古いエントリ（Update 1-25）はgit履歴で参照可能*

---
*Last Updated: 2025-11-13*
*Inclusion Mode: Always Included*
