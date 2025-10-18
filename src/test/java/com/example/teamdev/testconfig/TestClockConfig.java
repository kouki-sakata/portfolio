package com.example.teamdev.testconfig;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * テスト環境用のClock Bean設定
 *
 * 本番環境ではTimeConfig.javaでClock Beanを提供しているが、
 * テスト環境では固定時刻のClockを提供することで、
 * 時刻に依存するテストを安定させる。
 */
@TestConfiguration
public class TestClockConfig {

    /**
     * テスト用の固定時刻Clock Beanを提供
     *
     * 固定時刻: 2025-01-15 18:00:00 JST (09:00:00 UTC)
     * タイムゾーン: Asia/Tokyo
     *
     * @Primary アノテーションにより、TimeConfigのClock Beanより優先される
     */
    @Bean
    @Primary
    public Clock testClock() {
        return Clock.fixed(
            Instant.parse("2025-01-15T09:00:00Z"),
            ZoneId.of("Asia/Tokyo")
        );
    }
}
