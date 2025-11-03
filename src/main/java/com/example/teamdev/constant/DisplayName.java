package com.example.teamdev.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum DisplayName {
    HOME(1, "ホーム"),
    NEWS_MANAGEMENT(2, "お知らせ管理"),
    EMPLOYEE_MANAGEMENT(3, "社員管理"),
    STAMP_RECORD_EDIT(4, "打刻記録編集"),
    STAMP_RECORD_BULK_DELETE(5, "打刻記録一括削除"),
    STAMP_RECORD_OUTPUT(6, "CSV出力"),
    STAMP_HISTORY(7, "勤怠履歴");

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
