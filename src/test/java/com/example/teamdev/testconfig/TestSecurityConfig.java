package com.example.teamdev.testconfig;

import org.springframework.boot.test.context.TestConfiguration;

/**
 * テスト用のセキュリティ設定
 * MockMvc テストでセキュリティコンテキストとCSRFトークンが適切に処理されるように設定
 *
 * ApiTestSupport.login() でセキュリティコンテキストを手動でセッションに設定することで対応
 * SecurityFilterChainのオーバーライドは複雑すぎるため、
 * 代わりにSecurityConfigの実装を信頼し、ApiTestSupportで適切にセッションを設定する
 */
@TestConfiguration
public class TestSecurityConfig {
    // SecurityFilterChainやSecurityContextRepositoryのBean定義は行わない
    // これによりSecurityConfigで定義された本番用の設定がそのまま使用される
    //
    // テストでの問題点:
    // 1. SecurityContext: ApiTestSupport.login()で手動設定して解決済み
    // 2. CSRFトークン: Spring Security Testの.with(csrf())を使用
    //
    // .with(csrf())は自動的にセッションからCSRFトークンを取得するか、
    // 新しいトークンを生成してセッションに保存するため、問題なく動作するはず
}
