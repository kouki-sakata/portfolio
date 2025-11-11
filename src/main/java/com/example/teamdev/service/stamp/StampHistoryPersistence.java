package com.example.teamdev.service.stamp;

import com.example.teamdev.dto.StampEditData;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * 打刻履歴の永続化に特化したコンポーネント。
 * データベースへの保存・更新処理を担当します。
 * 単一責任の原則に従い、永続化のみを責務とします。
 */
@Component
public class StampHistoryPersistence {

    private final StampHistoryMapper stampHistoryMapper;

    /**
     * StampHistoryPersistenceのコンストラクタ。
     *
     * @param stampHistoryMapper 打刻履歴マッパー
     */
    @Autowired
    public StampHistoryPersistence(StampHistoryMapper stampHistoryMapper) {
        this.stampHistoryMapper = stampHistoryMapper;
    }

    /**
     * 打刻履歴を保存または更新します。
     *
     * @param data             打刻編集データ
     * @param inTime           出勤時刻
     * @param adjustedOutTime  調整済み退勤時刻
     * @param updateEmployeeId 更新者の従業員ID
     * @return 保存または更新が行われた場合true
     */
    @Transactional
    public boolean saveOrUpdate(StampEditData data, OffsetDateTime inTime,
            OffsetDateTime adjustedOutTime, int updateEmployeeId) {

        if (data.isNewEntry()) {
            return createNewStampHistory(data, inTime, adjustedOutTime, updateEmployeeId);
        } else {
            return updateExistingStampHistory(data, inTime, adjustedOutTime, updateEmployeeId);
        }
    }

    /**
     * 新規打刻履歴を作成します。
     *
     * @param data             打刻編集データ
     * @param inTime           出勤時刻
     * @param outTime          退勤時刻
     * @param updateEmployeeId 更新者の従業員ID
     * @return 常にtrue（保存成功）
     */
    private boolean createNewStampHistory(StampEditData data, OffsetDateTime inTime,
            OffsetDateTime outTime, int updateEmployeeId) {

        StampHistory entity = new StampHistory();

        // 基本情報の設定
        entity.setYear(data.getYear());
        entity.setMonth(data.getMonth());
        entity.setDay(data.getDay());
        entity.setEmployeeId(data.getEmployeeId());

        // 時刻情報の設定
        entity.setInTime(inTime);
        entity.setOutTime(outTime);

        // 休憩時間の設定 - 文字列をOffsetDateTimeに変換
        entity.setBreakStartTime(parseBreakTime(data.getYear(), data.getMonth(), data.getDay(), data.getBreakStartTime()));
        entity.setBreakEndTime(parseBreakTime(data.getYear(), data.getMonth(), data.getDay(), data.getBreakEndTime()));

        // 夜勤フラグの設定
        entity.setIsNightShift(data.getIsNightShift());

        // メタ情報の設定
        entity.setUpdateEmployeeId(updateEmployeeId);
        entity.setUpdateDate(getCurrentTimestamp());

        // データベースに保存
        stampHistoryMapper.save(entity);

        return true;
    }

    /**
     * 既存の打刻履歴を更新します。
     *
     * @param data             打刻編集データ
     * @param inTime           出勤時刻
     * @param outTime          退勤時刻
     * @param updateEmployeeId 更新者の従業員ID
     * @return 更新が行われた場合true、エンティティが見つからない場合false
     */
    private boolean updateExistingStampHistory(StampEditData data, OffsetDateTime inTime,
            OffsetDateTime outTime, int updateEmployeeId) {

        // 既存エンティティの取得
        Optional<StampHistory> optionalEntity = stampHistoryMapper.getById(data.getId());

        if (optionalEntity.isEmpty()) {
            // エンティティが見つからない場合はログを出力して処理をスキップ
            // 本来はエラーハンドリングが必要だが、既存の動作を維持
            return false;
        }

        StampHistory entity = optionalEntity.get();

        // 時刻情報の更新
        entity.setInTime(inTime);
        entity.setOutTime(outTime);

        // 休憩時間の更新 - 文字列をOffsetDateTimeに変換
        entity.setBreakStartTime(parseBreakTime(data.getYear(), data.getMonth(), data.getDay(), data.getBreakStartTime()));
        entity.setBreakEndTime(parseBreakTime(data.getYear(), data.getMonth(), data.getDay(), data.getBreakEndTime()));

        // 夜勤フラグの更新（nullも設定可能）
        entity.setIsNightShift(data.getIsNightShift());

        // メタ情報の更新
        entity.setUpdateEmployeeId(updateEmployeeId);
        entity.setUpdateDate(getCurrentTimestamp());

        // データベースを更新
        stampHistoryMapper.update(entity);

        return true;
    }

    /**
     * 現在のタイムスタンプを取得します。
     *
     * @return 現在時刻のOffsetDateTime (UTC)
     */
    private OffsetDateTime getCurrentTimestamp() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    /**
     * 日付と時刻文字列をOffsetDateTimeに変換します。
     *
     * @param year  年
     * @param month 月
     * @param day   日
     * @param time  時刻（HH:mm形式）
     * @return JST（+09:00）のOffsetDateTime、timeがnullの場合はnull
     */
    private OffsetDateTime parseBreakTime(String year, String month, String day, String time) {
        if (time == null || time.isBlank()) {
            return null;
        }
        // Zero-pad month and day to ensure ISO 8601 compliance
        String paddedMonth = String.format("%02d", Integer.parseInt(month));
        String paddedDay = String.format("%02d", Integer.parseInt(day));
        String isoString = String.format("%s-%s-%sT%s:00+09:00",
                                          year, paddedMonth, paddedDay, time);
        return OffsetDateTime.parse(isoString, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    /**
     * 打刻履歴の存在確認を行います。
     * 将来的な機能拡張用のメソッドです。
     *
     * @param id 打刻履歴ID
     * @return 存在する場合true
     */
    public boolean exists(Integer id) {
        if (id == null) {
            return false;
        }
        return stampHistoryMapper.getById(id).isPresent();
    }
}