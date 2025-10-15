package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.NewsMapper;

/**
 * お知らせ管理
 * 削除処理
 */
@Service
@Transactional
public class NewsManageDeletionService{

	@Autowired
	NewsMapper mapper;
	@Autowired
	LogHistoryRegistrationService logHistoryService;

	public void execute(ListForm listForm, Integer updateEmployeeId) {

		boolean delete = false;
		for (String newsId : listForm.getIdList()) {
			int id = Integer.parseInt(newsId);
			mapper.deleteById(id);
			delete = true;
		}
		if(delete) {
			//履歴記録
			logHistoryService.execute(2, 4, null, null, updateEmployeeId , Timestamp.valueOf(LocalDateTime.now()));
		}
	}
}
