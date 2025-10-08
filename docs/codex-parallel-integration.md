# Codex 並列変更の統合ガイド

複数の AI エージェントが同時に変更を進める場合、統合作業の段取りが曖昧だと最終成果物に不整合が生じやすくなります。本ドキュメントでは、Codex で 4 本の変更ストリームを並列に進めた際に、衝突なくメインブランチへ統合するための手順をまとめます。

## 前提

- 各変更はそれぞれ個別の Git ブランチで管理する。
- 変更対象や影響範囲が重複しないよう、あらかじめ仕様・ファイル単位で担当を切り分ける。
- 変更ごとに自動テスト・静的解析を実行できる状態を保つ。

## 推奨フロー概要

1. **同期ポイントの決定**: 4 本の変更を `feature/a` 〜 `feature/d` のように分岐させ、ベースとなるコミットを明確にする。
2. **定期的なリベース**: 各ブランチは 1 日 1 回以上 `git fetch` & `git rebase origin/main` で最新化し、衝突を早期に解消する。
3. **統合用ブランチの作成**: 4 本がレビュー完了したら `integration/codex-parallel` ブランチを作成し、順番にマージする。
4. **順序付きマージ**: コンフリクトが少ない変更から順番に `git merge --no-ff feature/x` を行い、都度テストを実行する。
5. **最終検証**: 4 本すべてのマージが完了したら、エンドツーエンドのテストやビルドをまとめて実行し、成果物の一貫性を確認する。

## 具体的なコマンド例

```bash
# 1. 各作業ブランチの同期
for branch in feature/a feature/b feature/c feature/d; do
  git checkout "$branch"
  git fetch origin
  git rebase origin/main
  npm run lint --prefix frontend
  ./gradlew test
  git checkout -
done

# 2. 統合ブランチの準備
git checkout -b integration/codex-parallel origin/main

# 3. 順番にマージ
for branch in feature/a feature/b feature/c feature/d; do
  git merge --no-ff "$branch"
  npm run typecheck --prefix frontend
  ./gradlew build || { echo "Build failed after merging $branch"; exit 1; }
done
```

## コンフリクト解消のポイント

- **衝突ログの共有**: どのファイルで衝突が発生したかを記録し、必要に応じて担当者へフィードバックする。
- **スタイル差分の標準化**: Biome や Prettier などのフォーマッターが導入されている場合、衝突解消後に必ず再フォーマットして意図しない差分を防ぐ。
- **ドメイン知識の照合**: ビジネスロジックが重なる場合は、各変更の設計意図を統合作業者が確認してから最終差分を確定する。

## 最終チェックリスト

- [ ] 4 本の変更それぞれに対して単体テスト／静的解析／ビルドが通っている。
- [ ] 統合ブランチで `./gradlew check` および `npm run build --prefix frontend` が成功している。
- [ ] リリースノートや変更ログに 4 本の変更内容が網羅されている。
- [ ] メインブランチへのマージ前にレビューアへ最終差分を共有し、認識齟齬がないことを確認した。

## よくある質問

### Q. 途中で 1 本だけ遅延した場合は？
A. 遅延したブランチを除いた 3 本で一度統合を進め、遅延ブランチは後から `rebase integration/codex-parallel` でキャッチアップさせるのが安全です。

### Q. マージ後にテストが失敗した場合は？
A. 原因となるブランチを特定し、修正コミットを追加した上で再度統合テストを実行してください。必要に応じて `git revert` で該当ブランチのマージコミットを一時的に戻し、問題解決後に再マージします。

---

このガイドに従うことで、Codex が並列で進めた複数の変更を安定的に統合できます。運用状況に応じて手順をカスタマイズしつつ、テストとレビューのサイクルを絶やさないようにしてください。
