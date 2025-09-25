package com.example.teamdev.dto.api.employee;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record EmployeeDeleteRequest(
    @NotEmpty List<Integer> ids
) {
}
