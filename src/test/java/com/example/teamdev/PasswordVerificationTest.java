package com.example.teamdev;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.junit.jupiter.api.Test;

public class PasswordVerificationTest {

    @Test
    public void verifyPasswords() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // データベースに保存されているハッシュ（test@gmail.com）
        String storedHash = "$2y$10$QSukgcKC8We4gVB6yeTfFeSGzhymFxAfoKm/QfJnE9FlrYC/7eHvu";

        // テストするパスワード
        String[] passwords = {
            "password",
            "testtest",
            "test",
            "123456",
            "admin",
            "Test@123",
            "test1234",
            "Test1234",
            "testpassword"
        };

        System.out.println("=== BCrypt Password Verification ===");
        System.out.println("Stored hash: " + storedHash);
        System.out.println();

        for (String password : passwords) {
            boolean matches = encoder.matches(password, storedHash);
            System.out.println(String.format("Password: %-15s -> %s",
                password, matches ? "✅ MATCH" : "❌ NO MATCH"));
        }

        // 新しいハッシュを生成（参考用）
        System.out.println("\n=== Generate new hash for 'testtest' ===");
        String newHash = encoder.encode("testtest");
        System.out.println("New hash for 'testtest': " + newHash);

        // 新しいハッシュで検証
        boolean newHashMatches = encoder.matches("testtest", newHash);
        System.out.println("Verification for new hash: " + (newHashMatches ? "✅ WORKS" : "❌ FAILED"));
    }
}