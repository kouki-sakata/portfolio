# Steering Documents Changelog

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

## 2025-10-17 (Update 25)

### Updated Documents
- `product.md` - お知らせ管理バルクAPI実装完了を反映
- `tech.md` - バルクAPI設計パターンとMyBatis動的SQL追加
- `structure.md` - features/news配下のバルク操作関連構造を追記
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- **バルクAPI実装の完了**（お知らせ管理機能の強化）
  - REST API: `POST /api/news/bulk/delete`、`PATCH /api/news/bulk/publish`
  - 部分成功レスポンス設計（`successCount`, `failureCount`, `results[]`）
  - 最大100件の一括処理、事前検証とトランザクション管理
  - 個別の成否とエラーメッセージを返却

- **MyBatis動的SQL拡張**
  - `NewsMapper`: `deleteByIds`、`findExistingIds`、`bulkUpdateReleaseFlagIndividual`
  - `<foreach>`を使った一括操作パターン
  - アノテーションベース動的SQLとXML定義の使い分け

- **フロントエンド選択状態管理**
  - カスタムフック `useNewsSelection`でUI選択ロジックを抽出
  - バルク操作レスポンスの処理とUI同期
  - types/bulk.ts でバルクAPI専用型定義を分離

- **サービス層の拡張**
  - `NewsManageBulkDeletionService`、`NewsManageBulkReleaseService`追加
  - SOLID原則に基づく単一責任分離の継続

### Impact
- 管理者のお知らせ管理作業効率が大幅に向上（一括削除・公開切り替え）
- バルクAPI設計パターンが確立され、他機能への展開可能性が明確化
- MyBatis動的SQL活用パターンが文書化され、データベース操作の最適化指針を提供
- UIカスタムフック分離パターンの実例が追加され、再利用性向上のベストプラクティスを提示

### Note
コミット e7600c1〜4142597 でバルクAPI実装が完了。既存の単一操作APIパターンに加え、部分成功対応のバルク操作パターンが新規追加されました。

---

## 2025-10-16 (Update 24)

### Updated Documents
- `product.md` - お知らせ管理機能完全実装ステータスへ更新
- `tech.md` - バリデーション同期パターンとテスト戦略を明文化
- `structure.md` - news featureの詳細構造とController パターンを追記
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- お知らせ管理機能が完全実装されたことを反映（REST API、UIコンポーネント、テスト完備）
- Bean Validation とZod スキーマの同期パターンを技術指針に追加
- features/news配下のコンポーネント構成（NewsManagementPage、NewsFormModal等）を明文化
- Controller層のForm Bridge パターン（ListForm/NewsManageForm）を構造指針に明記
- テスト戦略に`@WebMvcTest` + MockBeanパターン、MSWモックパターンを追記

### Impact
- フロント/バックのバリデーション同期方法が明確化され、一貫性のある入力検証を実現
- お知らせ機能の実装パターンが確立され、今後の機能追加時の参照モデルとなる
- テストパターンが明文化され、品質保証アプローチが統一される

---

## 2025-10-15 (Update 23)

### Updated Documents
- `product.md` - お知らせ管理REST API完了ステータスを追記
- `tech.md` - Controller層の実装パターンとOpenAPI同期手順を明文化
- `structure.md` - DTOサブパッケージとfeatures/news構成を反映
- `CHANGELOG.md` - 本更新を記録

### Key Changes
- NewsRestControllerの役割と`ListForm`/`NewsManageForm`連携パターンを技術指針に追加
- features/news・logManagementディレクトリの存在と役割を構造指針に明記
- お知らせ管理REST APIとOpenAPI型生成が完了済みであることを製品概要に反映

### Impact
- Controller実装時の権限制御・DTO設計が指針化され、再実装時の迷いを削減
- 新規/既存モジュールの所在が明文化され、機能拡張タスク時の探索コストを低減
- OpenAPI駆動の型同期手順が共有され、フロント/バックの型乖離リスクを軽減

---

## 2025-10-15 (Update 22)

### Updated Documents
- `CHANGELOG.md` - お知らせ管理機能のスキーマ移行完了とテスト戦略改善を記録
- `product.md` - 実装状況を最新化
- `tech.md` - テスト戦略の進化を反映

### Key Changes

#### お知らせ管理機能のスキーマ移行完了（2025-10-10〜15）
- **スキーマ移行の完了**
  - `news`テーブルのcamelCase化（`newsId`, `newsTitle`等）
  - `NewsEntity`、`NewsMapper.xml`の型整合性修正
  - Jackson LocalDateシリアライズ問題の解決（`@JsonFormat`アノテーション追加）
  - ResultMap重複定義の削除とマッピング適用

- **データ整合性の改善**
  - 従業員名の全角スペース→半角スペース統一（commit c58754c）
  - `EmployeeMapper.xml`の名前結合ロジック修正
  - データ表示の一貫性確保

- **テスト戦略の改善**
  - モック削減方針の採用（commit b22543f）
  - 実際のデータベースを使用した統合テストの追加
  - `HomeService03Test`のNullPointerException修正
  - テスト信頼性の向上

### Technical Achievements
- **スキーマ移行**: camelCase統一によるコード可読性向上
- **データ整合性**: 全角/半角混在問題の解決
- **テスト品質**: モック削減による実環境テスト強化

### Impact
- **保守性向上**: 一貫したスキーマ命名規則の確立
- **バグ削減**: データ整合性修正による表示問題の解消
- **テスト信頼性**: 統合テストによる実環境動作保証

### Note
最新のコミット（b22543f〜e2b638d）でお知らせ管理機能のスキーマ移行が完了。テスト戦略の改善により、プロジェクトの品質保証体制が強化されました。

---

## 2025-10-07 (Update 21)

### Key Changes
- OpenAPI契約テストの安定化完了（PR #46マージ）
- セッションレスポンスのnull許容フィールド対応
- OpenAPI4j 1.0.7へのバージョン固定

---

## 2025-10-05 (Update 20)

### Key Changes
- Lighthouse CI統合とパフォーマンス監視基盤の実装完了
- Core Web Vitals測定の自動化
- パフォーマンス目標設定（LCP 1.5秒、TTI 2秒）

---

## 2025-10-04 (Update 18-19)

### Key Changes
- レガシーUI完全削除リファクタリング（PR #38完了）
- Thymeleaf依存の完全削除、React SPA単一構成への移行
- Viteビルド設定の環境変数対応

---

*古いエントリ（Update 1-17）はgit履歴で参照可能*

---
*Last Updated: 2025-10-28*
*Inclusion Mode: Always Included*
