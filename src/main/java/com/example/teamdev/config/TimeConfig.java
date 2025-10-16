package com.example.teamdev.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * アプリケーション全体で共通利用する時刻ソースを提供する設定クラス。
 * 既定では JST (Asia/Tokyo) を使用するが、テスト等で上書きできるようプロパティで切り替え可能にしている。
 */
@Configuration
public class TimeConfig {

    private static final String DEFAULT_ZONE_ID = "Asia/Tokyo";

    @Bean
    public Clock systemClock(@Value("${app.timezone:" + DEFAULT_ZONE_ID + "}") String timezone) {
        return Clock.system(ZoneId.of(timezone));
    }
}
