package com.example.teamdev.constant;

/**
 * アプリケーション全体で使用する定数を定義するクラス
 */
public final class AppConstants {

    private AppConstants() {
        // インスタンス化を防ぐ
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * 打刻関連の定数
     */
    public static final class Stamp {
        public static final String TYPE_ATTENDANCE = "1";  // 出勤
        public static final String TYPE_DEPARTURE = "2";   // 退勤
        
        public static final String NIGHT_WORK_FLAG_ON = "1";   // 夜勤フラグON
        public static final String NIGHT_WORK_FLAG_OFF = "0";  // 夜勤フラグOFF
        
        public static final String ATTENDANCE_TEXT = "出勤";
        public static final String DEPARTURE_TEXT = "退勤";

        private Stamp() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

    /**
     * 従業員関連の定数
     */
    public static final class Employee {
        public static final int ADMIN_FLAG_GENERAL = 0;  // 一般ユーザー
        public static final int ADMIN_FLAG_ADMIN = 1;    // 管理者
        
        public static final String ADMIN_AUTHORITY = "ADMIN";
        public static final String USER_AUTHORITY = "USER";

        private Employee() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

    /**
     * 操作履歴関連の定数
     */
    public static final class LogHistory {
        // 機能ID
        public static final int FUNCTION_STAMP = 1;        // 打刻機能
        public static final int FUNCTION_NEWS = 2;         // お知らせ機能
        public static final int FUNCTION_EMPLOYEE = 3;     // 従業員機能
        public static final int FUNCTION_PROFILE = 6;      // プロフィール機能
        
        // 操作種別ID
        public static final int OPERATION_ATTENDANCE = 1;  // 出勤
        public static final int OPERATION_DEPARTURE = 2;   // 退勤
        public static final int OPERATION_REGISTER = 3;    // 登録
        public static final int OPERATION_DELETE = 4;      // 削除
        public static final int OPERATION_RELEASE = 5;     // 公開
        public static final int OPERATION_PROFILE_VIEW = 6;    // プロフィール閲覧
        public static final int OPERATION_PROFILE_UPDATE = 7;  // プロフィール更新

        private LogHistory() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

    /**
     * 日時フォーマット関連の定数
     */
    public static final class DateFormat {
        public static final String ISO_LOCAL_DATE_TIME = "yyyy-MM-dd'T'HH:mm:ss";
        public static final String DISPLAY_DATE_TIME = "yyyy/MM/dd HH:mm:ss";
        public static final String DISPLAY_DATE = "yyyy/MM/dd";
        public static final String DATABASE_DATE = "yyyy-MM-dd";

        private DateFormat() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

    /**
     * セッション・セキュリティ関連の定数
     */
    public static final class Security {
        public static final String BCRYPT_PREFIX_2A = "$2a$";
        public static final String BCRYPT_PREFIX_2B = "$2b$";
        public static final String BCRYPT_PREFIX_2Y = "$2y$";
        
        public static final String ANONYMOUS_USER = "anonymousUser";

        private Security() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

    /**
     * お知らせ関連の定数
     */
    public static final class News {
        public static final int HOME_DISPLAY_LIMIT = 4;  // ホーム画面でのお知らせ表示件数上限
        public static final int TITLE_MAX_LENGTH = 100;

        public enum Label {
            IMPORTANT,
            SYSTEM,
            GENERAL;

            public static boolean isValid(String value) {
                if (value == null) {
                    return false;
                }
                for (Label label : values()) {
                    if (label.name().equals(value)) {
                        return true;
                    }
                }
                return false;
            }
        }

        public static final String DEFAULT_LABEL = Label.GENERAL.name();

        private News() {
            throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
        }
    }

}
