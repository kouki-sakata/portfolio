# UIプロフィール切り替えガイド

TeamDevelop Bravoでは、Spring Profilesを用いてSPA版とレガシーThymeleaf版のUIを環境ごとに切り替えられるようになりました。以下のプロフィールを組み合わせて使用します。

## 利用可能なプロフィール

- `modern-ui`
  - デフォルト設定。React + ViteでビルドされたSPAを提供します。
  - `WebMvcConfig` が有効になり、任意の非APIリクエストが `index.html` にフォワードされます。
  - フロントエンドのフィーチャーフラグAPI (`/api/public/feature-flags`) は `useShadcnUI = true` を返します。
- `legacy-ui`
  - 既存のThymeleafベースUIを有効化します。
  - `@Controller` に `@Profile("legacy-ui")` が付与されているレガシー画面が読み込まれ、`WebMvcConfig` は無効化されます。
  - フィーチャーフラグAPIは `useShadcnUI = false` を返し、フロントエンドはラッパーコンポーネント経由で旧UIを利用します。

## 推奨組み合わせ

| 環境 | 推奨プロフィール | 備考 |
| ---- | ---------------- | ---- |
| 開発 (`dev`) | `dev,modern-ui` | SPA開発をデフォルトとします。旧UI検証が必要な場合のみ `dev,legacy-ui` を使用します。 |
| テスト (`test`) | `test,modern-ui` | CIの統合テストはSPA版を前提としています。レガシー互換テストが必要な場合は `test,legacy-ui` を指定します。 |
| 本番 (`prod`) | `prod,modern-ui` | SPA版を標準運用とします。ロールバック時に `prod,legacy-ui` を指定できます。 |

## 実行例

```bash
# SPA版で開発サーバーを起動
SPRING_PROFILES_ACTIVE=dev,modern-ui ./gradlew bootRun

# レガシーUIで挙動確認
SPRING_PROFILES_ACTIVE=dev,legacy-ui ./gradlew bootRun
```

## フィーチャーフラグAPI

- エンドポイント: `GET /api/public/feature-flags`
- レスポンス例:

```json
{
  "useShadcnUI": true
}
```

プロフィールに応じて `useShadcnUI` の値が自動的に切り替わります。フロントエンドはこの値を参照してshadcn/uiコンポーネントの使用可否を判定してください。
