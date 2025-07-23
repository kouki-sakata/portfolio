package com.example.teamdev.config;

import com.example.teamdev.util.LogUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

/**
 * アプリケーション終了時の処理を実行するクラス
 */
@Component
public class ShutdownConfig {

    private static final Logger logger = LoggerFactory.getLogger(ShutdownConfig.class);

    @Value("${spring.application.name:TeamDevelop}")
    private String applicationName;
    
    @Value("${app.version:1.0.0}")
    private String applicationVersion;

    /**
     * Spring Contextが閉じられる際のイベントハンドラ
     * @param event コンテキスト終了イベント
     */
    @EventListener
    public void handleContextClosed(ContextClosedEvent event) {
        logger.info("アプリケーション終了処理開始 - {}", applicationName);
        LogUtil.logApplicationEvent("STOP", applicationVersion);
        LogUtil.logBusiness("SHUTDOWN", null, "Application", applicationName, "INITIATED");
    }

    /**
     * PreDestroyアノテーションによる終了処理
     */
    @PreDestroy
    public void onDestroy() {
        logger.info("アプリケーション終了処理完了 - {}", applicationName);
        LogUtil.logBusiness("SHUTDOWN", null, "Application", applicationName, "COMPLETED");
    }
}