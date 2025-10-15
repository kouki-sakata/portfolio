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