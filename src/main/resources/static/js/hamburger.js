// ハンバーガーメニューの制御
document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガーメニュー要素
    const hamburgerBtn = document.querySelector('.hamburger_btn');
    const navMenu = document.querySelector('.common_nav');
    // オーバーレイ要素の作成
    const overlay = document.createElement('div');
    overlay.classList.add('menu_overlay');
    document.body.appendChild(overlay);
    // ハンバーガーボタンのクリックイベント
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('open');
            navMenu.classList.toggle('open');
            overlay.classList.toggle('open');
            document.body.classList.toggle('no-scroll');
        });
    }
    // オーバーレイクリックでメニューを閉じる
    overlay.addEventListener('click', function() {
        hamburgerBtn.classList.remove('open');
        navMenu.classList.remove('open');
        this.classList.remove('open');
        document.body.classList.remove('no-scroll');
    });
    // ナビメニュー内のリンクをクリックしたらメニューを閉じる
    const navLinks = document.querySelectorAll('.common_nav .nav_button');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                hamburgerBtn.classList.remove('open');
                navMenu.classList.remove('open');
                overlay.classList.remove('open');
                document.body.classList.remove('no-scroll');
            }
        });
    });
    // リサイズ時の処理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            hamburgerBtn.classList.remove('open');
            navMenu.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('no-scroll');
        }
    });
});
