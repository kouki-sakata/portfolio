# Docker セットアップガイド

## 概要

このプロジェクトでは、Docker と Docker Compose を使用してアプリケーションをコンテナ化しています。

## 前提条件

- Docker Engine 20.10+
- Docker Compose v2.0+

## セットアップ手順

### 1. 環境変数の設定

```bash
# .env.example をコピーして .env ファイルを作成
cp .env.example .env

# .env ファイルを編集して、適切な値を設定
vim .env
```

### 2. アプリケーションの起動

```bash
# バックグラウンドで起動
docker-compose up -d

# ログを確認
docker-compose logs -f app

# ヘルスチェック状態を確認
docker-compose ps
```

### 3. アプリケーションへのアクセス

- アプリケーション: http://localhost:8080
- ヘルスチェック: http://localhost:8080/actuator/health
- データベース: localhost:3306

## Docker サービス構成

### アプリケーションコンテナ (app)

- **ベースイメージ**: eclipse-temurin:21-jre-alpine
- **セキュリティ**: 非rootユーザーで実行
- **ヘルスチェック**: Spring Boot Actuator を使用
- **リソース制限**: CPU 2.0、メモリ 1.5GB
- **JVM最適化**: コンテナ対応設定、G1GC使用

### データベースコンテナ (db)

- **ベースイメージ**: mysql:8.0
- **文字セット**: utf8mb4
- **パフォーマンス調整**: InnoDB最適化設定
- **ログ**: スロークエリログ有効
- **ヘルスチェック**: mysqladmin ping

## 主な改善点

### セキュリティ

- 非rootユーザーでの実行
- Alpine Linuxによる軽量化
- セキュリティアップデートの自動適用
- 環境変数による機密情報管理

### パフォーマンス

- マルチステージビルドによるイメージサイズ最適化
- JVM コンテナ対応設定
- MySQL パフォーマンス調整
- リソース制限とリザベーション

### 運用性

- ヘルスチェック機能
- ログ出力設定
- 依存関係の管理（DB起動待ち）
- 再起動ポリシー設定

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # データベースの状態確認
   docker-compose logs db
   
   # ヘルスチェック状態確認
   docker-compose ps
   ```

2. **アプリケーション起動失敗**
   ```bash
   # アプリケーションログ確認
   docker-compose logs app
   
   # JVMメモリ設定を確認
   echo $JAVA_OPTS
   ```

3. **ポート競合**
   ```bash
   # ポート使用状況確認
   lsof -i :8080
   lsof -i :3306
   ```

### クリーンアップ

```bash
# コンテナとイメージを削除
docker-compose down --rmi all

# ボリュームも削除（データが消去されます）
docker-compose down -v --rmi all

# 未使用のDockerオブジェクトをクリーンアップ
docker system prune -f
```

## 開発時の便利なコマンド

```bash
# アプリケーションのみ再ビルド
docker-compose build app

# データベースのみ再起動
docker-compose restart db

# ログの実時間監視
docker-compose logs -f

# コンテナ内でシェル実行
docker-compose exec app sh
docker-compose exec db mysql -u root -p
```

## 本番環境での注意事項

1. `.env` ファイルの機密情報を適切に設定
2. JWTシークレットと暗号化キーを強固なものに変更
3. データベースパスワードを複雑なものに設定
4. ログレベルを INFO または WARN に設定
5. リソース制限を環境に応じて調整