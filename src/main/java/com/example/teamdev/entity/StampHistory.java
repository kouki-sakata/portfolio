package com.example.teamdev.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 打刻記録テーブル
 *
 * Note: TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ) を使用
 * データベースには UTC で保存され、Java 側では OffsetDateTime で扱う
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StampHistory {
	/**
	 * ID
	 */
	private Integer id;
	/**
	 * 年
	 */
	private String year;
	/**
	 * 月
	 */
	private String month;
	/**
	 * 日
	 */
	private String day;
	/**
	 * 打刻日付（YYYY-MM-DD形式、DATE型）
	 *
	 * Note: year/month/day カラムとの互換性維持のため、両方のフィールドを保持。
	 * V5マイグレーションでDBトリガーにより自動同期される。
	 * 今後はこのフィールドを主要な日付ソースとして使用する。
	 */
	private LocalDate stampDate;
	//フィールド名をキャメルケースに修正
	/**
	 * 従業員ID
	 */
	private Integer employeeId;  //←employee_id→employeeId修正
	/**
	 * 出勤時刻（タイムゾーン情報付き）
	 */
	private OffsetDateTime inTime;  //←in_time→inTime修正
	/**
	 * 退勤時刻（タイムゾーン情報付き）
	 */
	private OffsetDateTime outTime;  //←out_time→outTime修正
	/**
	 * 休憩開始時刻（タイムゾーン情報付き）
	 */
	private OffsetDateTime breakStartTime;
	/**
	 * 休憩終了時刻（タイムゾーン情報付き）
	 */
	private OffsetDateTime breakEndTime;
	/**
	 * 夜勤フラグ（TRUE=夜勤、FALSE=通常勤務）
	 */
	private Boolean isNightShift;
	/**
	 * 更新従業員ID
	 */
	private Integer updateEmployeeId;  //←update_employee_id→updateEmployeeId修正
	/**
	 * 更新日時（タイムゾーン情報付き）
	 */
	private OffsetDateTime updateDate;  //←update_date→updateDate修正
}
