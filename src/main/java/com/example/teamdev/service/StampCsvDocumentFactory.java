package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * CSVファイル名およびコンテンツを組み立てるファクトリー。
 * 出力データの構造を切り出し、StampOutputServiceの責務を小さく保つ。
 */
@Component
class StampCsvDocumentFactory {

    StampCsvDocument create(String year, String month,
            List<String> employeeNames,
            List<StampHistoryDisplay> stampHistoryList) {

        String fileName = buildFileName(year, month, employeeNames);
        List<String[]> csvRows = stampHistoryList.stream()
                .map(this::mapToRow)
                .toList();

        return new StampCsvDocument(
                fileName,
                HEADER,
                List.copyOf(csvRows)
        );
    }

    private String buildFileName(String year, String month, List<String> employeeNames) {
        if (employeeNames == null || employeeNames.isEmpty()) {
            return "打刻記録_" + year + "年" + month + "月.csv";
        }

        if (employeeNames.size() == 1) {
            return "打刻記録（" + employeeNames.get(0) + "）" + year + "年" + month + "月.csv";
        }

        if (employeeNames.size() == 2) {
            return "打刻記録（" + employeeNames.get(0) + "_" + employeeNames.get(1) + "）"
                    + year + "年" + month + "月.csv";
        }

        int otherMemberCount = employeeNames.size() - 2;
        return "打刻記録（" + employeeNames.get(0) + "_" + employeeNames.get(1) + "_他"
                + otherMemberCount + "名）" + year + "年" + month + "月.csv";
    }

    private String[] mapToRow(StampHistoryDisplay entity) {
        return new String[]{
                valueOf(entity.getId()),
                safe(entity.getYear()),
                safe(entity.getMonth()),
                safe(entity.getDay()),
                safe(entity.getDayOfWeek()),
                valueOf(entity.getEmployeeId()),
                safe(entity.getEmployeeName()),
                safe(entity.getUpdateEmployeeName()),
                safe(entity.getInTime()),
                safe(entity.getOutTime()),
                safe(entity.getUpdateDate())
        };
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String valueOf(Integer value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static final String[] HEADER = new String[]{
            "ID",
            "年",
            "月",
            "日",
            "曜日",
            "従業員ID",
            "従業員氏名",
            "更新者氏名",
            "出勤時刻",
            "退勤時刻",
            "更新日時"
    };

    record StampCsvDocument(String fileName, String[] header, List<String[]> rows) { }
}
