// DataTables変数をグローバルに定義
let employeeListTable;

$(function () {
    // DataTablesを初期化
    initializeDataTable();
    
    // ラジオボタン変更イベント
    $('input[name="tbody_toggle"]').on("change", function () {
        const selectedValue = $(this).val();
        if (employeeListTable) {
            const userType = selectedValue === 'admin' ? 'admin' : 'general';
            employeeListTable.ajax.url('/employeelist/data?userType=' + userType).load();
        }
    });
});

// DataTables初期化関数
function initializeDataTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#employee-list-table')) {
        $('#employee-list-table').DataTable().destroy();
    }

    // CSRFトークンを取得
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    employeeListTable = $('#employee-list-table').DataTable({
        "serverSide": false,
        "responsive": {
            "details": {
                "type": 'column',
                "target": 'tr'
            }
        },
        "ajax": {
            "url": "/employeelist/data?userType=general",
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
                "title": "ID",
                "responsivePriority": 1
            },
            {
                "data": "fullName",
                "title": "氏名",
                "responsivePriority": 2
            },
            {
                "data": "email",
                "title": "メールアドレス",
                "responsivePriority": 3
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json"
        },
        "pageLength": 10,
        "lengthMenu": [[5, 10, 25, 50], [5, 10, 25, 50]],
        "dom": "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
               "<'row'<'col-sm-12'tr>>" +
               "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        "ordering": true,
        "order": [[0, 'asc']],
        "columnDefs": [
            {
                "targets": [0],
                "className": "text-center"
            }
        ]
    });
}
