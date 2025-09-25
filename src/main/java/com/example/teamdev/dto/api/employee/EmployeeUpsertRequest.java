package com.example.teamdev.dto.api.employee;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployeeUpsertRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank @Email String email,
    @Size(min = 8, message = "Password must be at least 8 characters") String password,
    boolean admin
) {
}
