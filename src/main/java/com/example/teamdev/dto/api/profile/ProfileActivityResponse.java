package com.example.teamdev.dto.api.profile;

import java.util.List;

public record ProfileActivityResponse(
    int page,
    int size,
    int totalPages,
    long totalElements,
    List<ProfileActivityItemResponse> items
) {}
