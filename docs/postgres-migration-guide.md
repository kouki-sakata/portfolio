# PostgreSQL への移行ガイド

本ドキュメントは、旧 MySQL 構成から PostgreSQL 16 へ移行するためのベストプラクティスをまとめたものです。事前のバックアップ取得と検証環境でのリハーサルを必ず実施してください。

## 1. 事前チェックリスト

- [ ] 本番 DB のフルバックアップ（`mysqldump`）を取得済み
- [ ] 新しい PostgreSQL インスタンス／コンテナを準備済み
- [ ] アプリケーションの接続情報を Secrets Manager / GitHub Secrets に更新済み
- [ ] `src/main/resources/01_schema.sql` / `02_data.sql` が最新状態であることを確認
- [ ] 移行リハーサル用のステージング環境を用意済み

## 2. 新しい PostgreSQL のプロビジョニング

### Docker Compose を利用する場合

```bash
docker compose -f docker-compose.yml up -d db
```

`.env` の以下のキーを更新してください。

| キー | 説明 |
| :-- | :-- |
| `DOCKER_DB_NAME` | 作成するデータベース名 |
| `DOCKER_DB_USERNAME` | アプリケーション用ユーザー |
| `DOCKER_DB_PASSWORD` | ユーザーのパスワード |

### マネージドサービス（RDS など）の場合

- パラメータグループで `timezone=Asia/Tokyo`、`client_encoding=UTF8` を設定
- `uuid-ossp` 拡張が利用可能であることを確認
- TLS 証明書をダウンロードし、アプリケーションの接続文字列に `sslmode=require` を付与

## 3. データ移行

### 3.1 pgloader を用いた移行

1. `pgloader` をインストール
2. 以下の例のようなロードファイルを作成

```lisp
LOAD DATABASE
     FROM mysql://root:password@old-host/legacy_db
     INTO postgresql://teamdev_user:secret@new-host/teamdev_db
 WITH include drop, create tables, create indexes, reset sequences
 CAST type datetime to timestamp using zero-dates-to-null,
      type date to date drop default drop not null
 BEFORE LOAD DO
 $$ CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; $$;
```

3. `pgloader migration.load` を実行

### 3.2 CSV 経由の手動移行（小規模データ向け）

1. `mysqldump --tab` でテーブルごとに TSV を吐き出す
2. PostgreSQL 側で `COPY table_name FROM 'path' WITH (FORMAT csv, DELIMITER '\t', NULL 'NULL')` を実行
3. 外部キー／シーケンスを再作成 (`SELECT setval('sequence', max(id)) FROM table;`)

## 4. アプリケーション設定の更新

1. 環境変数／Secrets を PostgreSQL 用に更新
   ```text
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=teamdev_db
   DB_USERNAME=teamdev_user
   DB_PASSWORD=********
   ```
2. `docker-compose.yml` のサービス名やヘルスチェックを PostgreSQL 用に更新（済みのテンプレートを利用可能）
3. GitHub Actions の `ci.yml` / `feature.yml` の DB サービスを Postgres 用に変更（既存 PR 参照）

## 5. デプロイ前の検証

- ステージング環境で `./scripts/dev-workflow.sh --full` を実行し、フロントエンド lint/test + Gradle test が通ることを確認
- `./gradlew flywayValidate` 等のスキーマ検証ツールを併用する場合は、PostgreSQL 用に設定を更新
- 監査ログ／アプリログの出力フォーマットが期待通りであるか確認

## 6. 切替手順（例）

1. 本番 MySQL をメンテナンスモードに切り替え
2. 最終差分を `pgloader` で取り込み
3. RDS / Compose 上のアプリケーション接続先を PostgreSQL に切り替え
4. Smoke Test を実行（ログイン、打刻、履歴閲覧、従業員編集など）
5. メンテナンスを解除し、メトリクスを監視

## 7. ロールバック戦略

- 切り戻し用に旧 MySQL のスナップショットを保持
- `SPRING_PROFILES_ACTIVE=legacy-ui` と旧バージョンの Jar を併用し、迅速に戻せるよう準備
- Secrets / Connection String を切り換えるだけで旧環境に戻せるよう設定を段階的に適用

## 8. よくある質問

### Q. アプリケーション起動時に `relation "hibernate_sequence" does not exist` が出る
A. Postgres では `hibernate_sequence` が自動作成されないため、`01_schema.sql` に `CREATE SEQUENCE` を追加済みです。適用漏れがないか確認してください。

### Q. `Testcontainers` の PostgreSQL 起動に失敗する
A. Docker が動作していること／`DOCKER_HOST` 設定が正しいことを確認してください。CI では `services.postgres` を利用し、テスト内で Testcontainers をスキップする設定も可能です。

---

ご不明点があれば Issue または Slack で連絡してください。

## 付録: ローカル検証ログ (2025-09-25)

- `.env` を PostgreSQL 用のポート (`5432`)・資格情報に更新し、`DOCKER_DB_*` 変数を `teamdev_user` / `teamdev_pass` へ統一。
- `docker compose -f docker-compose.yml up -d db` で PostgreSQL 16 コンテナを起動し、ヘルスチェックが `healthy` になることを確認。
- `psql` で `\dt` を実行して `employee`, `log_history`, `news`, `stamp_history` テーブルが作成済みであることを確認。
- `SELECT COUNT(*) FROM employee;` の結果 `100` が返り、`02_data.sql` の初期データがロードされていることを検証。
