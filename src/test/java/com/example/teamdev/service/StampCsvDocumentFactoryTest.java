package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("StampCsvDocumentFactoryの生成ロジック")
class StampCsvDocumentFactoryTest {

    private final StampCsvDocumentFactory factory = new StampCsvDocumentFactory();

    @Test
    @DisplayName("複数従業員の場合は代表者+他人数形式のファイル名になる")
    void createDocumentForMultipleEmployees() {
        StampHistoryDisplay history = new StampHistoryDisplay();
        history.setId(1);
        history.setEmployeeId(1);
        history.setEmployeeName("田中太郎");

        StampCsvDocumentFactory.StampCsvDocument document = factory.create(
                "2025",
                "04",
                List.of("田中太郎", "山田花子", "佐藤次郎"),
                List.of(history)
        );

        assertEquals("打刻記録（田中太郎_山田花子_他1名）2025年04月.csv", document.fileName());
        assertEquals(11, document.header().length);
        assertEquals(1, document.rows().size());
        assertEquals("田中太郎", document.rows().getFirst()[6]);
    }

    @Test
    @DisplayName("従業員名が取得できない場合はデフォルトファイル名になる")
    void createDocumentWithoutEmployeeNames() {
        StampCsvDocumentFactory.StampCsvDocument document = factory.create(
                "2025",
                "10",
                Collections.emptyList(),
                Collections.emptyList()
        );

        assertEquals("打刻記録_2025年10月.csv", document.fileName());
        assertEquals(0, document.rows().size());
        assertEquals("ID", document.header()[0]);
    }
}
