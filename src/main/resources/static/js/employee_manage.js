/**
 * 2024/03/21 n.yasunari 新規作成
 * 2025/06/29 Gemini リアルタイムバリデーション追加
 * 2025/06/29 Gemini ローディングインジケーター追加
 */
//全選択チェックボックス
$("#all").change(function() {
    // "all" チェックボックスの状態を取得
    let isChecked = $(this).prop("checked");
    // クラスが "delete_check" のチェックボックスの状態を変更
    $(".delete_check").prop("checked", isChecked);
});
//編集ボタンクリック
$(".td_btn").click(function() {
	//クリックした行のデータを「従業員情報　新規登録・変更」にセットする
    let tr = $(this).closest("tr");
    let id = tr.find(".id").text();
    let firstName = tr.find(".first_name").text();
    let lastName = tr.find(".last_name").text();
    let email = tr.find(".email").text();
    let password = tr.find(".password").text();
    let adminCheckbox = tr.find(".admin_flag");
    
    $("#input_id").val(id);
    $("#input_first_name").val(firstName);
    $("#input_last_name").val(lastName);
    $("#input_email").val(email);
    $("#input_password").val(password);
	let adminFlagChecked = adminCheckbox.is(":checked");
    $("#input_admin").prop("checked", adminFlagChecked);
    
    // 編集時に既存のエラーメッセージをクリア
    clearAllErrors();
});

// エラーメッセージ表示ヘルパー
function displayError(fieldId, message) {
    $("#" + fieldId + "_error").text(message).show();
    $("#" + fieldId).addClass("is-invalid");
}

// エラーメッセージクリアヘルパー
function clearError(fieldId) {
    $("#" + fieldId + "_error").text("").hide();
    $("#" + fieldId).removeClass("is-invalid");
}

// 全てのエラーメッセージをクリア
function clearAllErrors() {
    clearError("input_first_name");
    clearError("input_last_name");
    clearError("input_email");
    clearError("input_password");
    $("#regist_message_area").text("");
}

// フィールドごとのバリデーション関数
function validateField(fieldId, value) {
    let isValid = true;
    clearError(fieldId); // まずエラーをクリア

    switch (fieldId) {
        case "input_first_name":
            if (value.trim() === "") {
                displayError(fieldId, "姓を入力してください。");
                isValid = false;
            }
            break;
        case "input_last_name":
            if (value.trim() === "") {
                displayError(fieldId, "名を入力してください。");
                isValid = false;
            }
            break;
        case "input_email":
            if (value.trim() === "") {
                displayError(fieldId, "メールアドレスを入力してください。");
                isValid = false;
            } else {
                let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    displayError(fieldId, "有効なメールアドレス形式で入力してください。");
                    isValid = false;
                }
            }
            break;
        case "input_password":
            if (value.trim() === "") {
                displayError(fieldId, "パスワードを入力してください。");
                isValid = false;
            } else if (value.length < 8 || value.length > 16) {
                displayError(fieldId, "パスワードは文字数8文字以上、16文字以内で入力してください。");
                isValid = false;
            }
            break;
    }
    return isValid;
}

// リアルタイムバリデーションのイベントリスナー設定
$("#input_first_name, #input_last_name, #input_email, #input_password").on("blur keyup", function() {
    validateField($(this).attr("id"), $(this).val());
});

// ローディング表示関数
function showLoading(buttonId) {
    const button = $("#" + buttonId);
    button.prop("disabled", true); // ボタンを無効化
    button.find(".button-text").addClass("d-none"); // テキストを非表示
    button.find(".spinner-border").removeClass("d-none"); // スピナーを表示
}

//登録ボタンsubmit
$('#regist').on('click', function() {
    clearAllErrors(); // 登録ボタンクリック時も全てのエラーをクリア

    let isValidForm = true;
    // 全フィールドのバリデーションを実行
    if (!validateField("input_first_name", $("#input_first_name").val())) isValidForm = false;
    if (!validateField("input_last_name", $("#input_last_name").val())) isValidForm = false;
    if (!validateField("input_email", $("#input_email").val())) isValidForm = false;
    if (!validateField("input_password", $("#input_password").val())) isValidForm = false;

    if (isValidForm) {
        //チェックボックスadminFlagの値を設定
        let isAdminChecked = $("#input_admin").prop("checked");
        // adminFlagの値を設定
        if (isAdminChecked) {
            // チェックボックスがONの場合は"1"を設定
            $("#admin_flag").val("1");
        } else {
            // チェックボックスがOFFの場合は"0"を設定
            $("#admin_flag").val("0");
        }
        $("#input_id").removeAttr("disabled");
        showLoading("regist"); // ローディング表示
        $("#regist_form").submit();
    } else {
        $("#regist_message_area").text("入力内容にエラーがあります。修正してください。");
    }
});

//削除ボタンsubmit
$('#delete').click(function() {
	//必須チェック
	let checkedCheckboxes = $(".delete_check:checked");
	if (checkedCheckboxes.length > 0) {
	    checkedCheckboxes.each(function(index) {
	        // チェックボックスが属するtr要素を取得
	        let trElement = $(this).closest('tr');
	        // tr要素内のclass="id"の値を取得してチェックボックスのvalue属性にセット
	        $(this).val(trElement.find('.id').text());
	        // name属性をセット
	        $(this).attr("name", "idList[" + index + "]");
	    });
        showLoading("delete"); // ローディング表示
	    $("#delete_form").submit();
	} else {
	    $("#delete_message_area").text("削除する従業員情報を選択してください。");
	}
});
