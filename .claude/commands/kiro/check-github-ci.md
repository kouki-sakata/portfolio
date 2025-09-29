## GitHub CI Monitoring

GitHub Actions CI 状況を監視して、完了まで追跡します。

## Implementation Notes

- **Development Approach**:
    - Utilize **context7** for all development activities.
    - Consistently apply software development **best practices**.
- **Coding Standards (TypeScript)**:
    - **Type Safety**: Strictly enforce TypeScript's type consistency. All code
      must be fully type-safe.
    - **Biome + ultracite Rules**: Adhere to the ultracite preset for Biome, which provides:
      - **Strict Type Safety**: Enforces TypeScript's strictest type checking (no `any`, strict null checks, exhaustive type handling)
      - **AI-Ready Code Quality**: Optimized for AI-generated code with comprehensive linting and formatting rules
      - **Performance**: Rust-powered Biome engine for instant feedback during development

### 使い方

```bash
# CI チェック状況を確認
gh pr checks
```

### 基本例

```bash
# PR 作成後の CI 確認
gh pr create --title "新機能の追加" --body "説明"
gh pr checks
```

### Claude との連携

```bash
# CI 確認から修正までの流れ
gh pr checks
「CI チェック結果を分析し、失敗項目があれば修正方法を提案して」

# 修正後の再確認
git push origin feature-branch
gh pr checks
「修正後の CI 結果を確認して、問題がないことを確認して」
```

### 実行結果の例

```text
All checks were successful
0 cancelled, 0 failing, 8 successful, 3 skipped, and 0 pending checks

   NAME                                    DESCRIPTION                ELAPSED  URL
○  Build/test (pull_request)                                          5m20s    https://github.com/user/repo/actions/runs/123456789
○  Build/lint (pull_request)                                          2m15s    https://github.com/user/repo/actions/runs/123456789
○  Security/scan (pull_request)                                       1m30s    https://github.com/user/repo/actions/runs/123456789
○  Type Check (pull_request)                                          45s      https://github.com/user/repo/actions/runs/123456789
○  Commit Messages (pull_request)                                     12s      https://github.com/user/repo/actions/runs/123456789
-  Deploy Preview (pull_request)                                               https://github.com/user/repo/actions/runs/123456789
-  Visual Test (pull_request)                                                  https://github.com/user/repo/actions/runs/123456789
```

### 注意事項

- 失敗時は詳細確認
- 全チェック完了まで待機してからマージ
- 必要に応じて `gh pr checks` を再実行
