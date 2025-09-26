package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.dto.api.employee.EmployeeDeleteRequest;
import com.example.teamdev.dto.api.employee.EmployeeListResponse;
import com.example.teamdev.dto.api.employee.EmployeeUpsertRequest;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.util.SecurityUtil;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "従業員 管理 API")
public class EmployeeRestController {

    private final EmployeeService employeeService;

    public EmployeeRestController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<EmployeeListResponse> list(@RequestParam(name = "adminOnly", defaultValue = "false") boolean adminOnly) {
        Integer filterFlag = adminOnly ? 1 : null;
        List<Employee> employees = employeeService.getAllEmployees(filterFlag);
        List<EmployeeSummaryResponse> summaries = employees.stream()
            .map(this::toSummary)
            .toList();
        return ResponseEntity.ok(new EmployeeListResponse(summaries));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeSummaryResponse> create(@Valid @RequestBody EmployeeUpsertRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for new employees");
        }
        Integer operatorId = requireCurrentEmployee();
        EmployeeManageForm form = toForm(null, request, true);
        try {
            Employee created = employeeService.createEmployee(form, operatorId);
            return ResponseEntity.status(HttpStatus.CREATED).body(toSummary(created));
        } catch (DuplicateEmailException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex);
        }
    }

    @PutMapping("/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeSummaryResponse> update(
        @PathVariable Integer employeeId,
        @Valid @RequestBody EmployeeUpsertRequest request
    ) {
        Integer operatorId = requireCurrentEmployee();
        EmployeeManageForm form = toForm(employeeId, request, false);
        try {
            Employee updated = employeeService.updateEmployee(employeeId, form, operatorId);
            return ResponseEntity.ok(toSummary(updated));
        } catch (DuplicateEmailException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex);
        } catch (EmployeeNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@Valid @RequestBody EmployeeDeleteRequest request) {
        Integer operatorId = requireCurrentEmployee();
        ListForm listForm = new ListForm(
            request.ids().stream().map(String::valueOf).toList(),
            null
        );
        employeeService.deleteEmployees(listForm, operatorId);
        return ResponseEntity.noContent().build();
    }

    private Integer requireCurrentEmployee() {
        Integer operatorId = SecurityUtil.getCurrentEmployeeId();
        if (operatorId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return operatorId;
    }

    private EmployeeSummaryResponse toSummary(Employee employee) {
        boolean admin = employee.getAdmin_flag() != null && employee.getAdmin_flag() == 1;
        return new EmployeeSummaryResponse(
            employee.getId(),
            employee.getFirst_name(),
            employee.getLast_name(),
            employee.getEmail(),
            admin
        );
    }

    private EmployeeManageForm toForm(Integer employeeId, EmployeeUpsertRequest request, boolean create) {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setEmployeeId(employeeId != null ? String.valueOf(employeeId) : null);
        form.setFirstName(request.firstName());
        form.setLastName(request.lastName());
        form.setEmail(request.email());
        form.setAdminFlag(request.admin() ? "1" : "0");
        if (create || (request.password() != null && !request.password().isBlank())) {
            form.setPassword(request.password());
        } else {
            form.setPassword("");
        }
        return form;
    }
}
