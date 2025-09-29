## Analyze Performance

## Implementation Notes

- **Development Approach**:
    - Utilize **context7** for all development activities.
    - Consistently apply software development **best practices**.
- **Coding Standards (TypeScript)**:
    - **Type Safety**: Strictly enforce TypeScript's type consistency. All code
      must be fully type-safe.
    - **Biome + ultracite Rules**: Adhere to the ultracite preset for Biome,
      which provides:
        - **Strict Type Safety**: Enforces TypeScript's strictest type
          checking (no `any`, strict null checks, exhaustive type handling)
        - **AI-Ready Code Quality**: Optimized for AI-generated code with
          comprehensive linting and formatting rules
        - **Performance**: Rust-powered Biome engine for instant feedback during
          development

アプリケーションのパフォーマンスをユーザー体験の観点から分析し、改善による体感速度向上を定量化します。Core
Web Vitals に基づく UX スコアを算出し、優先順位付けされた最適化戦略を提案します。

### UX パフォーマンススコア

```text
ユーザー体験スコア: B+ (78/100)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ Core Web Vitals
├─ LCP (読み込み): 2.3 秒 [Good] 目標<2.5 秒 ✅
├─ FID (操作反応): 95ms [Good] 目標<100ms ✅
├─ CLS (視覚安定): 0.08 [Good] 目標<0.1 ✅
├─ FCP (初回描画): 1.8 秒 [Good] 目標<1.8 秒 ✅
├─ TTFB (サーバー): 450ms [Needs Work] 目標<200ms ⚠️
└─ TTI (操作可能): 3.5 秒 [Needs Work] 目標<3.8 秒 ⚠️

📊 ユーザー体感速度
├─ 初回表示体感: 2.3 秒 [業界平均: 3.0 秒]
├─ ページ遷移: 1.1 秒 [業界平均: 1.5 秒]
├─ 検索結果表示: 0.8 秒 [業界平均: 1.2 秒]
├─ フォーム送信: 1.5 秒 [業界平均: 2.0 秒]
└─ 画像読み込み: 遅延ロード実装済み ✅

😊 ユーザー満足度予測
├─ 離脱率予測: 12% (業界平均: 20%)
├─ 完了率予測: 78% (目標: 85%)
├─ 推奨 NPS: +24 (業界平均: +15)
└─ リピート率: 65% (目標: 70%)

📊 ユーザー体験への影響
├─ 表示速度 0.5 秒短縮 → 離脱率 -7%
├─ 離脱率 5% 削減 → セッション長 +15%
├─ 検索改善 → 滞在時間 +15%
└─ 総合的な UX 改善度: +25%

🎯 改善による期待効果 (優先順位順)
├─ [P0] TTFB 改善 (CDN 導入) → LCP -0.3 秒 = 体感速度 +15%
├─ [P1] JS バンドル最適化 → TTI -0.8 秒 = 操作可能時間 -20%
├─ [P2] 画像最適化 (WebP) → 転送量 -40% = ロード時間 -25%
└─ [P3] キャッシュ戦略 → リピート訪問時 50% 高速化
```

### 使い方

```bash
# UX スコアの包括的分析
find . -name "*.js" -o -name "*.ts" | xargs wc -l | sort -rn | head -10
「UX パフォーマンススコアを算出し、Core Web Vitals を評価して」

# パフォーマンスボトルネックの検出
grep -r "for.*await\|forEach.*await" . --include="*.js"
「非同期処理のボトルネックを検出し、ユーザー体感への影響を分析して」

# ユーザー体験への影響分析
grep -r "addEventListener\|setInterval" . --include="*.js" | grep -v "removeEventListener\|clearInterval"
「パフォーマンス問題がユーザー体験に与える影響を分析して」
```

### 基本例

```bash
# バンドルサイズとロード時間
npm ls --depth=0 && find ./public -name "*.js" -o -name "*.css" | xargs ls -lh
"バンドルサイズとアセット最適化の改善点を特定して"

# データベースパフォーマンス
grep -r "SELECT\|findAll\|query" . --include="*.js" | head -20
"データベースクエリの最適化ポイントを分析して"

# 依存関係のパフォーマンス影響
npm outdated && npm audit
"古い依存関係がパフォーマンスに与える影響を評価して"
```

### 分析観点

#### 1. コードレベルの問題

- **O(n²) アルゴリズム**: 非効率な配列操作の検出
- **同期 I/O**: ブロッキング処理の特定
- **重複処理**: 不要な計算やリクエストの削除
- **メモリリーク**: イベントリスナーやタイマーの管理

#### 2. アーキテクチャレベルの問題

- **N+1 クエリ**: データベースアクセスパターン
- **キャッシュ不足**: 繰り返し計算や API 呼び出し
- **バンドルサイズ**: 不要なライブラリやコード分割
- **リソース管理**: 接続プールやスレッド使用量

#### 3. 技術的負債による影響

- **レガシーコード**: 古い実装による性能劣化
- **設計の問題**: 責任分散不足による結合度の高さ
- **テスト不足**: パフォーマンス回帰の検出漏れ
- **監視不足**: 問題の早期発見体制

### パフォーマンス改善 ROI マトリクス

```text
改善 ROI = (時間削減効果 + 品質向上) ÷ 実装工数
```

| 優先度             | ユーザー体験向上 | 実装難易度 | 時間削減効果 | 具体例    | 工数  | 効果       |
|-----------------|----------|-------|--------|--------|-----|----------|
| **[P0] 即実装すべき** | 高        | 低     | > 50%  | CDN 導入 | 8h  | 応答 -60%  |
| **[P1] 早期実装推奨** | 高        | 中     | 20-50% | 画像最適化  | 16h | ロード -30% |
| **[P2] 計画的実装**  | 低        | 高     | 10-20% | コード分割  | 40h | 初回 -15%  |
| **[P3] 保留/様子見** | 低        | 低     | < 10%  | 微細な最適化 | 20h | 部分 -5%   |

#### 優先度判定基準

- **P0(即実装)**: UX 向上「高」× 難易度「低」= ROI 最大
- **P1(早期実装)**: UX 向上「高」× 難易度「中」= ROI 高
- **P2(計画的)**: UX 向上「低」× 難易度「高」= ROI 中
- **P3(保留)**: UX 向上「低」× 難易度「低」= ROI 低

### パフォーマンス指標と UX 改善相関

| 指標              | 改善幅    | 体感速度向上 | ユーザー満足度   | 実装工数 |
|-----------------|--------|--------|-----------|------|
| **LCP (読み込み)**  | -0.5 秒 | +30%   | 離脱率 -7%   | 16h  |
| **FID (操作反応)**  | -50ms  | +15%   | ストレス -20% | 8h   |
| **CLS (視覚安定)**  | -0.05  | +10%   | 誤操作 -50%  | 4h   |
| **TTFB (サーバー)** | -200ms | +25%   | 体感速度 +40% | 24h  |
| **TTI (操作可能)**  | -1.0 秒 | +35%   | 完了率 +15%  | 32h  |
| **バンドルサイズ**     | -30%   | +20%   | 初回訪問 +25% | 16h  |

### 測定とツール

#### Node.js / JavaScript

```bash
# プロファイリング
node --prof app.js
clinic doctor -- node app.js

# バンドル分析
npx webpack-bundle-analyzer
lighthouse --chrome-flags="--headless"
```

#### データベース

```sql
-- クエリ分析
EXPLAIN ANALYZE SELECT ...
SHOW SLOW LOG;
```

#### フロントエンド

```bash
# React パフォーマンス
grep -r "useMemo\|useCallback" . --include="*.jsx"

# リソース分析
find ./src -name "*.png" -o -name "*.jpg" | xargs ls -lh
```

### 継続的改善

- **定期監査**: 週次パフォーマンステスト実行
- **メトリクス収集**: レスポンス時間、メモリ使用量の追跡
- **アラート設定**: 閾値超過時の自動通知
- **チーム共有**: 改善事例とアンチパターンの文書化
