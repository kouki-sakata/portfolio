package com.example.teamdev.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

/**
 * 従業員関連のキャッシュ管理に特化したサービスクラス。
 * キャッシュの無効化とクリア処理を一元管理し、単一責任の原則に従います。
 */
@Service
public class EmployeeCacheService {

    private final CacheManager cacheManager;

    /**
     * EmployeeCacheServiceのコンストラクタ。
     *
     * @param cacheManager キャッシュマネージャー
     */
    @Autowired
    public EmployeeCacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * 従業員キャッシュをクリアします。
     * データの更新・削除時に呼び出してデータの整合性を保ちます。
     */
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById", "employeesGrouped"},
                allEntries = true)
    public void clearEmployeeCache() {
        // Spring Cacheで自動的にキャッシュがクリアされるため、特別な処理は不要
        // このメソッドはキャッシュクリアのエントリーポイントとして機能
    }

    /**
     * 特定のキャッシュ名でキャッシュをクリアします。
     *
     * @param cacheName クリアするキャッシュの名前
     */
    public void clearCacheByName(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }

    /**
     * 全ての従業員関連キャッシュをクリアします。
     * 手動でキャッシュ管理が必要な場合に使用します。
     */
    public void clearAllEmployeeCaches() {
        clearCacheByName("employees");
        clearCacheByName("employeeDataTables");
        clearCacheByName("employeeById");
        clearCacheByName("employeesGrouped");
    }

    /**
     * 特定の従業員IDに関連するキャッシュをクリアします。
     *
     * @param employeeId 従業員ID
     */
    @CacheEvict(value = "employeeById", key = "#employeeId")
    public void clearEmployeeByIdCache(Integer employeeId) {
        // 特定の従業員IDのキャッシュのみクリア
    }

    /**
     * 特定の管理者フラグに関連するキャッシュをクリアします。
     *
     * @param adminFlag 管理者フラグ
     */
    @CacheEvict(value = "employees", key = "#adminFlag != null ? #adminFlag : 'all'")
    public void clearEmployeesByAdminFlagCache(Integer adminFlag) {
        // 特定の管理者フラグのキャッシュのみクリア
    }
}