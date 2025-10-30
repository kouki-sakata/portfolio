package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.StampCsvDocumentFactory.StampCsvDocument;
import com.opencsv.CSVWriter;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 打刻記録出力
 * 出力処理
 */
@Service
public class StampOutputService {

    private static final Logger logger = LoggerFactory.getLogger(
            StampOutputService.class);

    private final StampHistoryMapper mapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final StampCsvDocumentFactory documentFactory;
    private final Clock clock;

    public StampOutputService(
        StampHistoryMapper mapper,
        LogHistoryRegistrationService logHistoryService,
        StampCsvDocumentFactory documentFactory,
        Clock clock
    ) {
        this.mapper = mapper;
        this.logHistoryService = logHistoryService;
        this.documentFactory = documentFactory;
        this.clock = clock;
    }

    public void execute(HttpServletResponse response, StampOutputForm stampOutputForm,
            Integer updateEmployeeId) throws IOException {

        StampOutputRequest request = createRequest(stampOutputForm);
        StampExportMaterial exportMaterial = collectStampHistories(request);
        StampCsvDocument document = documentFactory.create(
                request.year(), request.month(), exportMaterial.employeeNames(), exportMaterial.histories());

        writeCsvResponse(response, document);
        logExport(updateEmployeeId);
    }

    private StampOutputRequest createRequest(StampOutputForm form) {
        List<Integer> employeeIds = new ArrayList<>();
        if (form.getEmployeeIdList() != null) {
            for (String employeeIdStr : form.getEmployeeIdList()) {
                if (employeeIdStr == null) {
                    continue;
                }
                try {
                    employeeIds.add(Integer.parseInt(employeeIdStr.trim()));
                } catch (NumberFormatException e) {
                    logger.error("従業員ID変換エラー: " + employeeIdStr, e);
                }
            }
        }
        return new StampOutputRequest(form.getYear(), form.getMonth(), employeeIds);
    }

    private StampExportMaterial collectStampHistories(StampOutputRequest request) {
        List<String> employeeNames = new ArrayList<>();
        List<StampHistoryDisplay> histories = new ArrayList<>();
        List<LocalDate> datesInMonth = createDateRange(request.year(), request.month());

        for (Integer employeeId : request.employeeIds()) {
            List<StampHistoryDisplay> stampHistoryList =
                    mapper.getStampHistoryByYearMonthEmployeeId(
                            request.year(), request.month(), employeeId, datesInMonth);

            if (!stampHistoryList.isEmpty()) {
                StampHistoryDisplay stampHistory = stampHistoryList.get(0);
                String employeeName = stampHistory.getEmployeeName();
                if (employeeName != null) {
                    employeeNames.add(employeeName);
                }
            }
            histories.addAll(stampHistoryList);
        }

        return new StampExportMaterial(employeeNames, histories);
    }

    private List<LocalDate> createDateRange(String year, String month) {
        List<LocalDate> datesInMonth = new ArrayList<>();
        LocalDate firstDay = LocalDate.of(Integer.parseInt(year), Integer.parseInt(month), 1);
        LocalDate lastDay = firstDay.plusMonths(1).minusDays(1);
        for (LocalDate date = firstDay; !date.isAfter(lastDay); date = date.plusDays(1)) {
            datesInMonth.add(date);
        }
        return datesInMonth;
    }

    private void writeCsvResponse(HttpServletResponse response, StampCsvDocument document)
            throws IOException {

        String encodedFileName = URLEncoder
                .encode(document.fileName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + encodedFileName + "\"");

        try (CSVWriter csvWriter = new CSVWriter(response.getWriter())) {
            csvWriter.writeNext(document.header(), false);
            for (String[] row : document.rows()) {
                csvWriter.writeNext(row, false);
            }
        }
    }

    private void logExport(Integer updateEmployeeId) {
        Timestamp timestamp = Timestamp.from(clock.instant());
        logHistoryService.execute(6, 6, null, null, updateEmployeeId, timestamp);
    }

    private record StampOutputRequest(String year, String month, List<Integer> employeeIds) { }

    private record StampExportMaterial(List<String> employeeNames,
            List<StampHistoryDisplay> histories) { }
}
