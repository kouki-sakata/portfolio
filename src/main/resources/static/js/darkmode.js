/**
 * ダークモード切り替え機能
 * 高速化のためのベストプラクティスを適用
 */

// 即時実行関数で初期化処理をカプセル化
(function() {
  // ローカルストレージからテーマを取得、またはシステム設定をデフォルトとして使用
  let currentTheme = localStorage.getItem('theme');
  
  // ストレージに値がない場合はシステム設定を使用
  if (!currentTheme) {
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // テーマをすぐに適用
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // DOMContentLoaded イベントを使用せずに、スクリプト読み込み後にトグルの初期化
  const initToggle = function() {
    const toggleSwitch = document.getElementById('theme-toggle');
    if (toggleSwitch) {
      // 現在のテーマと同期
      toggleSwitch.checked = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // イベントリスナーを設定
      toggleSwitch.addEventListener('change', function(e) {
        toggleTheme(e.target.checked);
      });
    }
  };
  
  // トグル機能をグローバルに公開
  window.toggleTheme = function(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };
  
  // システムのカラースキーム変更を監視（オプション）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    // ユーザーが明示的に設定していない場合のみ自動変更
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
  
  // DOMが準備できているかどうかを確認
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle);
  } else {
    // DOMがすでに読み込まれている場合は直接実行
    initToggle();
  }
})();