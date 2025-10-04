package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.common.FeatureFlagsResponse;
import com.example.teamdev.service.FeatureFlagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/feature-flags")
public class FeatureFlagRestController {

    private final FeatureFlagService featureFlagService;

    public FeatureFlagRestController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    public ResponseEntity<FeatureFlagsResponse> getFeatureFlags() {
        FeatureFlagsResponse response = new FeatureFlagsResponse(featureFlagService.isShadcnUiEnabled());
        return ResponseEntity.ok(response);
    }
}
