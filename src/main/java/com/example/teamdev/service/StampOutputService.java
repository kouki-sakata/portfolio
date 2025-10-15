package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 打刻記録出力
 * 出力処理
 */
@Service
public class StampOutputService {

    private static final Logger logger = LoggerFactory.getLogger(
            StampOutputService.class);

    @Autowired
    StampHistoryMapper mapper;
    @Autowired
    LogHistoryRegistrationService logHistoryService;
    @Autowired
    private ObjectMapper objectMapper;

    public void execute(HttpServletResponse response, StampOutputForm stampOutputForm,
            Integer updateEmployeeId) throws IOException {

        String year = stampOutputForm.getYear();
        String month = stampOutputForm.getMonth();

        // 対象年月のすべての日付を生成
        List<LocalDate> datesInMonth = new ArrayList<>();
        LocalDate firstDay = LocalDate.of(Integer.parseInt(year), Integer.parseInt(month), 1);
        LocalDate lastDay = firstDay.plusMonths(1).minusDays(1);
        for (LocalDate date = firstDay; !date.isAfter(lastDay); date = date.plusDays(1)) {
            datesInMonth.add(date);
        }

        // 全従業員の打刻データを格納するリスト
        List<StampHistoryDisplay> allStampHistoryList = new ArrayList<>();
        // 従業員名を保持するリスト（ファイル名用）
        List<String> employeeNames = new ArrayList<>();
        // 処理対象の従業員IDリスト
        List<Integer> employeeIds = new ArrayList<>();

        // 各従業員IDに対して処理を実行
        for (String employeeIdStr : stampOutputForm
                .getEmployeeIdList()) {
            try {
                // 空白を除去してIntegerに変換
                int employeeId = Integer.parseInt(employeeIdStr.trim());
                employeeIds.add(employeeId);

                // 対象年月・対象従業員IDの打刻記録をカレンダー形式で取得する
                List<StampHistoryDisplay> stampHistoryList = mapper
                        .getStampHistoryByYearMonthEmployeeId(year,
                                month, employeeId, datesInMonth);

                // 従業員名を取得
                if (!stampHistoryList.isEmpty()) {
                    StampHistoryDisplay stampHistory = stampHistoryList
                            .get(0);
                    Map<String, Object> stampHistoryMap = objectMapper
                            .convertValue(stampHistory, Map.class);
                    String employeeName = stampHistoryMap
                            .get("employee_name").toString();
                    employeeNames.add(employeeName);
                }

                // 全体のリストに追加
                allStampHistoryList.addAll(stampHistoryList);

            } catch (NumberFormatException e) {
                // 数値変換エラーの場合はログ出力するなどの処理を追加
                logger.error("従業員ID変換エラー: " + employeeIdStr, e);
            }
        }

        // CSVファイルの出力処理
        outputCsvFile(response, year, month, employeeNames,
                allStampHistoryList);
        // 履歴記録
        logHistoryService.execute(6, 6, null, null, updateEmployeeId,
                Timestamp.valueOf(LocalDateTime.now()));
    }

    /**
     * CSVファイルを出力する
     *
     * @param response         HTTPレスポンス
     * @param year             年
     * @param month            月
     * @param employeeNames    従業員名リスト
     * @param stampHistoryList 打刻履歴リスト
     * @throws IOException 入出力例外
     */
    private void outputCsvFile(HttpServletResponse response,
            String year, String month,
            List<String> employeeNames,
            List<StampHistoryDisplay> stampHistoryList)
            throws IOException {

        int otherMemberCount = employeeNames.size() - 2;

        // ファイル名を組み立てる
        String fileName;
        if (employeeNames.size() == 1) {
            // 1人の場合は個人名を使用
            fileName = "打刻記録（" + employeeNames.get(0) + "）" + year
                    + "年"
                    + month
                    + "月.csv";
        } else if (employeeNames.size() == 2) {
            fileName = "打刻記録（" + employeeNames.get(0) + "_"
                    + employeeNames.get(1) + "）" + year
                    + "年"
                    + month
                    + "月.csv";
        } else if (employeeNames.size() >= 3) {
            // 複数人の場合は「複数名」と表示
            fileName = "打刻記録（" + employeeNames.get(0) + "_"
                    + employeeNames.get(1) + "_" + "他"
                    + otherMemberCount + "名"
                    + "）"
                    + year
                    + "年"
                    + month
                    + "月.csv";
        } else {
            // 名前が取得できなかった場合
            fileName = "打刻記録_" + year + "年" + month + "月.csv";
        }

        // ファイル名をUTF-8でエンコードする
        String encodedFileName = URLEncoder
                .encode(fileName, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        // レスポンスの設定
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + encodedFileName + "\"");

        // CSV出力
        try (PrintWriter writer = response.getWriter()) {
            // ヘッダー行を追加
            writer.println(StampHistoryDisplay.getCsvHeader());
            // データ行を追加
            for (StampHistoryDisplay entity : stampHistoryList) {
                writer.println(entity.toCsvString());
            }
        }
    }
}
