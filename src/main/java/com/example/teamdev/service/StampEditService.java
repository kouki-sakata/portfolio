package com.example.teamdev.service;

import com.example.teamdev.dto.StampEditData;
import com.example.teamdev.service.stamp.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;
import java.util.Map;


/**
 * 打刻記録編集サービス。
 * SOLID原則に従ってリファクタリングされ、各責務を専門クラスにデリゲートします。
 * このクラスはオーケストレーターとして機能し、全体のワークフローを制御します。
 */
@Service
public class StampEditService {

    private final StampFormDataExtractor dataExtractor;
    private final OutTimeAdjuster outTimeAdjuster;
    private final StampHistoryPersistence stampPersistence;
    private final LogHistoryRegistrationService logHistoryService;
    private final Clock clock;

    /**
     * StampEditServiceのコンストラクタ。
     *
     * @param dataExtractor      フォームデータ抽出器
     * @param outTimeAdjuster    退勤時刻調整器
     * @param stampPersistence   打刻履歴永続化
     * @param logHistoryService  ログ履歴サービス
     */
    public StampEditService(
            StampFormDataExtractor dataExtractor,
            OutTimeAdjuster outTimeAdjuster,
            StampHistoryPersistence stampPersistence,
            LogHistoryRegistrationService logHistoryService,
            Clock clock) {
        this.dataExtractor = dataExtractor;
        this.outTimeAdjuster = outTimeAdjuster;
        this.stampPersistence = stampPersistence;
        this.logHistoryService = logHistoryService;
        this.clock = clock;
    }

    /**
     * 打刻編集リストを処理し、データベースに保存または更新します。
     * リファクタリング後は各処理を専門クラスにデリゲートし、
     * このメソッドは30行以下に収まるオーケストレーターとして機能します。
     *
     * @param stampEditList    打刻編集データのリスト
     * @param updateEmployeeId 更新を実行する従業員のID
     */
    @Transactional
    public void execute(List<Map<String, Object>> stampEditList, int updateEmployeeId) {
        boolean anySaved = processStampEditList(stampEditList, updateEmployeeId);

        if (anySaved) {
            recordLogHistory(stampEditList, updateEmployeeId);
        }
    }

    /**
     * 打刻編集リストを処理します。
     *
     * @param stampEditList    打刻編集データのリスト
     * @param updateEmployeeId 更新者の従業員ID
     * @return 1つ以上の保存または更新が行われた場合true
     */
    private boolean processStampEditList(List<Map<String, Object>> stampEditList,
            int updateEmployeeId) {
        boolean anySaved = false;

        for (Map<String, Object> stampEdit : stampEditList) {
            boolean saved = processSingleStampEdit(stampEdit, updateEmployeeId);
            anySaved |= saved;
        }

        return anySaved;
    }

    /**
     * 単一の打刻編集データを処理します。
     *
     * @param stampEdit        打刻編集データ
     * @param updateEmployeeId 更新者の従業員ID
     * @return 保存または更新が行われた場合true
     */
    private boolean processSingleStampEdit(Map<String, Object> stampEdit,
            int updateEmployeeId) {
        // Step 1: データ抽出
        StampEditData data = dataExtractor.extractFromMap(stampEdit);

        // Step 2: 時刻を直接OffsetDateTimeに変換（LocalDateを使用）
        java.time.OffsetDateTime inTime = parseToOffsetDateTime(
            data.getStampDate(), data.getInTime());
        java.time.OffsetDateTime outTime = parseToOffsetDateTime(
            data.getStampDate(), data.getOutTime());

        // Step 3: 退勤時刻調整
        java.time.OffsetDateTime adjustedOutTime = outTimeAdjuster.adjustOutTimeIfNeeded(inTime, outTime);

        // Step 4: データ永続化
        return stampPersistence.saveOrUpdate(data, inTime, adjustedOutTime, updateEmployeeId);
    }

    /**
     * 日付と時刻文字列を直接OffsetDateTimeに変換します。
     * 中間のTimestamp変換を排除し、パフォーマンスを改善します。
     *
     * @param date 打刻日付
     * @param time 時刻（HH:mm）
     * @return JST（+09:00）のOffsetDateTime
     */
    private java.time.OffsetDateTime parseToOffsetDateTime(java.time.LocalDate date,
                                                             String time) {
        if (time == null || time.isEmpty()) {
            return null;
        }
        // LocalDateからISO形式の文字列を生成（LocalDateは既にゼロパディング済み）
        String isoString = String.format("%sT%s:00+09:00", date.toString(), time);
        return java.time.OffsetDateTime.parse(isoString, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    /**
     * ログ履歴を記録します。
     *
     * @param stampEditList    打刻編集データのリスト
     * @param updateEmployeeId 更新者の従業員ID
     */
    private void recordLogHistory(List<Map<String, Object>> stampEditList,
            int updateEmployeeId) {
        // 最初のエントリから従業員IDを取得
        // NOTE: 現在は全エントリで同じ従業員IDを想定している
        // マルチテナント対応時には各エントリごとにログを記録する必要がある
        String firstEmployeeIdStr = stampEditList.get(0).get("employeeId").toString();
        if (firstEmployeeIdStr.contains(",")) {
            firstEmployeeIdStr = firstEmployeeIdStr.split(",")[0];
        }
        int targetEmployeeId = Integer.parseInt(firstEmployeeIdStr);

        Timestamp timestamp = Timestamp.from(clock.instant());
        logHistoryService.execute(4, 3, null, targetEmployeeId,
                updateEmployeeId, timestamp);
    }
}
