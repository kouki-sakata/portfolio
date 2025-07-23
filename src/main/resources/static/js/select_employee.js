// DataTables変数をグローバルに定義
let selectEmployeeTable;

$(function () {
    // DataTablesを初期化
    initializeDataTable();
    
    // ラジオボタン変更イベント
    $('input[name="tbody_toggle"]').on("change", function () {
        const selectedValue = $(this).val();
        if (selectEmployeeTable) {
            const userType = selectedValue === 'admin' ? 'admin' : 'general';
            selectEmployeeTable.ajax.url('/stampedit/data?userType=' + userType).load();
        }
    });
});

// DataTables初期化関数
function initializeDataTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#select-employee-table')) {
        $('#select-employee-table').DataTable().destroy();
    }

    // CSRFトークンを取得
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    selectEmployeeTable = $('#select-employee-table').DataTable({
        "serverSide": false,
        "responsive": true,
        "ajax": {
            "url": "/stampedit/data?userType=general",
            "type": "POST",
            "contentType": "application/json",
            "beforeSend": function(xhr) {
                if (csrfHeader && csrfToken) {
                    xhr.setRequestHeader(csrfHeader, csrfToken);
                }
            },
            "data": function(d) {
                return JSON.stringify(d);
            },
            "error": function(xhr, error, code) {
                console.error('DataTables AJAX error:', error);
                alert('データの取得に失敗しました。');
            }
        },
        "columns": [
            {
                "data": "id",
                "title": "ID"
            },
            {
                "data": "fullName",
                "title": "氏名",
                "render": function(data, type, row) {
                    return '<span class="td_link" style="cursor: pointer; color: blue; text-decoration: underline;">' + data + '</span>';
                }
            },
            {
                "data": "email",
                "title": "メールアドレス"
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json"
        }
    });

    // 行クリック時のイベントハンドラー（DataTables用に修正）
    $('#select-employee-table tbody').on('click', '.td_link', function () {
        const tr = $(this).closest('tr');
        const rowData = selectEmployeeTable.row(tr).data();
        if (rowData) {
            $("#employee_id").val(rowData.id);
            $("#stamp_edit_form").submit();
        }
    });
}
