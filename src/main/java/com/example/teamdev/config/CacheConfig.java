package com.example.teamdev.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cacheの設定クラス
 * メモリリーク対策として適切なキャッシュサイズ制限を実装
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * キャッシュマネージャーを設定します
     * シンプルなConcurrentMapCacheManagerを使用
     *
     * @return 設定されたキャッシュマネージャー
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 使用するキャッシュ名を事前に設定
        cacheManager.setCacheNames(java.util.Arrays.asList(
                "employees",           // 従業員一覧キャッシュ
                "employeeDataTables",  // DataTables用従業員データキャッシュ
                "employeeById"         // ID別従業員キャッシュ
        ));

        return cacheManager;
    }
}