# Critical Serena Refactoring - Performance Baseline Measurement

## 概要

このドキュメントは、critical-serena-refactoring仕様のTask 1「パフォーマンスベースラインの測定とメトリクス記録」の実装について説明します。

## 実装内容

### 1. パフォーマンスメトリクス収集システム

TDD（テスト駆動開発）のアプローチに従って、以下のメトリクス収集システムを実装しました：

#### 収集対象メトリクス

1. **API応答時間**
   - Spring Boot Actuatorからp95、p99パーセンタイルを収集
   - エンドポイント別のメトリクスと全体的なパフォーマンス指標

2. **フロントエンドバンドルサイズ**
   - Vite build analysisによるJavaScript/CSSのサイズ測定
   - 生サイズとgzip圧縮後サイズの両方を記録

3. **データベースクエリパフォーマンス**
   - MyBatis SQLログから実行時間を解析
   - 平均実行時間、p99パーセンタイル、最も遅いクエリのリスト

### 2. 実装ファイル構成

```
.kiro/specs/critical-serena-refactoring/
├── scripts/
│   ├── __tests__/
│   │   └── collect-metrics.test.ts    # テストファイル（TDD RED/GREEN）
│   ├── collect-metrics.ts             # メイン実装
│   ├── package.json                   # Node.js依存関係
│   ├── tsconfig.json                  # TypeScript設定
│   ├── test-metrics.js               # メトリクス収集テストスクリプト
│   ├── test-log-parsing.js           # ログ解析テストスクリプト
│   └── generate-baseline-mock.js     # モックデータ生成スクリプト
├── baseline-metrics.json             # 生成されたベースラインメトリクス
└── spec.json                         # 更新された仕様ファイル
```

### 3. 設定変更

#### Spring Boot Actuator設定 (application-dev.properties)
```properties
# パフォーマンス測定用Actuator設定
management.endpoints.web.exposure.include=health,info,metrics,httptrace
management.metrics.distribution.percentiles-histogram.http.server.requests=true
management.metrics.distribution.percentiles.http.server.requests=0.5,0.95,0.99
management.metrics.distribution.slo.http.server.requests=100ms,200ms,500ms

# MyBatis SQLログ詳細設定
logging.level.com.example.teamdev.mapper=TRACE
mybatis.configuration.log-impl=org.apache.ibatis.logging.slf4j.Slf4jImpl
```

#### Frontend package.json拡張
```json
"scripts": {
  "build:analyze": "VITE_ANALYZE_BUNDLE=true vite build",
  "measure:bundle": "npm run build && node ../.kiro/specs/critical-serena-refactoring/scripts/dist/collect-metrics.js"
}
```

## 使用方法

### 1. メトリクス収集スクリプトのセットアップ

```bash
cd .kiro/specs/critical-serena-refactoring/scripts
npm install
npm run build
```

### 2. テストの実行

```bash
npm test  # すべてのテストを実行
```

### 3. 実際のメトリクス収集

開発環境で Spring Boot と Frontend が実行中の場合:

```bash
# フルメトリクス収集
node test-metrics.js

# SQLログ解析のみ
node test-log-parsing.js

# モックデータでベースライン生成
node generate-baseline-mock.js
```

### 4. フロントエンドバンドル分析

```bash
cd frontend
npm run build:analyze
# dist/stats.html でバンドル分析結果を確認
```

## 生成されるメトリクスファイル

### baseline-metrics.json の構造

```json
{
  "timestamp": "ISO-8601形式のタイムスタンプ",
  "api_metrics": {
    "endpoints": {
      "/api/endpoint": {
        "p95": "95パーセンタイル応答時間(ms)",
        "p99": "99パーセンタイル応答時間(ms)",
        "count": "リクエスト回数"
      }
    },
    "overall": {
      "p95": "全体のp95",
      "p99": "全体のp99"
    }
  },
  "frontend_bundle": {
    "js": {
      "raw": "生サイズ(bytes)",
      "gzipped": "gzip圧縮後サイズ(bytes)"
    },
    "css": {
      "raw": "生サイズ(bytes)",
      "gzipped": "gzip圧縮後サイズ(bytes)"
    }
  },
  "database_queries": {
    "slowest_queries": [
      {
        "query": "SQLクエリ",
        "avg_time_ms": "平均実行時間",
        "p99_time_ms": "p99実行時間",
        "count": "実行回数"
      }
    ],
    "overall": {
      "avg_query_time_ms": "全体の平均",
      "p99_query_time_ms": "全体のp99"
    }
  }
}
```

## 測定されたベースラインメトリクス（モックデータ）

### API パフォーマンス
- 全体 P95: 143ms
- 全体 P99: 238ms
- 最も遅いエンドポイント: `/api/dashboard` (P99: 580ms)

### フロントエンドバンドルサイズ
- JavaScript: 121.61KB (gzipped)
- CSS: 19.41KB (gzipped)
- 合計: 141.02KB (gzipped)

### データベースクエリパフォーマンス
- 平均クエリ時間: 40ms
- P99クエリ時間: 135ms
- 最も遅いクエリ: JOINを含む履歴クエリ (平均128ms)

## TDD実装の証跡

1. **RED Phase**: 最初にテストファイル (`__tests__/collect-metrics.test.ts`) を作成
   - Actuatorメトリクス収集のテスト
   - バンドルサイズ測定のテスト
   - SQLログ解析のテスト
   - 統合テスト

2. **GREEN Phase**: テストを通すための実装 (`collect-metrics.ts`)
   - 型定義とインターフェース
   - メトリクス収集関数
   - ファイル出力とspec.json更新

3. **REFACTOR**: コードの整理と最適化
   - TypeScript strict modeの適用
   - エラーハンドリングの改善
   - モジュール化と再利用性の向上

## 今後の改善点

1. **リアルタイムメトリクス収集**
   - 実際の運用環境からメトリクスを自動収集
   - CI/CDパイプラインへの統合

2. **メトリクスの可視化**
   - ダッシュボードの作成
   - 時系列でのトレンド分析

3. **アラート機能**
   - パフォーマンス劣化の自動検知
   - Slackなどへの通知機能

## 関連仕様

- 仕様名: critical-serena-refactoring
- フェーズ: tasks-generated
- タスク: Task 1 - パフォーマンスベースラインの測定とメトリクス記録
- 実装手法: Test-Driven Development (TDD)
- 使用技術: TypeScript, Vitest, Spring Boot Actuator, MyBatis, Vite

## お問い合わせ

この実装に関する質問や改善提案がある場合は、プロジェクトのissueで報告してください。