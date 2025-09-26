Ultracite 導入ガイド（TeamDevelop Bravo）
=====================================

本プロジェクトでUltraciteを利用して、APIテスト・契約テスト・フロントテストの雛形生成や実行を効率化します。

前提
----
- Node.js 20.19.0（`.nvmrc`に準拠）
- Docker（Testcontainersを利用するテストで必要）

```
# nvmがある場合
nvm install 20.19.0
nvm use 20.19.0

# バージョン確認
node -v  # v20.19.0
npm -v
```

セットアップ
------------
- 一時実行: `npx ultracite@latest`
- もしくはグローバル: `npm i -g ultracite && ultracite`
- エディタ連携はプロンプトで選択（VSCode/Cursor/Zed）。後から `ultracite.config.json` で変更可能。

プロジェクト設定
----------------
- ルートに `ultracite.config.json` を配置済み。
  - 主要ターゲット（backend / frontend）と実行コマンドを定義
  - 生成物/キャッシュは除外（`build`, `.gradle`, `frontend/node_modules`, など）

主なコマンド（config定義）
--------------------------
- バックエンド
  - API集中: `SPRING_PROFILES_ACTIVE=test ./gradlew apiTest`
  - 全体: `SPRING_PROFILES_ACTIVE=test ./gradlew test`
  - 契約: `SPRING_PROFILES_ACTIVE=test ./gradlew -PenableOpenApiContract contractTest`
- フロントエンド
  - Lint: `npm run lint --prefix frontend`
  - Typecheck: `npm run typecheck --prefix frontend`
  - Unit: `npm run test --prefix frontend`

CI連携
-----
- GitHub ActionsはNodeを `20.19.0` に固定済み。
- 契約テスト:
  - 手動（workflow_dispatch）またはPRラベル`contract-test`で `contract-test` ジョブが動作
  - 成果物: `contract-test-reports`, `openapi.json`

ベストプラクティス
------------------
- 生成コードは“雛形”として使い、最終レビューは人が実施
- テストはタグ分離（`@Tag("api")`）で高速ループ→広い `test`→契約 `contractTest` の順で確認
- OpenAPIに `@Operation` / `@ApiResponse` / `@Schema` を付与し、契約検証の精度を向上
- 本番プロファイルではSwagger UIを無効（設定済み）

---
不明点や追加の自動化要望があればPR/Issueでお知らせください。
