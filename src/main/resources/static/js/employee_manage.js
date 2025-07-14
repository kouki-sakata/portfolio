$(document).ready(function () {
    let loadingStartTime;
    const minimumLoadingTime = 500; // 最小表示時間（ミリ秒）

    // DataTablesの初期化
    const employeeTable = $('#employee-table').DataTable({
        "serverSide": true,
        "ajax": {
            "url": "/employeemanage/data",
            "type": "POST",
            "contentType": "application/json",
            "data": function (d) {
                return JSON.stringify(d);
            }
        },
        "columns": [
            {
                "data": null,
                "render": function (data, type, row) {
                    return `<input type="checkbox" class="delete_check form-check-input checkbox-large" value="${row.id}">`;
                },
                "orderable": false
            },
            { "data": "id" },
            { "data": "first_name" },
            { "data": "last_name" },
            { "data": "email" },
            { "data": "password" },
            {
                "data": "admin_flag",
                "render": function (data, type, row) {
                    return `<input class="admin_flag form-check-input checkbox-large" disabled="disabled" type="checkbox" ${data == 1 ? 'checked' : ''}>`;
                },
                "orderable": false
            },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<i class="td_btn fa-solid fa-pencil"></i>';
                },
                "orderable": false
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json"
        },
        "initComplete": function (settings, json) {
            hideLoadingWithDelay();
        },
        "preDrawCallback": function (settings) {
            showLoading();
        },
        "drawCallback": function (settings) {
            hideLoadingWithDelay();
        }
    });

    function showLoading() {
        loadingStartTime = new Date().getTime();
        $('#loading-overlay').addClass('show');
    }

    function hideLoadingWithDelay() {
        const elapsedTime = new Date().getTime() - loadingStartTime;
        const remainingTime = minimumLoadingTime - elapsedTime;
        setTimeout(() => {
            $('#loading-overlay').removeClass('show');
        }, remainingTime > 0 ? remainingTime : 0);
    }

    // --- イベントデリゲーション ---

    // 編集ボタンクリック
    $('#employee-table tbody').on('click', '.td_btn', function () {
        const data = employeeTable.row($(this).parents('tr')).data();
        $("#input_id").val(data.id);
        $("#input_first_name").val(data.first_name);
        $("#input_last_name").val(data.last_name);
        $("#input_email").val(data.email);
        $("#input_password").val(data.password);
        $("#input_admin").prop("checked", data.admin_flag == 1);
        clearAllErrors();
    });

    // 全選択チェックボックス
    $('#select-all-employees').on('click', function () {
        const rows = employeeTable.rows({ 'search': 'applied' }).nodes();
        $('.delete_check', rows).prop('checked', this.checked);
    });

    // 個別チェックボックスの変更で「全選択」の状態を更新
    $('#employee-table tbody').on('change', 'input[type="checkbox"]', function () {
        if (!this.checked) {
            const el = $('#select-all-employees').get(0);
            if (el && el.checked && ('indeterminate' in el)) {
                el.indeterminate = true;
            }
        }
    });

    // 削除ボタンsubmit
    $('#delete').on('click', function () {
        const selectedIds = [];
        employeeTable.$('.delete_check:checked').each(function () {
            selectedIds.push($(this).val());
        });

        if (selectedIds.length > 0) {
            if (confirm('選択した従業員情報を本当に削除しますか？\nこの操作は元に戻せません。')) {
                // 既存のhidden inputをクリア
                $('#delete_form input[name="idList"]').remove();
                // 新しいhidden inputを追加
                selectedIds.forEach(function (id) {
                    $('#delete_form').append(`<input type="hidden" name="idList" value="${id}">`);
                });
                showButtonLoading("delete");
                $("#delete_form").submit();
            }
        } else {
            $("#delete_message_area").text("削除する従業員情報を選択してください。");
        }
    });


    // --- フォームバリデーション ---
    function displayError(fieldId, message) {
        $("#" + fieldId + "_error").text(message).show();
        $("#" + fieldId).addClass("is-invalid");
    }

    function clearError(fieldId) {
        $("#" + fieldId + "_error").text("").hide();
        $("#" + fieldId).removeClass("is-invalid");
    }

    function clearAllErrors() {
        clearError("input_first_name");
        clearError("input_last_name");
        clearError("input_email");
        clearError("input_password");
        $("#regist_message_area").text("");
    }

    function validateField(fieldId, value) {
        let isValid = true;
        clearError(fieldId);

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
                if ($("#input_id").val() === "" && value.trim() === "") { // 新規登録時のみ必須
                     displayError(fieldId, "パスワードを入力してください。");
                     isValid = false;
                } else if (value.trim() !== "" && (value.length < 8 || value.length > 16)) {
                    displayError(fieldId, "パスワードは8文字以上、16文字以内で入力してください。");
                    isValid = false;
                }
                break;
        }
        return isValid;
    }

    $("#input_first_name, #input_last_name, #input_email, #input_password").on("blur keyup", function () {
        validateField($(this).attr("id"), $(this).val());
    });

    function showButtonLoading(buttonId) {
        const button = $("#" + buttonId);
        button.prop("disabled", true);
        button.find(".button-text").addClass("d-none");
        button.find(".spinner-border").removeClass("d-none");
    }

    $('#regist').on('click', function () {
        clearAllErrors();
        let isValidForm = true;
        if (!validateField("input_first_name", $("#input_first_name").val())) isValidForm = false;
        if (!validateField("input_last_name", $("#input_last_name").val())) isValidForm = false;
        if (!validateField("input_email", $("#input_email").val())) isValidForm = false;
        if (!validateField("input_password", $("#input_password").val())) isValidForm = false;

        if (isValidForm) {
            $("#admin_flag").val($("#input_admin").prop("checked") ? "1" : "0");
            $("#input_id").removeAttr("disabled");
            showButtonLoading("regist");
            $("#regist_form").submit();
        } else {
            $("#regist_message_area").text("入力内容にエラーがあります。修正してください。");
        }
    });
});
