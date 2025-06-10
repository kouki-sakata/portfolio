package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.EmployeeMapper;

/**
 * 従業員情報管理
 * 削除処理
 */
@Service
@Transactional
public class EmployeeManageService02{
	@Autowired
	EmployeeMapper mapper;
	@Autowired
	LogHistoryService01 logHistoryService;

	public void execute(ListForm listForm, Integer updateEmployeeId) {

		for (String employeeId : listForm.getIdList()) {
			int id = Integer.parseInt(employeeId);
			mapper.deleteById(id);
		}
		//履歴記録
		logHistoryService.execute(3, 4, null, null, updateEmployeeId , Timestamp.valueOf(LocalDateTime.now()));
	}
}
