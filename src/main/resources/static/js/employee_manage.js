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
});
//登録ボタンsubmit
$('#regist').on('click', function() {
	//必須チェック
    let firstNameValue = $("#input_first_name").val();
    let lastNameValue = $("#input_last_name").val();
    let emailValue = $("#input_email").val();
    let passwordValue = $("#input_password").val();

    if (firstNameValue.trim() === "") {
		$("#regist_message_area").text("姓を入力してください。");
        return;

    }
    if (lastNameValue.trim() === "") {
        $("#regist_message_area").text("名を入力してください。");
        return;
    }
    if (emailValue.trim() === "") {
        $("#regist_message_area").text("メールアドレスを入力してください。");
        return;
    }
	// メール形式チェックを追加（2025/4/22 山本追記)
		    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		    if (!emailRegex.test(emailValue)) {
		        $("#regist_message_area").text("有効なメールアドレス形式で入力してください。");
		        return;
		    }
    if (passwordValue.trim() === "") {
        $("#regist_message_area").text("パスワードを入力してください。");
        return;
    }
	// パスワード文字数チェック（2025/4/22 山本追記）
	if (passwordValue.length < 8 || passwordValue.length > 16) {
	    $("#regist_message_area").text("パスワードは文字数8文字以上、16文字以内で入力してください。");
	    return;
	}
	//必須チェックOKの場合はsubmitする
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
	$("#regist_form").submit();
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
	    $("#delete_form").submit();
	} else {
	    $("#delete_message_area").text("削除する従業員情報を選択してください。");
	}
});
