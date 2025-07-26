package com.example.teamdev.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.example.teamdev.entity.Employee;

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

	// 先頭から指定件数のレコードをID昇順で取得（マイグレーション事前チェック用）
	@Select("SELECT * FROM employee ORDER BY id LIMIT #{limit}")
	List<Employee> getTopEmployees(@Param("limit") int limit);

	// 指定のidで1レコードを取得する
	@Select("SELECT * FROM employee WHERE id = #{id}")
	Optional<Employee> getById(@Param("id") Integer id);

    List<Employee> findFilteredEmployees(@Param("start") int start, @Param("length") int length, @Param("searchValue") String searchValue, @Param("orderColumn") String orderColumn, @Param("orderDir") String orderDir);

    long countFilteredEmployees(@Param("searchValue") String searchValue);

    long countTotalEmployees();

	// データを挿入する
	int save(Employee employee);

	// データを更新する
	int upDate(Employee entity);

	@Delete("DELETE FROM employee WHERE id = #{id}")
	int deleteById(@Param("id") Integer id);

	// バッチ削除用（N+1問題解決）
	int deleteByIdList(@Param("idList") List<Integer> idList);

	// 管理者フラグによる一括取得（N+1問題解決）
	@Select("SELECT * FROM employee ORDER BY admin_flag, id")
	List<Employee> getAllEmployeesGroupedByAdminFlag();
}
