# Steering Documents Changelog

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
*Last Updated: 2025-10-15*
*Inclusion Mode: Always Included*
