package com.example.teamdev.service;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.teamdev.entity.LogHistory;
import com.example.teamdev.mapper.LogHistoryMapper;

/**
 * 履歴記録（共通）
 * 登録処理
 */
@Service
public class LogHistoryRegistrationService {

    private final LogHistoryMapper mapper;

    public LogHistoryRegistrationService(LogHistoryMapper mapper) {
        this.mapper = mapper;
    }

	public void execute(int displayName, int operationType, Timestamp stampTime,
			Integer employeeId, Integer update_employee_id, Timestamp update_date) {
		// 既存履歴の有無を確認するためのパラメータをMapで用意 追記
        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("operation_type", operationType);
        params.put("update_date", update_date);

        // 同じ日に同じユーザーが同じ操作をしていなければ履歴を保存 追記
        int count = mapper.existsLogHistoryForToday(params);
        if (count == 0) {
            LogHistory entity = new LogHistory();
            entity.setDisplay_name(displayName);
            entity.setOperation_type(operationType);
            entity.setStamp_time(stampTime);
            entity.setEmployee_id(employeeId);
            entity.setUpdate_employee_id(update_employee_id);
            entity.setUpdate_date(update_date);
            mapper.save(entity);
        }
    }
}
