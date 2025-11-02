package com.example.teamdev.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum DisplayName {
    HOME(1, "ホーム"),
    STAMP_HISTORY(2, "勤怠履歴"),
    NEWS_MANAGEMENT(3, "お知らせ管理"),
    EMPLOYEE_MANAGEMENT(4, "社員管理"),
    STAMP_RECORD_BULK_DELETE(5, "打刻記録一括削除"),
    STAMP_RECORD_OUTPUT(6, "CSV出力");

    private final int code;
    private final String name;

    public static String getNameByCode(int code) {
        for (DisplayName displayName : DisplayName.values()) {
            if (displayName.getCode() == code) {
                return displayName.getName();
            }
        }
        return null;
    }
}
