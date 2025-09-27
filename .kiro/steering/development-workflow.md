<!-- Inclusion Mode: Conditional: ".github/**/*", "*.yml", "*.yaml", ".claude/commands/*", ".kiro/specs/**/*", "src/**/*", "tests/**/*" -->

# 開発ワークフローガイドライン

個人開発に最適化されたKiro仕様駆動開発と自動化されたワークフロー

## Part 1: 基本方針と戦略

### 基本原則

- **シンプルかつ効率的**: 過度な承認プロセスは不要、一人開発に最適化
- **継続的な品質維持**: コミット前の品質チェック必須
- **段階的リリース**: リスクを軽減し早期フィードバックを獲得
- **Kiro仕様駆動**: specから実装まで一貫した追跡可能性

### 段階的リリース戦略

#### Phase 1: コア機能（1.5ヶ月）

```
必須機能:
- 認証・テナント管理
- 基本的な打刻機能
- シンプルな勤怠集計
```

#### Phase 2: 管理機能（1.5ヶ月）

```
追加機能:
- ユーザー管理
- 打刻修正機能
- 基本レポート
```

#### Phase 3: 完全版（1.5ヶ月）

````
付加価値:
- ダッシュボード
- 高度なレポート
- システム設定
```x

### リリース判定基準

```yaml
release_criteria:
  functional:
    - test_coverage: '>= 80%'
    - critical_bugs: 0
  performance:
    - api_response: '< 1秒'
    - page_load: '< 2秒'
  security:
    - vulnerability_scan: 'passed'
    - rls_policy_test: 'passed'
````

## Part 2: テスト戦略

### テストピラミッド

```
E2E (10%) - ユーザーフロー検証
Integration (30%) - 連携検証
Unit (60%) - 個別機能検証
```

### カバレッジ目標

| レイヤー       | 対象          | ツール                       | 目標 |
| -------------- | ------------- | ---------------------------- | ---- |
| コンポーネント | UI            | Jest + Testing Library       | 80%  |
| フック         | React Hooks   | @testing-library/react-hooks | 85%  |
| ユーティリティ | 純粋関数      | Jest                         | 90%  |
| API            | Supabase      | Jest + MSW                   | 75%  |
| E2E            | Critical Path | Playwright                   | 100% |

### テスト実装パターン

```typescript
describe('機能名', () => {
  beforeEach(() => {
    // セットアップ
  });

  test('期待される動作', () => {
    // Arrange
    const input = prepareTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

### E2Eテスト優先度

| 機能               | 優先度 | カバレッジ |
| ------------------ | ------ | ---------- |
| 認証・セキュリティ | 最高   | 100%       |
| 打刻基本機能       | 最高   | 95%        |
| RLSポリシー        | 最高   | 100%       |
| ユーザー管理       | 高     | 85%        |

## Part 3: 実装詳細

### ブランチ命名規則

```
main (保護)
  └── feat/[spec-name]/task-[number]-[brief-description]  # Kiroタスク
  └── fix/[spec-name]/issue-[number]                      # バグ修正
  └── docs/[spec-name]/[doc-name]                        # ドキュメント
  └── refactor/[target]                                   # リファクタリング
  └── test/[test-name]                                    # テスト追加
```

### コミットメッセージ規約

```
type(spec/task): subject

body (タスク参照: #task-number from tasks.md)

footer
```

**Types:**

- `feat`: 新機能 (Kiroタスク実装)
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更
- `refactor`: バグ修正でも機能追加でもないコード変更
- `test`: テストの追加や修正
- `chore`: ビルドプロセスやツールの変更
- `perf`: パフォーマンス改善

**例:**

```
feat(attendance/task-3): マルチテナントスキーマの実装

.kiro/specs/attendance-management/tasks.md のタスク#3を実装
- tenantsテーブル作成
- usersテーブル作成
- RLSポリシー設定

Task: #3
```

### PR作成フロー

1. **自動ブランチ作成**: タスク開始時に適切なブランチを作成
2. **テンプレート適用**: PR作成時に自動的にテンプレートを適用
3. **ラベル付与**: Kiroタスクに基づく自動ラベリング
4. **レビュアー割当**: CODEOWNERSに基づく自動割当

### マージ戦略

- **Squash and merge**: 機能追加時（履歴を整理）
- **Merge commit**: 大きな機能統合時
- **Rebase and merge**: 単純な修正時

## Part 3: 運用ガイド

### 日次フロー

1. **朝の準備**

   ```bash
   git pull origin main
   /kiro:task-start [spec-name] [task-number]
   ```

2. **作業中**
   - 小さくコミット（1-2時間毎）
   - テストを書く→実装→リファクタリング

3. **作業終了時**
   ```bash
   /kiro:task-complete [spec-name] [task-number]
   ```

### 週次フロー

1. **月曜**: 週の計画とタスク優先度設定
2. **金曜**: 週次レビューと次週準備、`/kiro:spec-status`で進捗確認

### コマンドエイリアス

```bash
# Kiroタスク管理
alias kts='/kiro:task-start'          # Kiro Task Start
alias ktc='/kiro:task-complete'       # Kiro Task Complete
alias kss='/kiro:spec-status'         # Kiro Spec Status

# Git操作
alias sync-main='git checkout main && git pull origin main'
alias current-task='git branch --show-current | sed "s/.*task-\([0-9]*\).*/Task #\1/"'

# 品質チェック
alias check-all='npm run lint && npm run typecheck && npm test'
alias pre-pr='check-all && git status'
```

### CI/CD

#### 自動チェック

```yaml
on: [push, pull_request]
jobs:
  quality:
    - lint
    - typecheck
    - test
    - build
```

#### デプロイフロー

1. **Preview**: PRごとに自動デプロイ
2. **Staging**: mainマージで自動デプロイ
3. **Production**: タグ付けで手動デプロイ

### レビュープロセス

#### 自動レビューチェック

- コード品質チェック (ESLint, Prettier)
- テストカバレッジ確認
- ビルド成功確認
- セキュリティスキャン

#### 自己レビュー手法（一人開発）

1. **Claude Code Review**: AIによるコードレビュー活用

### 成功指標

#### 効率性指標

- タスク開始（ブランチ作成）: 30秒以内
- タスク完了（PR作成）: 2分以内
- レビュー開始までの時間: 5分以内
- マージまでの平均時間: 24時間以内

#### 品質指標

- tasks.md同期率: 100%
- PR自動記入精度: 95%以上
- ブランチ命名規則遵守率: 100%
- テスト実行率: 各タスク完了時100%
- テストカバレッジ: 80%以上

#### Kiro統合指標

- specとコードの整合性: 100%
- タスク追跡可能性: 100%
- 仕様からデプロイまでの可視性: 完全

## Part 4: トラブルシューティング

### よくある問題と解決策

| 問題                     | 原因                               | 解決策                                    |
| ------------------------ | ---------------------------------- | ----------------------------------------- |
| ブランチ作成失敗         | ローカルの変更が未コミット         | `git stash` で一時保存                    |
| PR template適用されない  | テンプレートファイルのパス誤り     | `.github/pull_request_template.md` を確認 |
| 自動マージ失敗           | コンフリクトまたはテスト失敗       | 手動介入が必要                            |
| Kiroタスクが見つからない | タスク番号誤りまたは既に完了済み   | `/kiro:spec-status [spec-name]` で確認    |
| tasks.md更新エラー       | ファイル権限またはフォーマット不正 | 手動で tasks.md を確認・修正              |
| GitHub Actions実行失敗   | 権限不足またはシークレット未設定   | リポジトリ設定でActions権限を確認         |
| マージコンフリクト       | mainとの差分が大きい               | 早めにmainを取り込む                      |
| テスト失敗               | 実装とテストの不一致               | CI結果を確認し即修正                      |
| パフォーマンス劣化       | 非効率なコード                     | プロファイリングツール活用                |
| 型エラー                 | TypeScript設定の問題               | strict modeで開発                         |

### モチベーション維持（一人開発）

- 小さな成功を積み重ねる
- 週次で進捗を可視化
- 定期的なリファクタリング時間の確保
- Kiroタスクの完了を可視化

## 中間レビュープロセス

### Phase 1完了時レビュー

- **技術評価**: パフォーマンス、セキュリティ、技術的負債
- **ビジネス評価**: ユーザー満足度、運用実績、要件達成度
- **Phase 2計画調整**: 優先度見直し、新要件追加

### 成功指標

- システム稼働率: 99.9%
- ユーザー満足度: 70%以上
- 開発速度: 計画通りの進捗
