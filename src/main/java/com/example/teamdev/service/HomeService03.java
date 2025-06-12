package com.example.teamdev.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
// Remove: import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class HomeService03 {

    private final EmployeeMapper mapper;
    // Remove: private final PasswordEncoder passwordEncoder;

    @Autowired
    public HomeService03(EmployeeMapper mapper) { // Remove PasswordEncoder from constructor
        this.mapper = mapper;
        // Remove: this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> execute(Employee employeeFromForm) {
        Map<String, Object> map = new HashMap<>();
        String email = employeeFromForm.getEmail();
        String rawPassword = employeeFromForm.getPassword(); // Plain text password from form

        Employee targetEmployee = mapper.getEmployeeByEmail(email);

        if (Objects.nonNull(targetEmployee)) {
            // Revert to plain-text password comparison
            if (targetEmployee.getPassword().equals(rawPassword)) {
                // Passwords match
                map = new ObjectMapper().convertValue(targetEmployee, Map.class);
                String employeeName = map.get("first_name").toString() +
                        "　" + map.get("last_name").toString();
                map.put("employeeName", employeeName);
                map.put("signInTime", LocalDateTime.now());
                map.remove("password");
                return map;
            } else {
                // Password does not match
                return map; // Return empty map
            }
        } else {
            // Email not found
            return map; // Return empty map
        }
    }
}
