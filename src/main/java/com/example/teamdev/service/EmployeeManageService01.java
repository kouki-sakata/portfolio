package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * 従業員情報管理
 * 登録処理
 */
@Service
public class EmployeeManageService01 {

    @Autowired
    EmployeeMapper mapper;
    @Autowired
    LogHistoryService01 logHistoryService;

    public boolean execute(EmployeeManageForm employeeManageForm,
            Integer updateEmployeeId) {

        Integer employeeId =
                (employeeManageForm.getEmployeeId() != null && !employeeManageForm.getEmployeeId().isEmpty()) ?
                        Integer.parseInt(
                                employeeManageForm.getEmployeeId()) : null;
        String firstName = employeeManageForm.getFirstName().toString();
        String lastName = employeeManageForm.getLastName().toString();
        String email = employeeManageForm.getEmail().toString();
        String password = employeeManageForm.getPassword().toString();
        int adminFlag = Integer.parseInt(employeeManageForm.getAdminFlag());

        //メールアドレス重複チェック
        Iterable<Employee> iterableEmployee = mapper.getAllOrderById();
        boolean result = false;
        for (Employee employee : iterableEmployee) {
            String registered_email = employee.getEmail();
            if (registered_email.equals(email)) {
                Integer id = employee.getId();
                //更新の場合、同じレコードであればメールアドレスは一致してOK
                if (!id.equals(employeeId)) {
                    result = true;
                    break; // 一致した場合、for文から抜ける
                }
            }
        }
        //重複エラーでない場合は登録処理を行い、「true」を返却
        if (!result) {
            //idが格納されている場合は更新
            if (employeeId != null) {
                Employee entity = mapper.getById(employeeId).orElse(null);
                entity.setFirst_name(firstName);
                entity.setLast_name(lastName);
                entity.setEmail(email);
                entity.setPassword(password);
                entity.setAdmin_flag(adminFlag);
                Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
                entity.setUpdate_date(timestamp);
                mapper.upDate(entity);
                //履歴記録
                logHistoryService.execute(3, 3, null, entity.getId(),
                        updateEmployeeId, timestamp);
            } else {
                //idが格納されていない場合は新規登録
                Employee entity = new Employee();
                entity.setFirst_name(firstName);
                entity.setLast_name(lastName);
                entity.setEmail(email);
                entity.setPassword(password);
                entity.setAdmin_flag(adminFlag);
                Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
                entity.setUpdate_date(timestamp);
                mapper.save(entity);
                //履歴記録
                logHistoryService.execute(3, 3, null, entity.getId(),
                        updateEmployeeId, timestamp);
            }
            return result;
        } else {
            //重複エラーの場合は「false」を返却
            return result;
        }
    }
}
