package com.example.teamdev.dto.api.profile;

public record ProfileResponse(
    ProfileEmployeeResponse employee,
    ProfileMetadataResponse metadata
) {}
