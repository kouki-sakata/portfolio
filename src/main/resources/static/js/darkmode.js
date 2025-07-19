/**
 * ダークモードちらつき防止スクリプト（インライン用）
 */
(function() {
  // 一時的にトランジションを無効にするクラスを追加
  document.documentElement.classList.add('no-transition');

  let theme;
  try {
    theme = localStorage.getItem('theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  } catch (e) {
    theme = 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);

  // DOMContentLoaded または次のフレームで no-transition クラスを削除
  // これにより、初期ロード時のトランジションを防止し、その後のトランジションを有効にする
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 0);
  });
})();
