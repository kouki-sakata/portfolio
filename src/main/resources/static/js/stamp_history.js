// DataTables変数をグローバルに定義
let logHistoryTable;

// 初期処理
$(function () {
    // DataTablesを初期化
    initializeDataTable();

    // 年変更イベント
    $('#select_year').change(function() {
        reloadDataTable();
    });

    // 月変更イベント
    $('#select_month').change(function() {
        reloadDataTable();
    });
});

// DataTables初期化関数
function initializeDataTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#log-history-table')) {
        $('#log-history-table').DataTable().destroy();
    }

    // CSRFトークンを取得
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');
    
    // 初期の年月を取得
    const currentYear = $('#select_year').val() || new Date().getFullYear();
    const currentMonth = $('#select_month').val() || String(new Date().getMonth() + 1).padStart(2, '0');

    logHistoryTable = $('#log-history-table').DataTable({
        "serverSide": false,
        "responsive": true,
        "ajax": {
            "url": `/loghistory/data?year=${currentYear}&month=${currentMonth}`,
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
                "data": "index",
                "title": "#"
            },
            {
                "data": "update_date",
                "title": "更新日時"
            },
            {
                "data": "employee_name",
                "title": "従業員氏名"
            },
            {
                "data": "display_name",
                "title": "画面名"
            },
            {
                "data": "operation_type",
                "title": "操作種別"
            },
            {
                "data": "stamp_time",
                "title": "打刻時刻"
            },
            {
                "data": "update_employee_name",
                "title": "更新者氏名"
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json"
        }
    });
}

// DataTablesをリロードする関数
function reloadDataTable() {
    if (logHistoryTable) {
        const selectedYear = $('#select_year').val();
        const selectedMonth = $('#select_month').val();
        logHistoryTable.ajax.url(`/loghistory/data?year=${selectedYear}&month=${selectedMonth}`).load();
    }
}
