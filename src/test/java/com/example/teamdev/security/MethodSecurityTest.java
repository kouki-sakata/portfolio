package com.example.teamdev.security;

import com.example.teamdev.controller.api.EmployeeRestController;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("APIのメソッドレベルセキュリティテスト")
class MethodSecurityTest {

    private static final Map<String, String> ADMIN_ONLY_METHODS = Map.of(
        "create", "hasRole('ADMIN')",
        "update", "hasRole('ADMIN')",
        "delete", "hasRole('ADMIN')"
    );

    @Test
    @DisplayName("従業員管理APIの管理者専用エンドポイントが@PreAuthorizeで保護されている")
    void employeeAdminEndpointsRequireAdminRole() {
        Method[] methods = EmployeeRestController.class.getDeclaredMethods();

        ADMIN_ONLY_METHODS.forEach((methodName, expectedExpression) -> {
            Method method = findMethod(methods, methodName);
            PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

            assertThat(annotation)
                .withFailMessage("%s should be secured with @PreAuthorize", methodName)
                .isNotNull();

            assertThat(annotation.value())
                .withFailMessage("%s should require expression %s", methodName, expectedExpression)
                .isEqualTo(expectedExpression);
        });
    }

    private Method findMethod(Method[] methods, String methodName) {
        return Arrays.stream(methods)
            .filter(method -> method.getName().equals(methodName))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Method %s not found".formatted(methodName)));
    }
}
