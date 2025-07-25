/**
 * DataTablesローディング処理共通ライブラリ
 * @author TeamDev 勤怠管理システム
 * @version 1.0.0
 */

// DataTablesローディング管理クラス
class DataTablesLoading {
    constructor() {
        this.loadingStartTime = null;
        this.minimumLoadingTime = 500; // 最小表示時間（ミリ秒）
        this.isFirstLoad = true; // 初回ロード判定フラグ
        this.loadingOverlayId = 'loading-overlay';
    }

    /**
     * ローディングオーバーレイを表示
     */
    showLoading() {
        this.loadingStartTime = new Date().getTime();
        const overlay = document.getElementById(this.loadingOverlayId);
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    /**
     * ローディングオーバーレイを非表示（最小表示時間を考慮）
     */
    hideLoadingWithDelay() {
        const elapsedTime = new Date().getTime() - this.loadingStartTime;
        const remainingTime = this.minimumLoadingTime - elapsedTime;
        
        setTimeout(() => {
            const overlay = document.getElementById(this.loadingOverlayId);
            if (overlay) {
                overlay.classList.remove('show');
            }
        }, remainingTime > 0 ? remainingTime : 0);
    }

    /**
     * 初回ロードフラグをリセット
     */
    resetFirstLoadFlag() {
        this.isFirstLoad = false;
    }

    /**
     * 初回ロードかどうかを判定
     * @returns {boolean} 初回ロードの場合true
     */
    isFirstLoadCheck() {
        return this.isFirstLoad;
    }

    /**
     * DataTablesの設定にローディング処理を追加
     * @param {Object} dataTablesConfig - DataTablesの設定オブジェクト
     * @returns {Object} ローディング処理が追加された設定オブジェクト
     */
    applyLoadingToConfig(dataTablesConfig) {
        const loading = this;

        // initCompleteコールバックを上書き
        const originalInitComplete = dataTablesConfig.initComplete || function() {};
        dataTablesConfig.initComplete = function(settings, json) {
            loading.hideLoadingWithDelay();
            loading.resetFirstLoadFlag();
            console.log('[DATATABLES_LOADING] 初回ロード完了 - 以降ローディング処理無効');
            originalInitComplete.call(this, settings, json);
        };

        // preDrawCallbackを上書き
        const originalPreDrawCallback = dataTablesConfig.preDrawCallback || function() {};
        dataTablesConfig.preDrawCallback = function(settings) {
            if (loading.isFirstLoadCheck()) {
                loading.showLoading();
            }
            return originalPreDrawCallback.call(this, settings);
        };

        // drawCallbackを上書き
        const originalDrawCallback = dataTablesConfig.drawCallback || function() {};
        dataTablesConfig.drawCallback = function(settings) {
            if (loading.isFirstLoadCheck()) {
                loading.hideLoadingWithDelay();
            }
            originalDrawCallback.call(this, settings);
        };

        return dataTablesConfig;
    }

    /**
     * ローディングオーバーレイHTMLを生成
     * @returns {string} ローディングオーバーレイのHTML
     */
    static generateLoadingOverlayHTML() {
        return `
            <div class="loading-overlay" id="loading-overlay">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }

    /**
     * 指定された要素にローディングオーバーレイを追加
     * @param {string|Element} containerSelector - コンテナのセレクタまたは要素
     */
    static addLoadingOverlayToContainer(containerSelector) {
        const container = typeof containerSelector === 'string' 
            ? document.querySelector(containerSelector) 
            : containerSelector;
            
        if (container && !container.querySelector('#loading-overlay')) {
            container.insertAdjacentHTML('afterbegin', this.generateLoadingOverlayHTML());
        }
    }
}

// グローバルファクトリ関数
window.createDataTablesLoading = function() {
    return new DataTablesLoading();
};

// 便利な静的メソッドをグローバルに公開
window.DataTablesLoadingUtils = {
    generateLoadingOverlayHTML: DataTablesLoading.generateLoadingOverlayHTML,
    addLoadingOverlayToContainer: DataTablesLoading.addLoadingOverlayToContainer
};