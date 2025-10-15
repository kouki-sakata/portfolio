# Steering Documents Changelog

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
