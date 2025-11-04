package com.example.teamdev.dto.api.profile;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileMetadataUpdateRequest(
    @Size(max = 256) String address,
    @Size(max = 128) String department,
    @Size(max = 64) String employeeNumber,
    @Size(max = 1000) String activityNote,
    @Size(max = 128) String location,
    @Size(max = 128) String manager,
    @Size(max = 32) String workStyle,
    @Size(max = 16) @JsonAlias("scheduleStart") String scheduleStart,
    @Size(max = 16) @JsonAlias("scheduleEnd") String scheduleEnd,
    @Min(0) @Max(600) @JsonAlias("scheduleBreakMinutes") Integer scheduleBreakMinutes,
    @Size(max = 32) String status,
    @Size(max = 32) String joinedAt,
    @Size(max = 512) String avatarUrl
) {}
