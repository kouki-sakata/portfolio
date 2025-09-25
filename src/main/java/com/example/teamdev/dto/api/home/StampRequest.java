package com.example.teamdev.dto.api.home;

import jakarta.validation.constraints.NotBlank;

public record StampRequest(
    @NotBlank String stampType,
    @NotBlank String stampTime,
    @NotBlank String nightWorkFlag
) {
}
