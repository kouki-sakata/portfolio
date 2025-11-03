package com.example.teamdev.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DisplayNameTest {

    private static Stream<Arguments> codeToNameProvider() {
        return Stream.of(
                Arguments.of(1, "ホーム"),
                Arguments.of(2, "お知らせ管理"),
                Arguments.of(3, "社員管理"),
                Arguments.of(4, "打刻記録編集"),
                Arguments.of(5, "打刻記録一括削除"),
                Arguments.of(6, "CSV出力"),
                Arguments.of(7, "勤怠履歴")
        );
    }

    @ParameterizedTest
    @MethodSource("codeToNameProvider")
    void getNameByCode_returnsExpectedDisplayName(int code, String expectedDisplayName) {
        assertThat(DisplayName.getNameByCode(code)).isEqualTo(expectedDisplayName);
    }

    @Test
    void getNameByCode_withUnknownCode_returnsNull() {
        assertThat(DisplayName.getNameByCode(999)).isNull();
    }
}
