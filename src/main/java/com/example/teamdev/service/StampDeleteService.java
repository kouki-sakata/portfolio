package com.example.teamdev.service;

import com.example.teamdev.entity.StampDelete;
import com.example.teamdev.form.StampDeleteForm;
import com.example.teamdev.mapper.StampDeleteMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service
public class StampDeleteService {

    @Autowired
    private StampDeleteMapper stampDeleteMapper;
    @Autowired
    private LogHistoryRegistrationService logHistoryService;

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
        logHistoryService.execute(5, 4, null, null, updateEmployeeId,
                Timestamp.valueOf(LocalDateTime.now()));

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

}
