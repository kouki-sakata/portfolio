package com.example.teamdev.service;

import com.example.teamdev.entity.StampDelete;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.form.StampDeleteForm;
import com.example.teamdev.mapper.StampDeleteMapper;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;

@Service
public class StampDeleteService {

    private final StampDeleteMapper stampDeleteMapper;
    private final StampHistoryMapper stampHistoryMapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final Clock clock;

    public StampDeleteService(
        StampDeleteMapper stampDeleteMapper,
        StampHistoryMapper stampHistoryMapper,
        LogHistoryRegistrationService logHistoryService,
        Clock clock
    ) {
        this.stampDeleteMapper = stampDeleteMapper;
        this.stampHistoryMapper = stampHistoryMapper;
        this.logHistoryService = logHistoryService;
        this.clock = clock;
    }

    /**
     * 年と月を分解し打刻記録を取得
     *
     * @return 削除された件数
     */
    @Transactional
    public int deleteStampsByYearMonthRange(StampDeleteForm stampDeleteForm,
            Integer updateEmployeeId) {
        StampDelete stampDeleteEntity = new StampDelete();
        stampDeleteEntity.setStartYear(stampDeleteForm.getStartYear());
        stampDeleteEntity.setStartMonth(stampDeleteForm.getStartMonth());
        stampDeleteEntity.setEndYear(stampDeleteForm.getEndYear());
        stampDeleteEntity.setEndMonth(stampDeleteForm.getEndMonth());
        int deletedCount = stampDeleteMapper.deleteStampsByYearMonthRange(
                stampDeleteEntity);
        
        // 削除が成功した場合のみ履歴に登録
        Timestamp timestamp = Timestamp.from(clock.instant());
        logHistoryService.execute(5, 4, null, null, updateEmployeeId, timestamp);

        return deletedCount;
    }

    /**
     * 開始年月と終了年月の妥当性を検証する
     *
     * @return 開始年月が終了年月より後の場合はfalse、それ以外はtrue
     */
    public boolean validateYearMonthRange(StampDeleteForm stampDeleteForm) {
        try {
            // ゼロパディングしておく
            String sm = String.format("%02d",
                    Integer.parseInt(stampDeleteForm.getStartMonth()));
            String em = String.format("%02d",
                    Integer.parseInt(stampDeleteForm.getEndMonth()));

            // 開始日と終了日を結合して比較する
            int startDate = Integer.parseInt(
                    stampDeleteForm.getStartYear() + sm);
            int endDate = Integer.parseInt(
                    stampDeleteForm.getEndYear() + em);
            // 開始年月が終了年月以前であれば有効
            return startDate <= endDate;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * 打刻記録をID単位で削除します。
     *
     * @param stampId          削除対象の打刻ID
     * @param updateEmployeeId 操作を行う従業員ID
     * @return 削除に成功した場合true
     */
    @Transactional
    public boolean deleteStampById(Integer stampId, Integer updateEmployeeId) {
        if (stampId == null) {
            throw new IllegalArgumentException("stampId must not be null");
        }

        return stampHistoryMapper.getById(stampId)
            .map(history -> performSingleDelete(history, updateEmployeeId))
            .orElse(false);
    }

    private boolean performSingleDelete(StampHistory history, Integer updateEmployeeId) {
        int deleted = stampHistoryMapper.deleteById(history.getId());
        if (deleted == 0) {
            return false;
        }

        Timestamp timestamp = Timestamp.from(clock.instant());
        logHistoryService.execute(5, 4, null, history.getEmployeeId(), updateEmployeeId, timestamp);
        return true;
    }
}
