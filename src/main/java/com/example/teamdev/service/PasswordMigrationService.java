package com.example.teamdev.service;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.util.MessageUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;

/**
 * 既存の平文パスワードをハッシュ化するマイグレーションサービス
 * アプリケーション起動時に一度だけ実行される
 */
@Service
public class PasswordMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordMigrationService.class);

    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    
    @Value("${app.startup.password-migration.force:false}")
    private boolean forceMigration;

    public PasswordMigrationService(EmployeeMapper employeeMapper, PasswordEncoder passwordEncoder, Clock clock) {
        this.employeeMapper = employeeMapper;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    /**
     * 既存の平文パスワードをハッシュ化します
     * パスワードが既にハッシュ化されている場合はスキップします
     */
    @Transactional
    public void migratePasswords() {
        long startTime = System.currentTimeMillis();
        logger.info("パスワードマイグレーション処理を開始します（強制実行: {}）", forceMigration);
        
        // 高速事前チェック：最初の数件をサンプリング
        List<Employee> sampleEmployees = employeeMapper.getTopEmployees(10);
        boolean hasPossiblePlainText = sampleEmployees.stream()
            .anyMatch(emp -> emp.getPassword() != null && 
                            !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2A) && 
                            !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2B) && 
                            !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2Y));
        
        // サンプリングで平文が見つからず、強制実行でない場合は早期リターン
        if (!hasPossiblePlainText && !forceMigration) {
            logger.info("パスワードマイグレーション不要（サンプリング結果: 全てハッシュ化済み）");
            return;
        }
        
        // 全従業員データを取得（必要な場合のみ）
        List<Employee> employees = employeeMapper.getAllOrderById();
        List<Employee> plainPasswordEmployees = employees.stream()
            .filter(emp -> emp.getPassword() != null && 
                          !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2A) && 
                          !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2B) && 
                          !emp.getPassword().startsWith(AppConstants.Security.BCRYPT_PREFIX_2Y))
            .toList();
        
        int totalCount = employees.size();
        int migratedCount = 0;
        int skippedCount = totalCount - plainPasswordEmployees.size();
        
        // マイグレーション対象がない場合は早期リターン
        if (plainPasswordEmployees.isEmpty()) {
            logger.info("マイグレーション対象のパスワードはありません - 総従業員数: {}件", totalCount);
            return;
        }
        
        logger.info("マイグレーション対象: {}件 / 総従業員数: {}件", plainPasswordEmployees.size(), totalCount);
        
        // バッチ更新のための現在時刻を一度だけ取得
        Timestamp updateTime = Timestamp.from(clock.instant());
        
        for (Employee employee : plainPasswordEmployees) {
            try {
                String hashedPassword = passwordEncoder.encode(employee.getPassword());
                employee.setPassword(hashedPassword);
                employee.setUpdate_date(updateTime);
                
                employeeMapper.upDate(employee);
                migratedCount++;
                
                // 進捗ログを10件ごとに出力
                if (migratedCount % 10 == 0) {
                    logger.info("パスワードマイグレーション進捗: {}/{} 件完了", migratedCount, plainPasswordEmployees.size());
                }
                
            } catch (Exception e) {
                logger.error("従業員ID: {} のパスワードマイグレーションに失敗しました", employee.getId(), e);
                throw new RuntimeException("パスワードマイグレーション処理中にエラーが発生しました", e);
            }
        }
        
        long endTime = System.currentTimeMillis();
        long processingTime = endTime - startTime;
        
        logger.info("パスワードマイグレーション完了 - マイグレーション対象: {}件, スキップ: {}件, 処理時間: {}ms", 
                   migratedCount, skippedCount, processingTime);
    }
}
