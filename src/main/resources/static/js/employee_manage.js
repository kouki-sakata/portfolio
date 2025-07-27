// 共通ローディング処理を初期化（依存関係の確認付き）
let datatableLoading;

$(document).ready(function () {
    // DataTablesローディングライブラリが利用可能になるまで待機
    function initializeWhenReady() {
        if (typeof window.createDataTablesLoading === 'function') {
            datatableLoading = createDataTablesLoading();
            initializeEmployeeTable();
        } else {
            console.log('Waiting for DataTables loading library...');
            setTimeout(initializeWhenReady, 100);
        }
    }
    initializeWhenReady();
});

function initializeEmployeeTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#employee-table')) {
        $('#employee-table').DataTable().destroy();
    }

    // DataTablesの設定
    let employeeTableConfig = {
        "processing": false,
        "serverSide": true,
        "ajax": {
            "url": "/employeemanage/data",
            "type": "POST",
            "contentType": "application/json",
            "beforeSend": function(xhr) {
                const csrfToken = $('meta[name="_csrf"]').attr('content');
                const csrfHeader = $('meta[name="_csrf_header"]').attr('content');
                if (csrfHeader && csrfToken) {
                    xhr.setRequestHeader(csrfHeader, csrfToken);
                }
            },
            "data": function (d) {
                return JSON.stringify(d);
            },
            "dataSrc": function(json) {
                return json.data || [];
            },
            "error": function(xhr, error, code) {
                console.error('DataTables AJAX error:', error);
                console.error('XHR status:', xhr.status);
                console.error('XHR response:', xhr.responseText);
                alert('データの取得に失敗しました。');
            }
        },
        "columns": [
            {
                "data": null,
                "width": "60px",
                "responsivePriority": 1,
                "render": function (data, type, row) {
                    return `<input type="checkbox" class="delete_check form-check-input checkbox-large" value="${row.id}">`;
                },
                "orderable": false
            },
            {
                "data": "id",
                "width": "80px",
                "responsivePriority": 2
            },
            {
                "data": "first_name",
                "width": "120px",
                "responsivePriority": 3
            },
            {
                "data": "last_name",
                "width": "120px",
                "responsivePriority": 4
            },
            {
                "data": "email",
                "width": "250px",
                "responsivePriority": 5
            },
            {
                "data": "password",
                "width": "150px",
                "responsivePriority": 8
            },
            {
                "data": "admin_flag",
                "width": "80px",
                "responsivePriority": 6,
                "render": function (data, type, row) {
                    return `<input class="admin_flag form-check-input checkbox-large" disabled="disabled" type="checkbox" ${data == 1 ? 'checked' : ''}>`;
                },
                "orderable": true
            },
            {
                "data": null,
                "width": "60px",
                "responsivePriority": 7,
                "render": function (data, type, row) {
                    return '<i class="td_btn fa-solid fa-pencil"></i>';
                },
                "orderable": false
            }
        ],
        "language": {
            "emptyTable": "テーブルにデータがありません",
            "info": "_START_ から _END_ まで（全 _TOTAL_ 件）",
            "infoEmpty": "0 件中 0 から 0 まで表示",
            "infoFiltered": "（全 _MAX_ 件より抽出）",
            "lengthMenu": "_MENU_ 件表示",
            "loadingRecords": "読み込み中...",
            "processing": "処理中...",
            "search": "検索:",
            "zeroRecords": "一致するレコードがありません",
            "paginate": {
                "first": "最初",
                "last": "最後",
                "next": "次",
                "previous": "前"
            }
        },
        "pageLength": 10,
        "lengthMenu": [[5, 10, 25, 50], [5, 10, 25, 50]],
        "dom": "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        "ordering": true,
        "order": [[1, 'asc']],
        "columnDefs": [
            {
                "targets": [0, 1, 6, 7],
                "className": "text-center"
            }
        ],
        "drawCallback": function(settings) {
            // データ描画完了後にスケルトンを非表示
            if (datatableLoading && typeof datatableLoading.hideSkeletonLoadingWithDelay === 'function') {
                datatableLoading.hideSkeletonLoadingWithDelay('employee-table');
            }
        }
    };

    // 初回ロード時にスケルトンを表示
    datatableLoading.showSkeletonLoading('employee-table', employeeTableConfig.columns, employeeTableConfig.columnDefs);

    // DataTablesを初期化
    let employeeTable;
    try {
        employeeTable = $('#employee-table').DataTable(employeeTableConfig);
    } catch (error) {
        console.error('DataTables initialization failed:', error);
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
                showSuccessMessage("従業員情報を削除中です...", "delete_message_area");
                $("#delete_form").submit();
            }
        } else {
            showErrorMessage("削除する従業員情報を選択してください。", "delete_message_area");
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

    function hideButtonLoading(buttonId) {
        const button = $("#" + buttonId);
        button.prop("disabled", false);
        button.find(".button-text").removeClass("d-none");
        button.find(".spinner-border").addClass("d-none");
    }

    function showSuccessMessage(message, elementId = "regist_message_area") {
        $("#" + elementId).removeClass("text-danger").addClass("text-success").text(message);
        setTimeout(() => {
            $("#" + elementId).text("").removeClass("text-success");
        }, 5000);
    }

    function showErrorMessage(message, elementId = "regist_message_area") {
        $("#" + elementId).removeClass("text-success").addClass("text-danger").text(message);
    }

    $('#regist').on('click', function () {
        clearAllErrors();
        let isValidForm = true;
        if (!validateField("input_first_name", $("#input_first_name").val())) isValidForm = false;
        if (!validateField("input_last_name", $("#input_last_name").val())) isValidForm = false;
        if (!validateField("input_email", $("#input_email").val())) isValidForm = false;
        if (!validateField("input_password", $("#input_password").val())) isValidForm = false;

        if (isValidForm) {
            const isUpdate = $("#input_id").val() !== "";
            const actionText = isUpdate ? "更新" : "登録";

            if (confirm(`従業員情報を${actionText}します。よろしいですか？`)) {
                $("#admin_flag").val($("#input_admin").prop("checked") ? "1" : "0");
                $("#input_id").removeAttr("disabled");
                showButtonLoading("regist");

                // Show processing message
                showSuccessMessage(`従業員情報を${actionText}中です...`);

                // フォーム送信前にエラーメッセージをクリア
                $('.alert-danger').hide();

                $("#regist_form").submit();
            }
        } else {
            showErrorMessage("入力内容にエラーがあります。修正してください。");
        }
    });
}
