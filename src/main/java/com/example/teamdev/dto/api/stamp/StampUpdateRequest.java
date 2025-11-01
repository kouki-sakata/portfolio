package com.example.teamdev.dto.api.stamp;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;

/**
 * 打刻履歴更新用リクエストDTO。
 */
public record StampUpdateRequest(
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "inTime must match HH:mm format"
    )
    String inTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "outTime must match HH:mm format"
    )
    String outTime
) {
    @AssertTrue(message = "Either inTime or outTime must be provided")
    public boolean hasUpdatableField() {
        return (inTime != null && !inTime.isBlank()) || (outTime != null && !outTime.isBlank());
    }
}
