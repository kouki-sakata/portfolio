package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm; // Added for deleteEmployees
import com.example.teamdev.mapper.EmployeeMapper;
import com.fasterxml.jackson.databind.ObjectMapper; // Added for getAllEmployees
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList; // Added for getAllEmployees
import java.util.HashMap; // Added for getAllEmployees
import java.util.List; // Added for getAllEmployees
import java.util.Map; // Added for getAllEmployees
import java.util.Optional;

@Service // Class name changed to EmployeeService
public class EmployeeService {

    private final EmployeeMapper employeeMapper;
    private final LogHistoryService01 logHistoryService;
    private final ObjectMapper objectMapper; // Added for map conversion

    @Autowired
    public EmployeeService(EmployeeMapper employeeMapper, LogHistoryService01 logHistoryService) {
        this.employeeMapper = employeeMapper;
        this.logHistoryService = logHistoryService;
        this.objectMapper = new ObjectMapper(); // Initialize ObjectMapper
    }

    // --- Existing methods from EmployeeManageService ---
    @Transactional
    public Employee createEmployee(EmployeeManageForm form, Integer updateEmployeeId) throws DuplicateEmailException {
        if (employeeMapper.findByEmail(form.getEmail()) != null) {
            throw new DuplicateEmailException("メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        Employee entity = new Employee();
        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        entity.setPassword(form.getPassword());
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp);
        employeeMapper.save(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);
        return entity;
    }

    @Transactional
    public Employee updateEmployee(Integer employeeId, EmployeeManageForm form, Integer updateEmployeeId)
            throws DuplicateEmailException, EmployeeNotFoundException {
        Employee entity = employeeMapper.getById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException("ID " + employeeId + " の従業員は見つかりませんでした。"));
        Employee existingByEmail = employeeMapper.findByEmail(form.getEmail());
        if (existingByEmail != null && !existingByEmail.getId().equals(employeeId)) {
            throw new DuplicateEmailException("メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }
        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        if (form.getPassword() != null && !form.getPassword().trim().isEmpty()) {
            entity.setPassword(form.getPassword());
        }
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp);
        employeeMapper.upDate(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);
        return entity;
    }

    // --- Method from EmployeeListService01 ---
    public List<Map<String, Object>> getAllEmployees(Integer adminFlag) {
        List<Map<String, Object>> employeeMapList = new ArrayList<>();
        // Map<String, Object> employeeMap; // Declared inside loop for safety, or can be reused if careful
        List<Employee> employeeList;
        if (adminFlag == null) {
            employeeList = employeeMapper.getAllOrderById();
        } else {
            employeeList = employeeMapper.getEmployeeByAdminFlagOrderById(adminFlag);
        }
        for (Employee employee : employeeList) {
            @SuppressWarnings("unchecked") // Suppress warning for ObjectMapper conversion
            Map<String, Object> employeeMap = objectMapper.convertValue(employee, Map.class);
            employeeMapList.add(employeeMap);
        }
        return employeeMapList;
    }

    // --- Method from EmployeeManageService02 ---
    @Transactional
    public void deleteEmployees(ListForm listForm, Integer updateEmployeeId) {
        for (String employeeIdStr : listForm.getIdList()) {
            int id = Integer.parseInt(employeeIdStr);
            employeeMapper.deleteById(id);
            // Consider logging deletion for each employee if needed, or one log for the batch.
            // Original code logged once for the batch.
        }
        //履歴記録 (Log history)
        // Action type 4 was used for delete in original EmployeeManageService02
        logHistoryService.execute(3, 4, null, null, updateEmployeeId , Timestamp.valueOf(LocalDateTime.now()));
    }
}
