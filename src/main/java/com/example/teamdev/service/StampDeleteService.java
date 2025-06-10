package com.example.teamdev.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.mapper.StampDeleteMapper;

@Service
public class StampDeleteService {

	@Autowired
	private StampDeleteMapper stampDeleteMapper;

	/**
	 * 年と月を分解し打刻記録を取得
	 * 
	 * @param startYear  開始年
	 * @param startMonth 開始月
	 * @param endYear    終了年
	 * @param endMonth   終了月
	 * @return 削除された件数
	 */
	@Transactional
	public int deleteStampsByYearMonthRange(String startYear,
			String startMonth, String endYear, String endMonth) {

		return stampDeleteMapper.deleteStampsByYearMonthRange(startYear,
				startMonth, endYear, endMonth);
	}

	/**
	* 開始年月と終了年月の妥当性を検証する
	* 
	* @param startYear  開始年
	* @param startMonth 開始月
	* @param endYear    終了年
	* @param endMonth   終了月
	* @return 開始年月が終了年月より後の場合はfalse、それ以外はtrue
	*/
	public boolean validateYearMonthRange(String startYear,
			String startMonth, String endYear, String endMonth) {
		try {
			// ゼロパディングしておく
			String sm = String.format("%02d",
					Integer.parseInt(startMonth));
			String em = String.format("%02d",
					Integer.parseInt(endMonth));

			// 開始日と終了日を結合して比較する
			int startDate = Integer.parseInt(startYear + sm);
			int endDate = Integer.parseInt(endYear + em);

			// 開始年月が終了年月以前であれば有効
			return startDate <= endDate;
		} catch (NumberFormatException e) {
			// 変換エラーの場合は無効とする
			return false;
		}
	}
}