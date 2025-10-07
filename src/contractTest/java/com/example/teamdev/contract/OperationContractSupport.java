package com.example.teamdev.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.openapi4j.operation.validator.model.Request;
import org.openapi4j.operation.validator.model.Response;
import org.openapi4j.operation.validator.model.impl.Body;
import org.openapi4j.operation.validator.model.impl.DefaultResponse;
import org.openapi4j.operation.validator.validation.OperationValidator;
import org.openapi4j.schema.validator.ValidationData;
import org.openapi4j.parser.OpenApi3Parser;
import org.openapi4j.parser.model.v3.OpenApi3;
import org.openapi4j.parser.model.v3.Operation;
import org.openapi4j.parser.model.v3.Path;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.nio.file.Files;
import java.util.Collection;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public final class OperationContractSupport {
    private static volatile OpenApi3 CACHED_API;

    private OperationContractSupport() {}

    public static OpenApi3 loadOrGetApi(MockMvc mockMvc) throws Exception {
        if (CACHED_API != null) return CACHED_API;
        synchronized (OperationContractSupport.class) {
            if (CACHED_API != null) return CACHED_API;
            MvcResult result = mockMvc.perform(get("/v3/api-docs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
            String json = result.getResponse().getContentAsString();
            File out = new File("build/openapi.json");
            out.getParentFile().mkdirs();
            Files.writeString(out.toPath(), json);
            CACHED_API = new OpenApi3Parser().parse(out, true);
        }
        return CACHED_API;
    }

    public static OperationValidator validator(OpenApi3 api, String pathString, Request.Method method) {
        Path path = api.getPaths().get(pathString);
        if (path == null) {
            throw new IllegalArgumentException("Path not found in OpenAPI spec: " + pathString);
        }
        
        // Get the operation based on the HTTP method
        Operation operation = switch (method) {
            case GET -> path.getGet();
            case POST -> path.getPost();
            case PUT -> path.getPut();
            case PATCH -> path.getPatch();
            case DELETE -> path.getDelete();
            case HEAD -> path.getHead();
            case OPTIONS -> path.getOptions();
            case TRACE -> path.getTrace();
        };
        
        if (operation == null) {
            throw new IllegalArgumentException(
                "Operation " + method + " not found for path: " + pathString);
        }
        
        return new OperationValidator(api, path, operation);
    }

    public static Response toResponse(HttpServletResponse servletResponse, ObjectMapper mapper) throws Exception {
        int status = servletResponse.getStatus();
        DefaultResponse.Builder builder = new DefaultResponse.Builder(status);

        // headers
        Collection<String> headerNames = servletResponse.getHeaderNames();
        if (headerNames != null) {
            for (String name : headerNames) {
                for (String v : servletResponse.getHeaders(name)) {
                    builder.header(name, v);
                }
            }
        }

        String content = servletResponse.getContentType();
        String body = servletResponse instanceof org.springframework.mock.web.MockHttpServletResponse m ? m.getContentAsString() : null;
        if (body != null && !body.isBlank() && content != null && content.contains("json")) {
            JsonNode node = mapper.readTree(body);
            builder.body(Body.from(node));
        }

        return builder.build();
    }

    public static void assertValid(OperationValidator validator, Response response) {
        ValidationData<Void> results = new ValidationData<>();
        validator.validateResponse(response, results);
        if (!results.isValid()) {
            throw new AssertionError("OpenAPI validation failed: " + results.results().toString());
        }
    }
}

