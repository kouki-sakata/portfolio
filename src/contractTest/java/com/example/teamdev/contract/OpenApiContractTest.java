package com.example.teamdev.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;
import java.nio.file.Files;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * OpenAPI契約検証（openapi4j）
 * - 実行には Gradle プロパティ -PenableOpenApiContract とネットワークの制約解除が必要です
 * - 依存関係は build.gradle の conditional sourceSet で有効化されます
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class OpenApiContractTest extends com.example.teamdev.testconfig.PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void openapi_is_parsable_and_contains_key_paths() throws Exception {
        String json = mockMvc.perform(get("/v3/api-docs").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        // 一時ファイルに書き出して openapi4j でパース
        File tmp = new File("build/openapi.json");
        tmp.getParentFile().mkdirs();
        Files.writeString(tmp.toPath(), json);

        // openapi4j: org.openapi4j.parser.OpenApi3Parser / model.v3.OpenApi3
        // 依存は contractTest のみが参照するため、通常ビルドや通常テストには影響しません
        org.openapi4j.parser.model.v3.OpenApi3 api = new org.openapi4j.parser.OpenApi3Parser()
            .parse(tmp, true);

        assertThat(api).isNotNull();
        assertThat(api.getOpenapi()).isNotBlank();

        // 代表的なパスの存在を検証（細かなレスポンス検証は後続で OperationValidator を追加予定）
        assertThat(api.getPaths()).isNotNull();
        assertThat(api.getPaths().get("/api/auth/session")).isNotNull();
        assertThat(api.getPaths().get("/api/auth/login")).isNotNull();
    }
}

