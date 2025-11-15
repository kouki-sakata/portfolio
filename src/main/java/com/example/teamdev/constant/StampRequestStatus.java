package com.example.teamdev.constant;

/**
 * 打刻修正リクエストのステータス定数。
 */
public enum StampRequestStatus {

    NEW(false),
    PENDING(false),
    APPROVED(true),
    REJECTED(true),
    CANCELLED(true);

    private final boolean finalState;

    StampRequestStatus(boolean finalState) {
        this.finalState = finalState;
    }

    public boolean isFinalState() {
        return finalState;
    }

    public static boolean isFinalState(String value) {
        if (value == null) {
            return false;
        }
        try {
            return StampRequestStatus.valueOf(value).isFinalState();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
