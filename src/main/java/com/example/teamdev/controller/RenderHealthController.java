package com.example.teamdev.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RenderHealthController {

    @GetMapping("/internal/health")
    public ResponseEntity<String> internalHealth() {
        return ResponseEntity.ok("OK");
    }
}
