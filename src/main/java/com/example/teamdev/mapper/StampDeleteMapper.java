package com.example.teamdev.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface StampDeleteMapper {

	/**
	 * 指定した年月範囲の打刻記録を削除する
	 * 
	 * @param startYear  開始年
	 * @param startMonth 開始月
	 * @param endYear    終了年
	 * @param endMonth   終了月
	 * @return 削除された件数
	 */
	int deleteStampsByYearMonthRange(
			@Param("startYear") String startYear,
			@Param("startMonth") String startMonth,
			@Param("endYear") String endYear,
			@Param("endMonth") String endMonth);
}