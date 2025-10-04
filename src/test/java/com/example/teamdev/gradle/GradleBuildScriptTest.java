package com.example.teamdev.gradle;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GradleBuildScriptTest {

    @Test
    @DisplayName("bootJar should depend on npmBuild to include SPA assets")
    void bootJarDependsOnFrontendBuild() throws IOException {
        String script = Files.readString(Path.of("build.gradle"));
        assertThat(script)
            .as("bootJar should invoke npmBuild to package frontend assets")
            .contains("tasks.named('bootJar')")
            .contains("dependsOn 'npmBuild'");
    }
}
