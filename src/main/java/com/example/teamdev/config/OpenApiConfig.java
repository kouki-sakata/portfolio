package com.example.teamdev.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI teamDevelopOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("TeamDevelop Bravo API")
                .description("勤怠管理システムの REST API ドキュメント")
                .version("v1")
                .contact(new Contact()
                    .name("TeamDevelop SRE")
                    .email("sre@example.com"))
                .license(new License()
                    .name("Apache License Version 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0")))
            .externalDocs(new ExternalDocumentation()
                .description("プロジェクト README")
                .url("https://github.com/your-org/TeamDevelopBravo"));
    }
}
