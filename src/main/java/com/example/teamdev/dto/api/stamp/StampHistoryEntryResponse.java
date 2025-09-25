package com.example.teamdev.dto.api.stamp;

public record StampHistoryEntryResponse(
    Integer id,
    String year,
    String month,
    String day,
    String dayOfWeek,
    Integer employeeId,
    String employeeName,
    String updateEmployeeName,
    String inTime,
    String outTime,
    String updateDate
) {
}
