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
// PasswordEncoder関連のインポートは、以前の revert で削除されているはずなので、ここでは不要

/**
 * サインイン（ログイン）処理に関するビジネスロジックを担当するサービスクラスです。
 * ユーザーの認証（現在はメールアドレスとパスワードの完全一致）を行います。
 */
@Service
public class HomeService03 {

    private final EmployeeMapper mapper; // 従業員情報へのデータアクセスを行うマッパー
    // PasswordEncoder のフィールドは以前の revert で削除されている

    /**
     * HomeService03のコンストラクタ。
     * EmployeeMapperをインジェクションします。
     * @param mapper 従業員マッパー
     */
    @Autowired
    public HomeService03(EmployeeMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 指定された従業員情報（メールアドレスとパスワード）に基づいてサインイン処理を実行します。
     * メールアドレスで従業員を検索し、パスワードが一致すれば従業員情報をMap形式で返します。
     * 一致しない場合や従業員が見つからない場合は空のMapを返します。
     *
     * @param employeeFromForm サインインフォームから入力されたメールアドレスとパスワードを含むEmployeeオブジェクト
     * @return 認証成功時は従業員情報（名前、IDなど）とサインイン時刻を含むMap。失敗時は空のMap。
     */
    public Map<String, Object> execute(Employee employeeFromForm) {
        Map<String, Object> map = new HashMap<>();
        String email = employeeFromForm.getEmail();
        String rawPassword = employeeFromForm.getPassword(); // フォームからの平文パスワード

        Employee targetEmployee = mapper.getEmployeeByEmail(email); // メールアドレスで従業員を検索

        if (Objects.nonNull(targetEmployee)) {
            // 現在は平文パスワードでの比較 (以前のPasswordEncoderの revert を反映)
            if (targetEmployee.getPassword().equals(rawPassword)) {
                // パスワードが一致
                @SuppressWarnings("unchecked") // ObjectMapperによるMap変換のキャスト警告を抑制
                Map<String, Object> employeeAsMap = new ObjectMapper().convertValue(targetEmployee, Map.class);
                map.putAll(employeeAsMap); // マッピングされた従業員情報をそのまま追加

                String employeeName = targetEmployee.getFirst_name() +
                        "　" + targetEmployee.getLast_name();
                map.put("employeeName", employeeName); // 表示用の従業員名
                map.put("signInTime", LocalDateTime.now()); // サインイン時刻
                map.remove("password"); // セキュリティのためパスワード情報は削除
                return map;
            } else {
                // パスワードが不一致
                return map; // 空のMapを返す
            }
        } else {
            // メールアドレスに該当する従業員が見つからない
            return map; // 空のMapを返す
        }
    }
}
