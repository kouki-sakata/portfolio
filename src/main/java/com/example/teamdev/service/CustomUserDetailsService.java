package com.example.teamdev.service;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.util.MessageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final EmployeeMapper employeeMapper;

    @Autowired
    public CustomUserDetailsService(EmployeeMapper employeeMapper) {
        this.employeeMapper = employeeMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Employee employee = employeeMapper.getEmployeeByEmail(email);
        
        if (employee == null) {
            throw new UsernameNotFoundException(MessageUtil.getMessage("auth.user.not.found", new Object[]{email}));
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        if (employee.getAdmin_flag() == AppConstants.Employee.ADMIN_FLAG_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + AppConstants.Employee.ADMIN_AUTHORITY));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + AppConstants.Employee.USER_AUTHORITY));
        }

        return new User(
            employee.getEmail(),
            employee.getPassword(),
            true, // enabled
            true, // accountNonExpired
            true, // credentialsNonExpired
            true, // accountNonLocked
            authorities
        );
    }
}