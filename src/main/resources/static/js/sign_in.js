//バリエーションチェックNo.1：必須チェック
$(document).ready(function() {

	$('#sign_in').on('click', function(e) {
		e.preventDefault(); // フォームの自動送信をキャンセル
		let isValid = true;
		$("#message_area").text("").hide();

		// 1. メールアドレスのバリデーション
		const email = $("#email").val().trim();
		if (email === "") {
			$("#message_area").text("メールアドレスを入力してください。").show();
			$("#email").focus();
			isValid = false;
		} else if (!isValidEmail(email) && isValid) {
			$("#message_area").text("有効なメールアドレスの形式で入力してください。").show();
			$("#email").focus();
			isValid = false;
		}

		// 2. パスワードのバリデーション
		if (isValid) {
			const password = $("#password").val().trim();
			if (password === "") {
				$("#message_area").text("パスワードを入力してください。").show();
				$("#password").focus();
				isValid = false;
			}
		}

		if (isValid) {
			$("#signin_form").submit();
		}
	});

	// 簡単なメールアドレス形式チェック関数
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
});

// パスワード表示/非表示
document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');

    if (passwordInput && togglePasswordButton) {
        const icon = togglePasswordButton.querySelector('i'); // ボタン内の<i>要素を取得

        togglePasswordButton.addEventListener('click', function () {
            // パスワードフィールドのtype属性を切り替える
            const currentType = passwordInput.getAttribute('type');
            if (currentType === 'password') {
                passwordInput.setAttribute('type', 'text');
                // アイコンを「非表示」状態（bi-eye-slash-fill）に変更
                if (icon) {
                    icon.classList.remove('bi-eye-fill');
                    icon.classList.add('bi-eye-slash-fill');
                }
            } else {
                passwordInput.setAttribute('type', 'password');
                // アイコンを「表示」状態（bi-eye-fill）に変更
                if (icon) {
                    icon.classList.remove('bi-eye-slash-fill');
                    icon.classList.add('bi-eye-fill');
                }
            }
        });
    } else {
        if (!passwordInput) {
            console.warn('パスワード入力フィールド (id="password") が見つかりません。');
        }
        if (!togglePasswordButton) {
            console.warn('パスワード表示/非表示ボタン (id="togglePassword") が見つかりません。');
        }
    }
});
