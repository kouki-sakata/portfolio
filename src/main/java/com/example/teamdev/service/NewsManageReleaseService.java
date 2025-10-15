package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.NewsMapper;

/**
 * お知らせ管理
 * 公開/非公開設定処理
 */
@Service
public class NewsManageReleaseService{

	private static final Logger logger = LoggerFactory.getLogger(NewsManageReleaseService.class);

	@Autowired
	NewsMapper mapper;
	@Autowired
	LogHistoryRegistrationService logHistoryService;

	@Transactional
	public void execute(ListForm listForm, Integer updateEmployeeId) {
		logger.info("NewsManageReleaseService.execute started - updateEmployeeId: {}", updateEmployeeId);
		
		try {
			if (listForm == null || listForm.getEditList() == null) {
				logger.error("ListForm or EditList is null");
				throw new IllegalArgumentException("ListForm or EditList cannot be null");
			}
			
			logger.info("Processing {} items for release", listForm.getEditList().size());

			boolean release = false;
			for (Map<String,String> editMap : listForm.getEditList()) {
				try {
					String idString = editMap.get("id");
					if (idString == null || idString.trim().isEmpty()) {
						logger.warn("ID is null or empty in editMap: {}", editMap);
						continue;
					}
					
					int id = Integer.parseInt(idString);
					String releaseFlagString = editMap.get("releaseFlag");
					boolean releaseFlag;
					if (releaseFlagString != null && releaseFlagString.equalsIgnoreCase("true")) {
					    releaseFlag = true;
					} else {
					    releaseFlag = false;
					}
					
					logger.info("Processing news ID: {}, releaseFlag: {}", id, releaseFlag);
					
					News entity =  mapper.getById(id).orElse(null);
					if (entity != null) {
					    // エンティティが見つかった場合の処理
						entity.setReleaseFlag(releaseFlag);
						Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
						entity.setUpdateDate(timestamp);
						mapper.upDate(entity);
						release = true;
						logger.info("Successfully updated news ID: {} with releaseFlag: {}", id, releaseFlag);
					} else {
						logger.warn("News entity not found for ID: {}", id);
					}
				} catch (NumberFormatException e) {
					logger.error("Invalid ID format in editMap: {}", editMap, e);
					throw new IllegalArgumentException("Invalid ID format: " + editMap.get("id"), e);
				} catch (Exception e) {
					logger.error("Error processing news item: {}", editMap, e);
					throw e;
				}
			}
			
			if(release) {
				// 履歴記録
				logger.info("Recording log history for release operation");
				logHistoryService.execute(2, 5, null, null, updateEmployeeId , Timestamp.valueOf(LocalDateTime.now()));
			}
			
			logger.info("NewsManageReleaseService.execute completed successfully");
		} catch (Exception e) {
			logger.error("Error in NewsManageReleaseService.execute", e);
			throw e;
		}
	}
}
