// ====================
// 環境・ユーティリティ関数
// ====================

/**
 * 開発環境かどうかを判定
 * @returns {boolean} 開発環境の場合true
 */
window.isDevelopmentEnvironment = function() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' || 
           window.location.hostname.includes('dev') ||
           window.location.port === '8080' ||
           window.location.search.includes('debug=true');
};

/**
 * 本番環境かどうかを判定
 * @returns {boolean} 本番環境の場合true
 */
window.isProductionEnvironment = function() {
    return !window.isDevelopmentEnvironment();
};

/**
 * 条件付きコンソールログ（開発環境のみ）
 * @param {...any} args - ログに出力する引数
 */
window.devLog = function(...args) {
    if (window.isDevelopmentEnvironment()) {
        console.log('[DEV]', ...args);
    }
};

/**
 * 条件付きコンソール警告（開発環境のみ）
 * @param {...any} args - 警告に出力する引数
 */
window.devWarn = function(...args) {
    if (window.isDevelopmentEnvironment()) {
        console.warn('[DEV]', ...args);
    }
};

/**
 * 条件付きコンソールエラー（開発環境のみ）
 * @param {...any} args - エラーに出力する引数
 */
window.devError = function(...args) {
    if (window.isDevelopmentEnvironment()) {
        console.error('[DEV]', ...args);
    }
};

// ====================
// 既存のナビゲーション処理
// ====================

$(function () {
	let targetNav = $('#target_nav').val();
	let targetNavButton = $('#target_nav').val() + '-button';
	$('#' + targetNav).removeClass('bg_white').removeClass('shadow');
	$('#' + targetNav).addClass('bg_red_info');
	$('#' + targetNavButton ).removeClass('mt-2');
	$('#' + targetNavButton ).addClass('bg_white').addClass('btn_shadow').addClass('active-menu');

});
