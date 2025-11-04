package com.example.teamdev.dto.api.profile;

public record ProfileEmployeeResponse(
    int id,
    String fullName,
    String email,
    boolean admin,
    String updatedAt
) {}
