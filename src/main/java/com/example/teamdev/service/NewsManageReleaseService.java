package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.NewsMapper;

/**
 * お知らせ管理
 * 公開/非公開設定処理
 */
@Service
public class NewsManageReleaseService{

	@Autowired
	NewsMapper mapper;
	@Autowired
	LogHistoryRegistrationService logHistoryService;

	public void execute(ListForm listForm, Integer updateEmployeeId) {

		boolean release = false;
		for (Map<String,String> editMap : listForm.getEditList()) {

			int id = Integer.parseInt(editMap.get("id"));
			String releaseFlagString = editMap.get("releaseFlag");
			boolean releaseFlag;
			if (releaseFlagString != null && releaseFlagString.equalsIgnoreCase("true")) {
			    releaseFlag = true;
			} else {
			    releaseFlag = false;
			}
			News entity =  mapper.getById(id).orElse(null);
			if (entity != null) {
			    // エンティティが見つかった場合の処理
				entity.setRelease_flag(releaseFlag);
				Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
				entity.setUpdate_date(timestamp);
				mapper.upDate(entity);
				release = true;
			}
		}
		if(release) {
			// 履歴記録
			logHistoryService.execute(2, 5, null, null, updateEmployeeId , Timestamp.valueOf(LocalDateTime.now()));
		}

	}
}
