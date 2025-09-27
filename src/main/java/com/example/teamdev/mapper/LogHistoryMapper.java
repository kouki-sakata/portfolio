package com.example.teamdev.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.example.teamdev.entity.LogHistory;
import com.example.teamdev.entity.LogHistoryDisplay;

/**
 * 履歴記録テーブル：log_history
 */
@Mapper
public interface LogHistoryMapper {
	// 更新日時がパラメータ年月に属する日付であるレコードを更新日時降順で取得
	// パラメータ名を明示する@paramを追記
	List<LogHistoryDisplay> getLogHistoryByYearMonthOrderByUpdateDateDesc(
			@Param("year") String year,
		    @Param("month") String month
	);

	// 履歴記録テーブルの更新日時から存在する年をすべて昇順で取得する
	// パフォーマンス最適化: インデックスを使用したDISTINCT最適化
	@Select("SELECT DISTINCT YEAR(update_date) AS year FROM log_history WHERE update_date IS NOT NULL ORDER BY year ASC")
	List<String> getLogHistoryYearOrderByYearAsc();

	// 打刻記録テーブルにレコードを挿入する
	void save(LogHistory entity);

	// existsLogHistoryForTodayメゾット
    int existsLogHistoryForToday(java.util.Map<String, Object> params);

    // バッチ削除: 指定した従業員IDの履歴を削除
    int deleteByEmployeeIds(java.util.List<Integer> employeeIds);
}
