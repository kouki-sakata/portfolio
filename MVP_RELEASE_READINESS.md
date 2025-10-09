# MVPリリース準備サマリー

本ドキュメントは、React + Spring Boot 版「TeamDevelop Bravo」をMVPとして公開する際に必要な改修と推奨フローを整理したものです。直近の調査結果（2025-10-09 時点）を基に、優先度ごとに対応事項をまとめています。

## 1. 優先度の高い必須改修（P0〜P1）

| 優先度 | 領域 | 課題 | 推奨対応 | 根拠ファイル |
| :-- | :-- | :-- | :-- | :-- |
| P0 | ナビゲーション | サイドバーが `AppProviders.tsx` に存在しないルート（`/notifications`, `/reports` 等）へリンクし 404 を誘発 | MVP ではリンクを削除するか `ComingSoon` に差し替え | `frontend/src/shared/components/layout/AppSidebar.tsx`, `frontend/src/app/providers/AppProviders.tsx` |
| P0 | エラーハンドリング | `npm run test` で複数の未処理 Promise 拒否（打刻処理等）が発生 | 失敗フローで `try/catch` とユーザー通知を追加、`GlobalErrorHandler` 経由で握り潰さない | `frontend/src/features/home/repositories/HomeRepository.ts`, `frontend/src/features/home/hooks/useStamp.ts`, `frontend/src/features/home/components/StampCard.tsx` |
| P0 | ビルド環境 | Vite 7 が Node.js 20.19+ を要求し、現在 20.12.1 で警告 | `.nvmrc` 等で Node 20.19 以上（推奨 22.12）を固定し、CI/CD と開発環境を統一 | `npm run build` の出力ログ |
| P1 | セキュリティ | `.env.example` の `JWT_SECRET` / `ENCRYPTION_KEY` がプレースホルダー | Secrets Manager 等で本番値を管理し、テンプレートには利用不可である旨を明記 | `.env.example` |
| P1 | 監視・障害対応 | `httpClientAdapter` が例外をローカル処理するのみで通知経路が無い | 集約ログ / Sentry / Alerting の導入、HTTP 5xx 連続発生時の監視を整備 | `frontend/src/shared/repositories/httpClientAdapter.ts`, `frontend/src/shared/error-handling/GlobalErrorHandler.ts` |
| P1 | テストカバレッジ | 主要 UI コンポーネント（`CalendarView`, `NavigationProgress` 等）が未カバー | Vitest 追加＋`npm run test:e2e`（Playwright）で主要導線を自動化 | カバレッジレポート, `frontend/src/features/stampHistory/components/CalendarView.tsx` |
| P1 | UX | 通知バッジがハードコード値 (`3`) のまま表示される | API 連携を行うか、MVP では非表示／ComingSoon に変更 | `frontend/src/shared/components/layout/AppSidebar.tsx` |

## 2. 推奨追加改善

1. **README 更新**: Elastic Beanstalk 旧 UI の URL と今回の React 版運用が混在しているため、最新の導線・操作を明記する。
2. **Feature Flag / ComingSoon 整理**: `/news` 以外の管理画面は ComingSoon 表示のため、ナビゲーションから隠すか、β公開に合わせてメッセージを調整。
3. **バックエンド監査ログ**: `EmployeeRestController` 等の管理 API へアクセスログを標準化し、監査証跡を確保。
4. **CI のバージョン固定**: `actions/setup-node@v4` や `setup-java` で Node / Java のバージョンを固定し、ビルド結果の再現性を確保。

## 3. 推奨リリースフロー

| フェーズ | 対象 | 実施事項 |
| :-- | :-- | :-- |
| ステージング | Spring Boot + React SPA | `.env` に本番相当値を注入、DB マイグレーション（`src/main/resources/01_schema.sql`, `02_data.sql`）、Playwright でログイン→打刻→履歴確認のE2Eを実施 |
| カナリア / 内部公開 | 社内管理者（少量） | サイドバー導線の動作検証、500 エラー時の監視・通知確認、打刻失敗時のユーザー影響を評価 |
| 本番リリース | 全利用者 | `npm run build` → `./gradlew bootJar` で配布物作成、GitHub Actions から Elastic Beanstalk/ECS へデプロイ、`npm run perf:lhci` で Lighthouse パフォーマンス確認 |

## 4. 次アクションまとめ

- 上記 P0 項目を優先着手し、`npm run lint` / `npm run typecheck` / `npm run test` / `npm run build` を全てグリーンにする。
- Node.js 20.19 以上への移行を先行実施し、開発端末・CI と揃える。
- ステージングで Playwright シナリオを追加し、主要導線のリグレッションを自動化。
- Secrets 管理と監視設定を本番向けに整備し、障害発生時のトリアージを高速化する。

---

本ドキュメントは MVP リリース計画策定のたたき台として利用し、進捗に応じて更新してください。