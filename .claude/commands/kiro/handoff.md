You are producing a **minimal, agent-friendly handoff note** ("引き継ぎ書") for
continuing the current coding task in a new session.

## Output contract

- **Format:** GitHub-Flavored **Markdown only**（日本語本文）。No meta commentary.
- **Deterministic structure:** Use the exact section order and headings below.
- **Keep it short:** 箇条書きで、各項目は1–3行、**次にやることは最大5個**。
- **No environment/setup instructions.** 「何を」「どこで」「どう完了判定するか」に集中。
- **空欄の扱い:** 不明な項目は `-` を入れ、**§8 未解決**に短く記載。
- **状態表示:** 現在の状態には 🟢（動作中）🟡（作業中）🔴（エラー）を使用

## Light auto-collection (best effort; if tools unavailable, infer)

- Git snapshot: branch, short SHA, last commit subject, changed files（ファイル名のみ）
- Recent focus: 直近で編集/閲覧していた主要ファイル/関数
- Quick check targets: 期待出力のファイル/関数/テスト名（コマンドは書かない）

## Produce exactly this Markdown (fixed schema)
---
title: 引き継ぎ書
version: 1.2
branch: {branch}
sha: {short_sha}
focus_file: {primary_file_or_dir}
---

# 引き継ぎ書

## 1. ゴール（DoD：達成条件を1–2行）

- …

## 2. タスク要約（1–3行）

- …

## 3. 検証方法（合否基準・期待出力／観点 1–3行）

- 例：`{path/to/artifact}` が生成され、関数 `{fn}` は `{expected}` を返す 等
- …

## 4. 現在の状態（3–5行、状態インジケーター付き）

- 🟢 {完了済み機能}: {動作確認済み内容}
- 🟡 {作業中機能}: {現在の作業内容}
- 🔴 {エラー/未着手}: {問題内容}

## 5. 変更ファイル（直近）

| Path | Note |
|------|------|
| …    | …    |

## 6. 次にやること（各1行、必要なら成功条件/フォールバックを括弧書き）

- [ ] …（成功条件：…／詰まったら：…）
- [ ] …
- [ ] …
- [ ] …
- [ ] …

## 7. スコープ外（今回はやらない）

- …

## 8. 未解決 / リスク（各1行で要点）

- …

## 8.5. 失敗した試み（時間の無駄を防ぐ）

- ❌ {アプローチ}: {失敗理由}

## 9. 決定事項（今回増分のみ）

- …

## 10. 参照（再オープン用パス/Issue/PR）

- `src/...`
- Issue/PR: …

## 11. 再開カーソル（ファイル:行番号/関数名）

- `path/to/file.ts:123`（関数 `foo` の直前）
