package com.example.teamdev.security;

import com.example.teamdev.entity.Employee;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Objects;

/**
 * Spring Security におけるカスタム UserDetails。
 * Employee エンティティを内部に保持し、認証コンテキストから直接従業員情報を取得できるようにする。
 */
public final class TeamDevelopUserDetails implements UserDetails {

    private static final long serialVersionUID = 1L;

    private final Employee employee;
    private final Collection<? extends GrantedAuthority> authorities;

    public TeamDevelopUserDetails(Employee employee, Collection<? extends GrantedAuthority> authorities) {
        this.employee = Objects.requireNonNull(employee, "employee must not be null");
        this.authorities = Objects.requireNonNull(authorities, "authorities must not be null");
    }

    public Employee getEmployee() {
        return employee;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return employee.getPassword();
    }

    @Override
    public String getUsername() {
        return employee.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
