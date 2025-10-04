package com.example.teamdev.service;

import org.springframework.stereotype.Service;

@Service
public class FeatureFlagService {

    public boolean isShadcnUiEnabled() {
        return true;
    }
}
