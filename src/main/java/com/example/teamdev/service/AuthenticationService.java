package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.util.LogUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * サインイン（ログイン）処理に関するビジネスロジックを担当するサービスクラスです。
 * ユーザーの認証（現在はメールアドレスとパスワードの完全一致）を行います。
 */
@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    
    private final EmployeeMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    /**
     * AuthenticationServiceのコンストラクタ。
     * EmployeeMapperとPasswordEncoderをインジェクションします。
     *
     * @param mapper 従業員マッパー
     * @param passwordEncoder パスワードエンコーダー
     * @param objectMapper JSONマッパー
     */
    public AuthenticationService(EmployeeMapper mapper, PasswordEncoder passwordEncoder, ObjectMapper objectMapper, Clock clock) {
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * 指定された従業員情報（メールアドレスとパスワード）に基づいてサインイン処理を実行します。
     * メールアドレスで従業員を検索し、パスワードが一致すれば従業員情報をMap形式で返します。
     * 一致しない場合や従業員が見つからない場合は空のMapを返します。
     *
     * @param employeeFromForm サインインフォームから入力されたメールアドレスとパスワードを含むEmployeeオブジェクト
     * @return 認証成功時は従業員情報（名前、IDなど）とサインイン時刻を含むMap。失敗時は空のMap。
     */
    public Map<String, Object> execute(Employee employeeFromForm) {
        long startTime = LogUtil.startPerformanceMeasurement();
        Map<String, Object> map = new HashMap<>();
        String email = employeeFromForm.getEmail();
        String rawPassword = employeeFromForm.getPassword(); // フォームからの平文パスワード

        try {
            logger.info("認証処理開始 - Email: {}", email != null ? email.substring(0, Math.min(email.length(), 3)) + "***" : "null");
            
            Employee targetEmployee = mapper.getEmployeeByEmail(email); // メールアドレスで従業員を検索

            if (Objects.nonNull(targetEmployee)) {
                // BCryptPasswordEncoderでハッシュ化されたパスワードとの比較
                if (passwordEncoder.matches(rawPassword, targetEmployee.getPassword())) {
                    // パスワードが一致
                    @SuppressWarnings("unchecked") // ObjectMapperによるMap変換のキャスト警告を抑制
                    Map<String, Object> employeeAsMap = objectMapper.convertValue(
                            targetEmployee, Map.class);
                    map.putAll(employeeAsMap); // マッピングされた従業員情報をそのまま追加

                    String employeeName = targetEmployee.getFirst_name() +
                            " " + targetEmployee.getLast_name();
                    map.put("employeeName", employeeName); // 表示用の従業員名
                    map.put("signInTime", LocalDateTime.now(clock)); // サインイン時刻
                    map.remove("password"); // セキュリティのためパスワード情報は削除
                    
                    // 認証成功ログ
                    LogUtil.logAuthentication(email, true, "localhost");
                    LogUtil.logBusiness("LOGIN", targetEmployee.getId(), "Employee", 
                        targetEmployee.getId().toString(), "SUCCESS");
                    logger.info("認証成功 - ユーザー: {}", employeeName);
                    
                    return map;
                } else {
                    // パスワードが不一致
                    LogUtil.logAuthentication(email, false, "localhost");
                    logger.warn("認証失敗 - パスワード不一致 - Email: {}", email);
                    return map; // 空のMapを返す
                }
            } else {
                // メールアドレスに該当する従業員が見つからない
                LogUtil.logAuthentication(email, false, "localhost");
                logger.warn("認証失敗 - ユーザーが見つかりません - Email: {}", email);
                return map; // 空のMapを返す
            }
        } catch (Exception e) {
            LogUtil.logError(logger, "認証処理中にエラーが発生しました", e, null, "email=" + email);
            return map; // エラー時は空のMapを返す
        } finally {
            LogUtil.endPerformanceMeasurement(startTime, "AuthenticationService.execute", 
                "email=" + (email != null ? email.substring(0, Math.min(email.length(), 3)) + "***" : "null"));
        }
    }
}
