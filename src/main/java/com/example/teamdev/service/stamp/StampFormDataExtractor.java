package com.example.teamdev.service.stamp;

import com.example.teamdev.dto.StampEditData;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 打刻編集フォームデータの抽出に特化したコンポーネント。
 * Mapから構造化されたデータへの変換を担当します。
 * 単一責任の原則に従い、データ抽出のみを責務とします。
 */
@Component
public class StampFormDataExtractor {

    /**
     * MapからStampEditDataオブジェクトを生成します。
     * カンマ区切り対策も含めて安全にデータを抽出します。
     *
     * @param stampEdit フォームデータを含むMap
     * @return 抽出された打刻編集データ
     */
    public StampEditData extractFromMap(Map<String, Object> stampEdit) {
        // 基本情報の抽出
        String year = extractString(stampEdit, "year");
        String month = extractString(stampEdit, "month");
        String day = extractString(stampEdit, "day");

        // 時刻情報の安全な抽出
        String inTime = extractNullableString(stampEdit, "inTime");
        String outTime = extractNullableString(stampEdit, "outTime");
        String breakStartTime = extractNullableString(stampEdit, "breakStartTime");
        String breakEndTime = extractNullableString(stampEdit, "breakEndTime");

        // 夜勤フラグの抽出
        Boolean isNightShift = extractNullableBoolean(stampEdit, "isNightShift");

        // 従業員IDの抽出（カンマ区切り対策）
        Integer employeeId = extractEmployeeId(stampEdit);

        // IDの抽出（更新時のみ存在）
        Integer id = extractId(stampEdit);

        return new StampEditData(id, employeeId, year, month, day, inTime, outTime, breakStartTime, breakEndTime, isNightShift);
    }

    /**
     * 必須文字列フィールドを抽出します。
     *
     * @param map       データを含むMap
     * @param fieldName フィールド名
     * @return 抽出された文字列
     */
    private String extractString(Map<String, Object> map, String fieldName) {
        Object value = map.get(fieldName);
        return value != null ? value.toString() : "";
    }

    /**
     * オプション文字列フィールドを抽出します。
     *
     * @param map       データを含むMap
     * @param fieldName フィールド名
     * @return 抽出された文字列（nullの場合はnull）
     */
    private String extractNullableString(Map<String, Object> map, String fieldName) {
        Object value = map.get(fieldName);
        return value != null ? value.toString() : null;
    }

    /**
     * オプションBoolean フィールドを抽出します。
     *
     * @param map       データを含むMap
     * @param fieldName フィールド名
     * @return 抽出されたBoolean（nullの場合はnull）
     */
    private Boolean extractNullableBoolean(Map<String, Object> map, String fieldName) {
        Object value = map.get(fieldName);
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return Boolean.parseBoolean(value.toString());
    }

    /**
     * 従業員IDを抽出します。
     * カンマ区切りの値が含まれる場合は最初の値を使用します。
     *
     * @param stampEdit データを含むMap
     * @return 従業員ID
     */
    private Integer extractEmployeeId(Map<String, Object> stampEdit) {
        String employeeIdStr = extractString(stampEdit, "employeeId");

        // カンマ区切り対策
        if (employeeIdStr.contains(",")) {
            employeeIdStr = employeeIdStr.split(",")[0];
        }

        try {
            return Integer.parseInt(employeeIdStr);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid employee ID: " + employeeIdStr, e);
        }
    }

    /**
     * 打刻履歴IDを抽出します。
     * 新規登録の場合はnullを返します。
     *
     * @param stampEdit データを含むMap
     * @return 打刻履歴ID（新規の場合null）
     */
    private Integer extractId(Map<String, Object> stampEdit) {
        String idString = extractNullableString(stampEdit, "id");

        if (idString == null || idString.isEmpty()) {
            return null;
        }

        try {
            return Integer.parseInt(idString);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid stamp history ID: " + idString, e);
        }
    }
}