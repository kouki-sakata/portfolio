package com.example.teamdev.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * AOP設定クラス
 * AspectJによるAOPを有効化し、セッション管理などの横断的関心事を処理
 */
@Configuration
@EnableAspectJAutoProxy
public class AspectConfig {
    // AOPの設定のみ（Bean定義は各Aspectクラスで@Componentを使用）
}