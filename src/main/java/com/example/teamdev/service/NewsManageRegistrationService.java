package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.entity.News;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.mapper.NewsMapper;

/**
 * お知らせ管理
 * 登録/更新処理
 */
@Service
@Transactional
public class NewsManageRegistrationService {

    private final NewsMapper mapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final Clock clock;

    public NewsManageRegistrationService(
        NewsMapper mapper,
        LogHistoryRegistrationService logHistoryService,
        Clock clock
    ) {
        this.mapper = mapper;
        this.logHistoryService = logHistoryService;
        this.clock = clock;
    }

	public News execute(NewsManageForm newsManageForm, Integer updateEmployeeId) {

		//更新か新規登録か判断するためInteger型の変数にidを格納する（nullの場合は新規登録）
		Integer id = newsManageForm.getId() != null && !newsManageForm.getId().isEmpty()
			? Integer.parseInt(newsManageForm.getId())
			: null;

		// フォームから日付を取得（LocalDate型）
		LocalDate newsDate = LocalDate.parse(newsManageForm.getNewsDate());

		//idが格納されている場合は更新
        Timestamp timestamp = Timestamp.from(clock.instant());

        if (id != null) {
            News entity = mapper.getById(id).orElseThrow(() -> new IllegalArgumentException("News not found: " + id));
            entity.setNewsDate(newsDate);
            entity.setTitle(newsManageForm.getTitle());
            entity.setContent(newsManageForm.getContent());
            entity.setCategory(newsManageForm.getCategory());
            entity.setUpdateDate(timestamp);
            mapper.upDate(entity);
            // 履歴記録
            logHistoryService.execute(2, 3, null, null, updateEmployeeId, timestamp);
            return entity;
        } else {
            // idが格納されていない場合は新規登録
            News entity = new News();
            entity.setNewsDate(newsDate);
            entity.setTitle(newsManageForm.getTitle());
            entity.setContent(newsManageForm.getContent());
            entity.setCategory(newsManageForm.getCategory());
            boolean releaseFlag = false;
            entity.setReleaseFlag(releaseFlag);
            entity.setUpdateDate(timestamp);
            mapper.save(entity);
            // 履歴記録
            logHistoryService.execute(2, 3, null, null, updateEmployeeId, timestamp);
            return entity;
        }
	}
}
