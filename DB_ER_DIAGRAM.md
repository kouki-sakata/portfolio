# データベースER図

このドキュメントは、`01_schema.sql` に基づくデータベースのエンティティ関連図（ER図）です。

```mermaid
erDiagram
    employee {
        int id PK "ID"
        varchar(30) first_name "姓"
        varchar(30) last_name "名"
        varchar(255) email "メールアドレス"
        varchar(60) password "パスワード"
        int admin_flag "管理者フラグ (0: 一般, 1: 管理者)"
        timestamp update_date "更新日時"
    }

    stamp_history {
        int id PK "ID"
        varchar(4) year "年"
        varchar(2) month "月"
        varchar(2) day "日"
        int employee_id FK "従業員ID"
        timestamp in_time "出勤時刻"
        timestamp out_time "退勤時刻"
        int update_employee_id FK "更新従業員ID"
        timestamp update_date "更新日時"
    }

    log_history {
        int id PK "ID"
        int display_name "画面名"
        int operation_type "操作種別"
        timestamp stamp_time "打刻時刻"
        int employee_id FK "従業員ID"
        int update_employee_id FK "更新従業員ID"
        timestamp update_date "更新日時"
    }

    news {
        int id PK "ID"
        varchar(10) news_date "お知らせ日付"
        varchar(255) content "内容"
        tinyint(1) release_flag "公開フラグ (0: 非公開, 1: 公開)"
        timestamp update_date "更新日時"
    }

    employee ||--o{ stamp_history : "has"
    employee ||--o{ log_history : "creates"

```

## テーブル概要

| テーブル名 | 説明 |
| :--- | :--- |
| `employee` | 従業員情報。ログイン情報や管理者権限を管理します。 |
| `stamp_history` | 日々の出退勤の打刻記録を保存します。 |
| `log_history` | システム内の操作履歴を記録します。 |
| `news` | ホーム画面に表示するお知らせ情報を管理します。 |

## 主なリレーション

-   `employee` と `stamp_history`:
    -   `stamp_history.employee_id` が `employee.id` を参照します。各打刻記録がどの従業員のものかを紐付けます。
-   `employee` と `log_history`:
    -   `log_history.employee_id` が `employee.id` を参照します。各操作ログをどの従業員が実行したかを紐付けます。

