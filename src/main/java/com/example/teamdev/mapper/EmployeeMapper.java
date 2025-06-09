package com.example.teamdev.mapper;

import com.example.teamdev.entity.Employee;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

/**
 * 従業員情報テーブル：employee
 */
@Mapper
public interface EmployeeMapper {
    // 従業員情報テーブルからメールアドレスが一致するレコードを1件取得する
    // 従業員情報管理画面でメールアドレス重複チェックを行うため、メールアドレスが重複するレコードは存在しない前提
    @Select("SELECT * FROM employee WHERE email = #{email} LIMIT 1")
    Employee getEmployeeByEmail(String email);

    // 管理者フラグが一致するレコードをID昇順で取得
    @Select("SELECT * FROM employee WHERE admin_flag = #{adminFlag} ORDER BY id asc")
    List<Employee> getEmployeeByAdminFlagOrderById(int adminFlag);

    // すべてのレコードをID昇順で取得
    @Select("SELECT * FROM employee ORDER BY id")
    List<Employee> getAllOrderById();

    // 指定のidで1レコードを取得する
    @Select("SELECT * FROM employee WHERE id = #{id}")
    Optional<Employee> getById(@Param("id") Integer id);

    // データを挿入する
    int save(Employee employee);

    // データを更新する
    int upDate(Employee entity);

    @Delete("DELETE FROM employee WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);
}
