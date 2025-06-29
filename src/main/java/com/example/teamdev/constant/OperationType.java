package com.example.teamdev.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum OperationType {
    ATTENDANCE(1, "出勤"),
    LEAVE(2, "退勤"),
    REGISTRATION(3, "登録"),
    DELETION(4, "削除"),
    PUBLISH(5, "公開"),
    OUTPUT(6, "出力");

    private final int code;
    private final String name;

    public static String getNameByCode(int code) {
        for (OperationType operationType : OperationType.values()) {
            if (operationType.getCode() == code) {
                return operationType.getName();
            }
        }
        return null;
    }
}