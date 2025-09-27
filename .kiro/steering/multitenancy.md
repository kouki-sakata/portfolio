<!-- Inclusion Mode: Conditional: "src/**/*.ts", "src/**/*.tsx", "supabase/**/*" -->

# マルチテナント設計ガイド

## 概要

武道ONEシステムにおけるマルチテナント実装の標準パターンと必須要件を定義します。
本ガイドはテナント分離、セキュリティ、パフォーマンスの観点から、一貫した実装を保証します。

## テナント識別とコンテキスト管理

### テナント識別方法

```typescript
// src/lib/tenant/get-tenant.ts
export async function getTenantFromSubdomain(hostname: string): Promise<string | null> {
  // サブドメイン抽出パターン: [tenant].budo-one.jp
  const subdomain = hostname.split('.')[0];

  // 除外するサブドメイン
  const excludedSubdomains = ['www', 'app', 'api', 'staging'];
  if (excludedSubdomains.includes(subdomain)) {
    return null;
  }

  return subdomain;
}
```

### テナントコンテキスト管理

```typescript
// src/hooks/use-tenant.ts
interface TenantContext {
  tenantId: string;
  tenantName: string;
  settings: TenantSettings;
}

export function useTenant(): TenantContext {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

**重要**: すべてのAPIリクエストとデータベースクエリは、必ずテナントコンテキストを含める必要があります。

## Row Level Security (RLS)

RLSはマルチテナントシステムの中核となるセキュリティ機能です。

**RLSポリシーの詳細実装については `database-design.md` の「Row Level Security (RLS)」セクションを参照してください。**

主要な要件：

- すべてのテーブルでRLSを有効化
- テナント分離ポリシーの実装
- ユーザーアクセス制御の階層化
- クロステナントアクセステストの実装

## Supabaseクライアント設定

### サーバーサイドクライアント

```typescript
// src/lib/supabase/server.ts
export async function createServerClient(tenantId: string) {
  const cookieStore = cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
    options: {
      global: {
        headers: {
          'x-tenant-id': tenantId, // カスタムヘッダーでテナントID送信
        },
      },
    },
  });
}
```

### クライアントサイド設定

```typescript
// src/lib/supabase/client.ts
export function createBrowserClient(tenantId: string) {
  return createClientComponentClient({
    options: {
      global: {
        headers: {
          'x-tenant-id': tenantId,
        },
      },
    },
  });
}
```

## データベース設計規約

### テーブル設計の必須要件

1. **すべてのテーブルに`tenant_id`カラムを含める**

   ```sql
   CREATE TABLE any_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID NOT NULL REFERENCES tenants(id),
     -- その他のカラム
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **複合インデックスの作成**

   ```sql
   CREATE INDEX idx_table_tenant_lookup
     ON any_table(tenant_id, created_at DESC);
   ```

3. **外部キー制約にテナントIDを含める**
   ```sql
   ALTER TABLE child_table
     ADD CONSTRAINT fk_parent_tenant
     FOREIGN KEY (tenant_id, parent_id)
     REFERENCES parent_table(tenant_id, id);
   ```

## パフォーマンス最適化

### クエリ最適化パターン

```typescript
// ❌ 悪い例: テナントフィルタが後
const { data } = await supabase
  .from('attendance_records')
  .select('*')
  .eq('user_id', userId)
  .eq('tenant_id', tenantId); // テナントフィルタが後

// ✅ 良い例: テナントフィルタを最初に
const { data } = await supabase
  .from('attendance_records')
  .select('*')
  .eq('tenant_id', tenantId) // テナントフィルタを最初に
  .eq('user_id', userId);
```

### キャッシュ戦略

```typescript
// src/lib/cache/tenant-cache.ts
const CACHE_KEY_PREFIX = 'tenant';

export function getTenantCacheKey(tenantId: string, resource: string): string {
  return `${CACHE_KEY_PREFIX}:${tenantId}:${resource}`;
}

// 使用例
const cacheKey = getTenantCacheKey(tenantId, 'users');
```

## セキュリティチェックリスト

### 実装時の必須確認項目

- [ ] すべてのテーブルでRLSが有効化されている
- [ ] テナントIDがJWTトークンに含まれている
- [ ] APIエンドポイントでテナント検証を実施
- [ ] クロステナントアクセステストを実装
- [ ] テナント切り替え時のセッションクリア
- [ ] 管理者権限の適切なスコープ設定

### コードレビューチェックポイント

```typescript
// レビュー時に確認すべきパターン
// 1. Supabaseクエリには必ずtenant_idフィルタが存在
// 2. JWTペイロードからのtenant_id取得を検証
// 3. エラーメッセージでテナント情報を露出しない
```

## トラブルシューティング

### よくある問題と解決策

| 問題                   | 原因              | 解決策                            |
| ---------------------- | ----------------- | --------------------------------- |
| データが表示されない   | RLSポリシーの不備 | JWTトークンのtenant_idを確認      |
| クロステナントアクセス | ポリシーの穴      | USING句の条件を厳密化             |
| パフォーマンス低下     | インデックス不足  | tenant_id含む複合インデックス追加 |

## 移行とアップグレード

### 新規テーブル追加時の手順

1. テーブル作成時に`tenant_id`カラムを追加
2. RLSを有効化
3. 基本的なテナント分離ポリシーを作成
4. インデックスを作成
5. RLSテストを追加

### 既存テーブルの移行

```sql
-- 移行スクリプトテンプレート
BEGIN;
  -- tenant_idカラム追加
  ALTER TABLE existing_table
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

  -- 既存データの移行（要カスタマイズ）
  UPDATE existing_table
    SET tenant_id = (SELECT id FROM tenants LIMIT 1);

  -- NOT NULL制約追加
  ALTER TABLE existing_table
    ALTER COLUMN tenant_id SET NOT NULL;

  -- RLS有効化
  ALTER TABLE existing_table ENABLE ROW LEVEL SECURITY;

  -- ポリシー作成
  CREATE POLICY "tenant_isolation" ON existing_table
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');
COMMIT;
```

## 参考実装

実装例は以下のファイルを参照:

- テナント取得: `src/lib/tenant/`
- RLSポリシー: `supabase/migrations/`
- テスト: `tests/multitenancy/`
