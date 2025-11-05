package com.example.teamdev.dto.api.profile;

public record ProfileScheduleResponse(
    String start,
    String end,
    int breakMinutes
) {}
