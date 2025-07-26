package com.example.teamdev.service;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.util.MessageUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 既存の平文パスワードをハッシュ化するマイグレーションサービス
 * アプリケーション起動時に一度だけ実行される
 */
@Service
public class PasswordMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordMigrationService.class);

    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public PasswordMigrationService(EmployeeMapper employeeMapper, PasswordEncoder passwordEncoder) {
        this.employeeMapper = employeeMapper;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 既存の平文パスワードをハッシュ化します
     * パスワードが既にハッシュ化されている場合はスキップします
     */
    @Transactional
    public void migratePasswords() {
        logger.info("パスワードマイグレーション処理を開始します");
        
        List<Employee> employees = employeeMapper.getAllOrderById();
        int migratedCount = 0;
        int skippedCount = 0;
        
        for (Employee employee : employees) {
            String currentPassword = employee.getPassword();
            
            // BCryptの識別子で始まっていない場合は平文とみなす
            if (currentPassword != null && !currentPassword.startsWith(AppConstants.Security.BCRYPT_PREFIX_2A) && 
                !currentPassword.startsWith(AppConstants.Security.BCRYPT_PREFIX_2B) && 
                !currentPassword.startsWith(AppConstants.Security.BCRYPT_PREFIX_2Y)) {
                
                logger.debug("従業員ID: {} のパスワードをマイグレーション中", employee.getId());
                
                String hashedPassword = passwordEncoder.encode(currentPassword);
                employee.setPassword(hashedPassword);
                employee.setUpdate_date(Timestamp.valueOf(LocalDateTime.now()));
                
                employeeMapper.upDate(employee);
                migratedCount++;
            } else {
                skippedCount++;
            }
        }
        
        logger.info("パスワードマイグレーション完了 - マイグレーション対象: {}件, スキップ: {}件", 
                   migratedCount, skippedCount);
    }
}