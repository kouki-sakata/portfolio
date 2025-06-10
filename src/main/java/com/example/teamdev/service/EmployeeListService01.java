/**
 * 2024/03/20 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @author n.yasunari
 * 従業員情報
 * 画面情報取得処理
 */
@Service
public class EmployeeListService01{
	@Autowired
	private EmployeeMapper mapper;
	
	public List<Map<String,Object>> execute(Integer adminFlag) {
		
		List<Map<String,Object>> employeeMapList = new ArrayList<Map<String,Object>>();
		Map<String, Object> employeeMap = new HashMap<String, Object>();
		List<Employee> employeeList = new ArrayList<Employee>();
		if (adminFlag == null) {
			//すべてのレコード、ID昇順
			employeeList =  mapper.getAllOrderById();
		} else {
			//管理者フラグ=adminFlag、ID昇順
			employeeList =  mapper.getEmployeeByAdminFlagOrderById(adminFlag);
		}
		for (Employee employee : employeeList) {
			//mapに詰め替え
			employeeMap = new ObjectMapper().convertValue(employee, Map.class);
			//Listに追加
			employeeMapList.add(employeeMap);
        }
		return employeeMapList;
	}
}