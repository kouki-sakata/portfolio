package com.example.teamdev.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @author n.yasunari
 * サインイン→ホーム画面
 * サインイン処理
 */
@Service
public class HomeService03{
	@Autowired
	EmployeeMapper mapper;

	public Map<String, Object> execute(Employee employee) {

		Map<String, Object> map = new HashMap<String, Object>();

		String email = employee.getEmail();
		String password = employee.getPassword();

		//従業員情報テーブルからメールアドレスが一致するレコードを1件取得する
		Employee targetEmployee =  mapper.getEmployeeByEmail(email);

		if(Objects.nonNull(targetEmployee)) {
			if(targetEmployee.getPassword().equals(password)) {
				//対象レコードのパスワードと入力パスワードが一致した場合
				//対象の従業員情報をmapに入れる
				map = new ObjectMapper().convertValue(targetEmployee, Map.class);
				//従業員情報の姓名を表示用に「姓+全角スペース+名」で格納
				String employeeName = map.get("first_name").toString() +
						"　" + map.get("last_name").toString();
		        map.put("employeeName", employeeName);
				// サインインに成功した現在日時を格納
		        map.put("signInTime", LocalDateTime.now());
				 // セキュリティ上、持ち回る従業員情報mapからパスワードを削除
				map.remove("password");
				return map;
			}else {
				//対象レコードのパスワードと入力パスワードが不一致
				return map;
			}
		}else {
			//メールアドレスが一致するレコードが存在しない
			return map;
		}
	}
}
