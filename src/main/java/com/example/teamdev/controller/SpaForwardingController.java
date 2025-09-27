package com.example.teamdev.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class SpaForwardingController {

    private static final String SPA_PATH_REGEX = "^(?!api|actuator|error|swagger-ui|v3|assets|static)(?!.*\\.).*$";

    @GetMapping("/")
    public String forwardRoot() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:" + SPA_PATH_REGEX + "}")
    public String forwardSingle(@PathVariable String path) {
        return "forward:/index.html";
    }

    @GetMapping("/{path:" + SPA_PATH_REGEX + "}/**")
    public String forwardNested(@PathVariable String path) {
        return "forward:/index.html";
    }
}
