package com.example.teamdev.service;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

@Service
public class FeatureFlagService {

    private final Environment environment;

    public FeatureFlagService(Environment environment) {
        this.environment = environment;
    }

    public boolean isShadcnUiEnabled() {
        return !environment.acceptsProfiles(Profiles.of("legacy-ui"));
    }
}
