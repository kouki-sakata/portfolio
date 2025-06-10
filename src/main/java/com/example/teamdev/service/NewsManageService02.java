/**
 * 2024/04/11 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.entity.News;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.mapper.NewsMapper;
import com.example.teamdev.util.DateFormatUtil;

/**
 * @author n.yasunari
 * お知らせ管理
 * 登録/更新処理
 */
@Service
@Transactional
public class NewsManageService02{
	
	@Autowired
	NewsMapper mapper;
	@Autowired
	LogHistoryService01 logHistoryService;
	
	public void execute(NewsManageForm newsManageForm, Integer updateEmployeeId) {
		
		//更新か新規登録か判断するためInteger型の変数にidを格納する（nullの場合は新規登録）
		Integer id = !newsManageForm.getId().isEmpty() ? Integer.parseInt(newsManageForm.getId()) : null;
		
		// 日付フォーマット変換（yyyy-MM-dd → yyyy/MM/dd）山本変更 2025/5/13
		String formattedDate = DateFormatUtil.formatDate(newsManageForm.getNewsDate());
		
		//idが格納されている場合は更新
		if (id != null) {
			News entity =  mapper.getById(id).orElse(null);
			entity.setNews_date(formattedDate);
			entity.setContent(newsManageForm.getContent());
			Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
			entity.setUpdate_date(timestamp);
			mapper.upDate(entity);
			//履歴記録
			logHistoryService.execute(2, 3, null, null, updateEmployeeId , timestamp);
		} else {
			//idが格納されていない場合は新規登録
			News entity = new News();
			entity.setNews_date(formattedDate);
			entity.setContent(newsManageForm.getContent());
			boolean releaseFlag = false;
			entity.setRelease_flag(releaseFlag);
			Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
			entity.setUpdate_date(timestamp);
			mapper.save(entity);
			//履歴記録
			logHistoryService.execute(2, 3, null, null, updateEmployeeId , timestamp);
		}
	}
}
