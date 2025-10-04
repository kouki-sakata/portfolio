package com.example.teamdev.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final String SPA_FORWARD_DESTINATION = "forward:/index.html";
    private static final String SPA_PATH_REGEX = "(?!api|actuator|error|swagger-ui|v3|assets|static)(?!.*\\.).*";

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName(SPA_FORWARD_DESTINATION);
        registry.addViewController("/{path:" + SPA_PATH_REGEX + "}")
            .setViewName(SPA_FORWARD_DESTINATION);
        registry.addViewController("/{path:" + SPA_PATH_REGEX + "}/**")
            .setViewName(SPA_FORWARD_DESTINATION);
    }
}
