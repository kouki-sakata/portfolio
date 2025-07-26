/**
 * DataTablesスケルトンローディング処理共通ライブラリ
 * @author TeamDev 勤怠管理システム
 * @version 2.0.0
 */

// DataTablesスケルトンローディング管理クラス
class DataTablesLoading {
    constructor() {
        this.loadingStartTime = null;
        this.minimumLoadingTime = 500; // 最小表示時間（ミリ秒）
        this.isFirstLoad = true; // 初回ロード判定フラグ
        this.skeletonTableId = 'skeleton-loading-table';
        this.skeletonRows = 5; // スケルトンの行数
    }

    /**
     * スケルトンローディングを表示
     * @param {string} tableId - DataTablesのテーブルID
     * @param {Array} columns - カラム設定
     * @param {Array} columnDefs - カラム定義設定
     */
    showSkeletonLoading(tableId, columns, columnDefs) {
        this.loadingStartTime = new Date().getTime();

        const table = document.getElementById(tableId);
        if (!table) return;

        // 既存のスケルトンテーブルを削除
        this.hideSkeletonLoading(tableId);

        // スケルトンテーブルを作成
        const skeletonTable = this.createSkeletonTable(table, columns, columnDefs);
        skeletonTable.id = this.skeletonTableId;

        // 元のテーブルを非表示にしてスケルトンテーブルを挿入
        table.style.display = 'none';
        table.parentNode.insertBefore(skeletonTable, table);
    }

    /**
     * スケルトンローディングを非表示（最小表示時間を考慮）
     * @param {string} tableId - DataTablesのテーブルID
     */
    hideSkeletonLoadingWithDelay(tableId) {
        const elapsedTime = new Date().getTime() - this.loadingStartTime;
        const remainingTime = this.minimumLoadingTime - elapsedTime;

        setTimeout(() => {
            this.hideSkeletonLoading(tableId);
        }, remainingTime > 0 ? remainingTime : 0);
    }

    /**
     * スケルトンローディングを即座に非表示
     * @param {string} tableId - DataTablesのテーブルID
     */
    hideSkeletonLoading(tableId) {
        const table = document.getElementById(tableId);
        const skeletonTable = document.getElementById(this.skeletonTableId);

        if (table) {
            table.style.display = '';
        }

        if (skeletonTable) {
            skeletonTable.remove();
        }
    }

    /**
     * スケルトンテーブルを作成
     * @param {HTMLElement} originalTable - 元のテーブル要素
     * @param {Array} columns - カラム設定
     * @param {Array} columnDefs - カラム定義設定
     * @returns {HTMLElement} スケルトンテーブル要素
     */
    createSkeletonTable(originalTable, columns, columnDefs) {
        const table = document.createElement('table');

        // 元のテーブルのクラスを完全にコピー
        table.className = originalTable.className;

        // スケルトン用クラスを追加
        table.classList.add('skeleton-table');

        // DataTablesの幅競合を防ぐためwidth属性を明示的に設定
        table.style.width = '100%';

        // tbody を作成
        const tbody = document.createElement('tbody');

        for (let i = 0; i < this.skeletonRows; i++) {
            const tr = document.createElement('tr');

            columns.forEach((column, index) => {
                const td = document.createElement('td');

                // columnDefsからクラスを取得して適用
                const columnDefClasses = this.getColumnDefClasses(index, columnDefs);
                if (columnDefClasses) {
                    td.className = columnDefClasses;
                }

                const skeletonItem = this.createSkeletonItem(column);
                td.appendChild(skeletonItem);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);

        return table;
    }

    /**
     * columnDefsから指定されたカラムインデックスのクラスを取得
     * @param {number} columnIndex - カラムのインデックス
     * @param {Array} columnDefs - カラム定義設定
     * @returns {string} クラス名
     */
    getColumnDefClasses(columnIndex, columnDefs) {
        if (!columnDefs) return '';

        for (const def of columnDefs) {
            if (def.targets && def.className) {
                // targetsが配列の場合
                if (Array.isArray(def.targets) && def.targets.includes(columnIndex)) {
                    return def.className;
                }
                // targetsが数値の場合
                if (typeof def.targets === 'number' && def.targets === columnIndex) {
                    return def.className;
                }
            }
        }
        return '';
    }

    /**
     * カラムタイプに応じたスケルトンアイテムを作成
     * @param {Object} column - カラム設定
     * @returns {HTMLElement} スケルトンアイテム要素
     */
    createSkeletonItem(column) {
        const div = document.createElement('div');
        div.className = 'skeleton-item';

        // カラムの data 属性やタイトルに基づいてスケルトンのスタイルを決定
        const data = column.data;
        const title = column.title || '';

        if (data === null || title.includes('チェック') || column.orderable === false && column.searchable === false) {
            // チェックボックスやボタンカラム
            div.className = 'skeleton-item skeleton-checkbox';
        } else if (data === 'id' || title === 'ID' || title === '#') {
            // IDカラム
            div.className = 'skeleton-item skeleton-id';
        } else if (data && (data.includes('email') || title.includes('メール'))) {
            // メールアドレスカラム
            div.className = 'skeleton-item skeleton-email';
        } else if (data && (data.includes('name') || title.includes('氏名') || title.includes('名前'))) {
            // 氏名カラム
            div.className = 'skeleton-item skeleton-name';
        } else if (data && (data.includes('date') || title.includes('日付'))) {
            // 日付カラム
            div.className = 'skeleton-item skeleton-date';
        } else if (data && (data.includes('password') || title.includes('パスワード'))) {
            // パスワードカラム
            div.className = 'skeleton-item skeleton-password';
        } else if (data && (data.includes('content') || title.includes('内容'))) {
            // コンテンツカラム
            div.className = 'skeleton-item skeleton-content';
        } else if (title.includes('更新日時')) {
            // 更新日時カラム
            div.className = 'skeleton-item skeleton-datetime';
        } else if (title.includes('画面名')) {
            // 画面名カラム
            div.className = 'skeleton-item skeleton-screen';
        } else if (title.includes('操作種別')) {
            // 操作種別カラム
            div.className = 'skeleton-item skeleton-operation';
        } else if (title.includes('打刻時刻')) {
            // 打刻時刻カラム
            div.className = 'skeleton-item skeleton-stamp-time';
        } else if (title.includes('編集') || data === null) {
            // 編集ボタンカラム
            div.className = 'skeleton-item skeleton-button';
        } else {
            // デフォルト（中程度の長さ）
            div.className = 'skeleton-item medium';
        }

        return div;
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
     * DataTablesの設定にスケルトンローディング処理を追加
     * @param {Object} dataTablesConfig - DataTablesの設定オブジェクト
     * @param {string} tableId - DataTablesのテーブルID
     * @returns {Object} スケルトンローディング処理が追加された設定オブジェクト
     */
    applySkeletonLoadingToConfig(dataTablesConfig, tableId) {
        const loading = this;

        // initCompleteコールバックを上書き
        const originalInitComplete = dataTablesConfig.initComplete || function() {};
        dataTablesConfig.initComplete = function(settings, json) {
            loading.hideSkeletonLoadingWithDelay(tableId);
            loading.resetFirstLoadFlag();
            originalInitComplete.call(this, settings, json);
        };

        // preDrawCallbackを上書き
        const originalPreDrawCallback = dataTablesConfig.preDrawCallback || function() {};
        dataTablesConfig.preDrawCallback = function(settings) {
            if (loading.isFirstLoadCheck()) {
                loading.showSkeletonLoading(tableId, dataTablesConfig.columns, dataTablesConfig.columnDefs);
            }
            return originalPreDrawCallback.call(this, settings);
        };

        // drawCallbackを上書き
        const originalDrawCallback = dataTablesConfig.drawCallback || function() {};
        dataTablesConfig.drawCallback = function(settings) {
            if (loading.isFirstLoadCheck()) {
                loading.hideSkeletonLoadingWithDelay(tableId);
            }
            originalDrawCallback.call(this, settings);
        };

        return dataTablesConfig;
    }

    /**
     * 後方互換性のため、旧メソッド名も保持
     * @deprecated applySkeletonLoadingToConfig を使用してください
     */
    applyLoadingToConfig(dataTablesConfig, tableId) {
        return this.applySkeletonLoadingToConfig(dataTablesConfig, tableId || 'datatable');
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
