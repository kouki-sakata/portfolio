/**
 * ダークモードトグルスイッチ初期化スクリプト
 */
document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('theme-toggle');
  if (toggleSwitch) {
    // 現在のテーマ状態をスイッチに反映
    toggleSwitch.checked = document.documentElement.getAttribute('data-theme') === 'dark';

    // トグルスイッチの変更イベント
    toggleSwitch.addEventListener('change', function(e) {
      // トランジションを一時的に無効にするクラスを追加
      document.documentElement.classList.add('no-transition');

      const newTheme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      try {
        localStorage.setItem('theme', newTheme);
      } catch (e) {
        // localStorageが利用できない場合でも動作を継続
      }

      // 短い遅延の後、no-transition クラスを削除
      setTimeout(() => {
        document.documentElement.classList.remove('no-transition');
      }, 0);
    });
  }

  // システムのカラースキーム変更を監視
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    // ユーザーが手動でテーマを設定していない場合のみ、システム設定に追従
    if (!localStorage.getItem('theme')) {
      // トランジションを一時的に無効にするクラスを追加
      document.documentElement.classList.add('no-transition');

      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      if (toggleSwitch) {
        toggleSwitch.checked = newTheme === 'dark';
      }

      // 短い遅延の後、no-transition クラスを削除
      setTimeout(() => {
        document.documentElement.classList.remove('no-transition');
      }, 0);
    }
  });
});