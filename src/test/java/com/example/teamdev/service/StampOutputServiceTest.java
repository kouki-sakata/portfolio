package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
@DisplayName("StampOutputServiceの振る舞い")
class StampOutputServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2025-04-01T00:00:00Z");

    @Mock
    private StampHistoryMapper mapper;

    @Mock
    private LogHistoryRegistrationService logHistoryRegistrationService;

    @Mock
    private StampCsvDocumentFactory documentFactory;

    @Mock
    private Clock clock;

    @InjectMocks
    private StampOutputService service;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(FIXED_INSTANT);
    }

    @Test
    @DisplayName("従業員の打刻情報をCSVとしてレスポンスに書き出す")
    void executeWritesCsvResponse() throws IOException {
        StampOutputForm form = new StampOutputForm(List.of("1", "2"), "2025", "04");
        MockHttpServletResponse response = new MockHttpServletResponse();
        int updateEmployeeId = 99;

        StampHistoryDisplay history1 = new StampHistoryDisplay();
        history1.setEmployeeId(1);
        history1.setEmployeeName("田中太郎");

        StampHistoryDisplay history2 = new StampHistoryDisplay();
        history2.setEmployeeId(2);
        history2.setEmployeeName("山田花子");

        when(mapper.getStampHistoryByYearMonthEmployeeId(eq("2025"), eq("04"), eq(1), anyList()))
                .thenReturn(List.of(history1));
        when(mapper.getStampHistoryByYearMonthEmployeeId(eq("2025"), eq("04"), eq(2), anyList()))
                .thenReturn(List.of(history2));

        StampCsvDocumentFactory.StampCsvDocument document =
                new StampCsvDocumentFactory.StampCsvDocument(
                        "打刻記録（田中太郎_山田花子）2025年04月.csv",
                        new String[]{"header-1", "header-2"},
                        List.of(
                                new String[]{"row1-col1", "row1-col2"},
                                new String[]{"row2-col1", "row2-col2"}
                        )
                );
        when(documentFactory.create(eq("2025"), eq("04"), anyList(), anyList()))
                .thenReturn(document);

        service.execute(response, form, updateEmployeeId);

        ArgumentCaptor<List<String>> namesCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<List<StampHistoryDisplay>> historyCaptor = ArgumentCaptor.forClass(List.class);
        verify(documentFactory).create(eq("2025"), eq("04"), namesCaptor.capture(), historyCaptor.capture());

        assertEquals(List.of("田中太郎", "山田花子"), namesCaptor.getValue());
        assertEquals(2, historyCaptor.getValue().size());
        assertTrue(historyCaptor.getValue().containsAll(List.of(history1, history2)));

        String expectedFileName = URLEncoder.encode(document.fileName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        assertEquals("text/csv; charset=UTF-8", response.getContentType());
        assertEquals("attachment; filename=\"" + expectedFileName + "\"",
                response.getHeader("Content-Disposition"));
        String expectedCsv = String.join("\n",
                List.of(
                        "header-1,header-2",
                        "row1-col1,row1-col2",
                        "row2-col1,row2-col2"
                )) + "\n";
        assertEquals(expectedCsv, response.getContentAsString().replace("\r", ""));

        verify(logHistoryRegistrationService).execute(
                eq(6), eq(6), isNull(), isNull(), eq(updateEmployeeId), any(Timestamp.class)
        );
    }
}
