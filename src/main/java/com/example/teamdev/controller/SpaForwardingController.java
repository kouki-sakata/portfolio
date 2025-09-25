package com.example.teamdev.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class SpaForwardingController {

    @GetMapping("/")
    public String forwardRoot() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!api|actuator|error|swagger-ui|v3|assets|static).*$}")
    public String forwardSingle(@PathVariable String path) {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!api|actuator|error|swagger-ui|v3|assets|static).*$}/**")
    public String forwardNested(@PathVariable String path) {
        return "forward:/index.html";
    }
}
