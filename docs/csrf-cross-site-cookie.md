# CSRFトークン未発行と403エラーの原因整理

## 背景
- フロントエンド（Vercel）からバックエンド（Render）へクロスサイトでアクセスしている。
- CSRF保護は `CookieCsrfTokenRepository` と `X-XSRF-TOKEN` ヘッダーで実装済み。
- `/api/auth/session` を叩いても、ブラウザの `Application > Cookies` に `XSRF-TOKEN` が保存されず、`POST /api/home/stamps` などで 403 (Invalid CSRF Token) が発生していた。

## 原因
1. `SecurityConfig.csrf()` の設定で `/api/auth/session` が `ignoringRequestMatchers` に含まれていたため、`CsrfFilter` がトークンを生成していなかった。<br>
   → 2025-10-26 修正: `/api/auth/session` を除外リストから外し、CsrfFilter を通過させるよう変更。
2. 修正後も Render 環境で 403 が再発。`AuthRestControllerIntegrationTest.sessionEndpointSetsCsrfArtifacts` を Serena MCP で実行したところ、`Set-Cookie` が `XSRF-TOKEN=...; Path=/` のみで、`SameSite=None; Secure` が付与されていないことが判明。
3. `SameSite=None` が無いクロスサイト Cookie はブラウザにブロックされるため、`XSRF-TOKEN` Cookie が保存されず、サーバー側で Cookie とヘッダーの照合に失敗していた。

## よくある誤解
- 「レスポンスヘッダーに `X-XSRF-TOKEN` が載っているのに 403 になるのはフロントがヘッダーを更新していないから」ではない。<br>
  実際は Cookie 側に `SameSite=None; Secure` が無いため、そもそもブラウザに保存されていなかった。
- `Set-Cookie` がブラウザの current origin に紐づくため、DevTools では `https://teamdev-api.onrender.com` の Cookie ストレージを確認する必要がある。

## 対応状況 (2025-10-26)
- ✅ `CsrfHeaderFilter` を更新し、`XSRF-TOKEN` Cookie に `Path=/; SameSite=None` を強制付与。プロファイルに応じて `Secure` を切り替え（`dev`/`test` は `Secure=false`、その他は `Secure=true`）、`HttpOnly=false` を維持。
- ✅ `SecurityConfig` から新しいフィルターを適用し、既存の SPA との互換性を担保。
- ✅ `./gradlew test --tests com.example.teamdev.integration.AuthRestControllerIntegrationTest` を実行し、`Set-Cookie` ヘッダーに `SameSite=None` が含まれることを確認。
- ☐ Render 環境での手動検証（DevTools で Cookie 属性を確認し、`POST /api/home/stamps` 等が 403 にならないことを確認）。

## 推奨対応
1. Render 本番環境で `/api/auth/session` を実行し、レスポンスヘッダーの `Set-Cookie`/`X-XSRF-TOKEN` と Application タブの Cookie 値が一致するか確認する。
2. `POST /api/home/stamps` と `DELETE /api/news/{id}` を再実行し、403 が発生しないことを確認する。
3. 必要に応じて dev/test プロファイルで `Secure=false` が設定されているか（HTTP アクセス時に Cookie が保存されるか）を再確認する。

## 検証のログ抜粋
```
MockHttpServletResponse:
  Status = 200
  Headers = [..., Set-Cookie:"XSRF-TOKEN=663b25d0-111f-4669-b664-6b2281407ee9; Path=/; SameSite=None", X-XSRF-TOKEN:"663b25d0-111f-4669-b664-6b2281407ee9", ...]
```
- 新実装により `SameSite=None` 付きで CSRF Cookie が返却されることを統合テストで確認済み。
