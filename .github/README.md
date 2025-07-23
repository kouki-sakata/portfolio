# CI/CD パイプライン ガイド

## 概要

TeamDevelopプロジェクトでは、包括的なCI/CDパイプラインを実装しており、コード品質、セキュリティ、デプロイメントの自動化を行います。

## パイプライン構成

### 1. Feature Branch Pipeline (`feature.yml`)
**トリガー**: `feature/**`, `bugfix/**`, `hotfix/**` ブランチへのプッシュ・PR

#### 実行ジョブ:
- **Validate**: ブランチ名・コミットメッセージ・ファイルサイズのチェック
- **Quick Test**: 高速な単体テスト実行
- **Security Check**: セキュリティスキャンと機密情報チェック
- **Code Analysis**: コード複雑度分析・TODO/FIXMEカウント
- **Integration Test**: 統合テスト（条件付き）
- **Build Test**: ビルド・Dockerイメージ作成テスト

#### 特徴:
- 高速フィードバック（平均5-10分）
- 並列実行による効率化
- 条件付き統合テスト（`[full-test]`コミット、またはPR時）

### 2. Main CI Pipeline (`ci.yml`)
**トリガー**: `main`, `develop` ブランチへのプッシュ・PR

#### 実行ジョブ:
- **Test**: 完全な単体テストスイート
- **Build**: アプリケーションビルド
- **Security Scan**: OWASP Dependency Check、Trivyスキャン
- **Docker Build**: セキュアなDockerイメージ作成
- **Code Quality**: SonarCloud分析
- **Deployment**: ステージング・本番環境デプロイ

#### 特徴:
- 包括的なテスト実行
- セキュリティ重視の多層スキャン
- 環境別デプロイメント
- 自動通知機能

### 3. Release Pipeline (`release.yml`)
**トリガー**: `v*.*.*` タグのプッシュ

#### 実行ジョブ:
- **Create Release**: GitHub Release作成・変更履歴生成
- **Build and Test**: リリース用ビルド・テスト
- **Build Docker**: Container Registry への Docker イメージプッシュ
- **Security Scan**: リリース前セキュリティチェック
- **Deploy Production**: 本番環境デプロイ
- **Rollback**: 失敗時の自動ロールバック

#### 特徴:
- セマンティックバージョニング対応
- 自動変更履歴生成
- Container Registry 統合
- 失敗時自動ロールバック

## ブランチ戦略

### Git Flow
```
main (本番)
├── develop (開発)
│   ├── feature/user-authentication
│   ├── feature/api-improvements
│   └── bugfix/login-issue
├── hotfix/security-patch
└── release/v1.2.0
```

### ブランチ命名規則
- `feature/機能名` - 新機能開発
- `bugfix/バグ名` - バグ修正
- `hotfix/緊急修正名` - 緊急修正
- `release/vX.Y.Z` - リリース準備

### コミットメッセージ規則
```
type: 簡潔な説明

詳細な説明（オプション）

feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他のメンテナンス
```

## セキュリティ対策

### 1. 静的解析
- **OWASP Dependency Check**: 既知の脆弱性スキャン
- **Trivy**: コンテナイメージ脆弱性スキャン
- **GitLeaks**: 機密情報漏洩チェック
- **SonarCloud**: コード品質・セキュリティ分析

### 2. 動的チェック
- **Container Security**: 非rootユーザー実行
- **Network Security**: 最小限のポート露出
- **Secrets Management**: GitHub Secrets利用

### 3. アクセス制御
```yaml
permissions:
  contents: read      # コードの読み取り
  packages: write     # Container Registry書き込み
  security-events: write  # セキュリティアラート
```

## 環境管理

### 環境構成
```
Development → Staging → Production
     ↓           ↓         ↓
   feature    develop    main
```

### 環境変数
```yaml
# 開発環境
SPRING_PROFILES_ACTIVE: dev
LOG_LEVEL_ROOT: DEBUG

# ステージング環境  
SPRING_PROFILES_ACTIVE: staging
LOG_LEVEL_ROOT: INFO

# 本番環境
SPRING_PROFILES_ACTIVE: prod
LOG_LEVEL_ROOT: WARN
```

### デプロイメント戦略
- **Blue-Green Deployment**: ゼロダウンタイムデプロイ
- **Canary Release**: 段階的リリース
- **Rollback Strategy**: 即座のロールバック機能

## 品質ゲート

### コードカバレッジ
- **単体テスト**: 最低70%
- **統合テスト**: 最低50%
- **E2Eテスト**: 主要機能100%

### セキュリティ閾値
- **CVSS Score**: 7.0以上で失敗
- **脆弱性**: High以上で警告
- **機密情報**: 検出で即座に失敗

### パフォーマンス
- **ビルド時間**: 10分以内
- **テスト実行**: 5分以内
- **デプロイ時間**: 3分以内

## 監視・通知

### Slack通知
```yaml
チャンネル:
#ci-cd         - パイプライン実行状況
#deployments   - デプロイメント通知
#security      - セキュリティアラート
#releases      - リリース通知
```

### メトリクス監視
- **Success Rate**: 成功率95%以上維持
- **MTTR**: 平均復旧時間30分以内
- **Deployment Frequency**: 週2回以上

## トラブルシューティング

### よくある問題

#### 1. テスト失敗
```bash
# ローカルでのテスト実行
./gradlew test --info

# 特定テストの実行
./gradlew test --tests "AuthenticationServiceTest"

# データベース接続確認
docker-compose up -d db
./gradlew test
```

#### 2. ビルド失敗
```bash
# 依存関係の確認
./gradlew dependencies

# キャッシュクリア
./gradlew clean build

# Gradle Wrapper更新
./gradlew wrapper --gradle-version 8.14.2
```

#### 3. Docker問題
```bash
# イメージビルドテスト
docker build -t teamdev:test .

# コンテナ実行テスト
docker run -d --name test-app teamdev:test

# ログ確認
docker logs test-app
```

#### 4. セキュリティスキャン失敗
```bash
# ローカルでの脆弱性チェック
./gradlew dependencyCheckAnalyze

# 抑制設定の確認
vim dependency-check-suppressions.xml

# NVD データベース更新
./gradlew dependencyCheckUpdate
```

### ログ確認
```bash
# GitHub Actions ログアクセス
# Repository → Actions → 該当のワークフロー実行

# アーティファクトダウンロード
# テストレポート、セキュリティレポート等が利用可能
```

## ベストプラクティス

### 1. 開発フロー
```bash
# フィーチャーブランチ作成
git checkout -b feature/new-authentication

# 頻繁なコミット
git add .
git commit -m "feat: add JWT token validation"

# プッシュ前のローカルテスト
./gradlew test
docker build -t teamdev:local .

# プッシュ
git push origin feature/new-authentication
```

### 2. PR作成
- **タイトル**: 明確で簡潔
- **説明**: 変更内容の詳細
- **レビュアー**: 適切な担当者指定
- **チェックリスト**: 実装・テスト・ドキュメント

### 3. マージ戦略
- **Squash Merge**: feature → develop
- **Merge Commit**: develop → main
- **Fast-Forward**: hotfix → main

### 4. セキュリティ
- **機密情報**: GitHub Secretsに保存
- **アクセストークン**: 最小権限の原則
- **定期更新**: 依存関係の定期的な更新

## 設定ファイル

### 必要なSecrets
```
GitHub Repository Settings → Secrets and variables → Actions

Required:
- GITHUB_TOKEN (自動生成)

Optional:
- SONAR_TOKEN (SonarCloud連携)
- SLACK_WEBHOOK (Slack通知)
- NVD_API_KEY (高速脆弱性DB更新)
```

### 環境変数
```yaml
# .github/workflows/ci.yml
env:
  JAVA_VERSION: '21'
  GRADLE_VERSION: '8.14.2'
  REGISTRY: ghcr.io
```

これらの設定により、堅牢で効率的なCI/CDパイプラインを実現し、高品質なソフトウェアの継続的デリバリーを支援します。