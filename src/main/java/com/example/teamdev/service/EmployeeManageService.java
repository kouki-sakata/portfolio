package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class EmployeeManageService {

    private final EmployeeMapper employeeMapper;
    private final LogHistoryService01 logHistoryService;

    @Autowired
    public EmployeeManageService(EmployeeMapper employeeMapper, LogHistoryService01 logHistoryService) {
        this.employeeMapper = employeeMapper;
        this.logHistoryService = logHistoryService;
    }

    @Transactional
    public Employee createEmployee(EmployeeManageForm form, Integer updateEmployeeId) throws DuplicateEmailException {
        // This assumes employeeMapper.findByEmail returns an Employee object or null
        if (employeeMapper.findByEmail(form.getEmail()) != null) {
            throw new DuplicateEmailException("メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        Employee entity = new Employee();
        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        // Password should be encoded before saving. This is a critical security step.
        entity.setPassword(form.getPassword());
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));

        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp); // Assuming 'update_date' is appropriate for creation timestamp as well

        employeeMapper.save(entity);

        // Ensure action type for 'create' is correct for LogHistoryService01
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);
        return entity;
    }

    @Transactional
    public Employee updateEmployee(Integer employeeId, EmployeeManageForm form, Integer updateEmployeeId)
            throws DuplicateEmailException, EmployeeNotFoundException {

        // Assumes employeeMapper.getById returns Optional<Employee>
        Employee entity = employeeMapper.getById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException("ID " + employeeId + " の従業員は見つかりませんでした。"));

        // Check if the new email duplicates another employee's email
        Employee existingByEmail = employeeMapper.findByEmail(form.getEmail());
        if (existingByEmail != null && !existingByEmail.getId().equals(employeeId)) {
            throw new DuplicateEmailException("メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        // Only update password if provided and not empty. Password should be encoded.
        if (form.getPassword() != null && !form.getPassword().trim().isEmpty()) {
            entity.setPassword(form.getPassword());
        }
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp);

        employeeMapper.upDate(entity); // Ensure 'upDate' is the correct method name in EmployeeMapper

        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);
        return entity;
    }
}
