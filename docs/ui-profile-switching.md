# UIプロフィール切り替えガイド

2025年10月時点でTeamDevelop BravoのUIはReact
SPA構成に統一され、レガシーThymeleaf版は廃止されました。本ドキュメントは最新構成でのプロフィール運用方針をまとめたものです。

## 現在のプロフィール方針

- **modern-ui**
    - 互換目的で引き続き指定できますが、特別な構成は保持していません。
    - 指定の有無にかかわらず `WebMvcConfig` が常時有効となり、非APIリクエストは
      `index.html` にフォワードされます。
    - フィーチャーフラグAPI (`GET /api/public/feature-flags`) は常に
      `useShadcnUI = true` を返します。
- **legacy-ui**
    - レガシーUI削除に伴い非推奨となりました。指定しても関連するコントローラは存在しないためエラーになります。

## 推奨プロフィール設定

| 環境           | 推奨指定   | 備考                                                           |
|--------------|--------|--------------------------------------------------------------|
| 開発 (`dev`)   | `dev`  | 追加プロフィール指定は不要です。旧スクリプト互換が必要であれば `dev,modern-ui` としても動作は同じです。 |
| テスト (`test`) | `test` | CIはSPA前提で動作します。`modern-ui` を併記しても構いませんが効果はありません。             |
| 本番 (`prod`)  | `prod` | SPA構成が常時有効です。`legacy-ui` は指定しないでください。                        |

## 実行例

```bash
# SPA版で開発サーバーを起動（推奨）
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# 互換性のために modern-ui を明示する例（挙動は同じ）
SPRING_PROFILES_ACTIVE=dev,modern-ui ./gradlew bootRun
```

## フィーチャーフラグAPIのレスポンス

```json
{
  "useShadcnUI": true
}
```

`useShadcnUI` は常に `true`
を返します。フロントエンド実装ではこの値に依存した切り替えを削除するか、真値を前提とした簡略化を行ってください。

## 参考: レガシーUI撤去の影響

- レガシーMVCコントローラは削除済みのため、`legacy-ui`
  プロファイルを指定すると起動時にBean解決が失敗します。
- フィーチャーフラグサービスは環境判定を行わず、SPA UIを常時有効にします。
- `docs/postgres-migration-guide.md` など、旧プロファイルを前提としたドキュメントは順次更新対象です。
