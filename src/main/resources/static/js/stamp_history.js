// DataTables変数をグローバルに定義
let logHistoryTable;
// 共通ローディング処理を初期化
const datatableLoading = createDataTablesLoading();

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

    // DataTables設定を作成
    let logHistoryTableConfig = {
        "serverSide": false,
        "responsive": {
            "details": {
                "type": 'column',
                "target": 'tr'
            }
        },
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
                "title": "#",
                "width": "50px",
                "responsivePriority": 1
            },
            {
                "data": "update_date",
                "title": "更新日時",
                "width": "150px",
                "responsivePriority": 2
            },
            {
                "data": "employee_name",
                "title": "従業員氏名",
                "width": "150px",
                "responsivePriority": 3
            },
            {
                "data": "display_name",
                "title": "画面名",
                "width": "120px",
                "responsivePriority": 6
            },
            {
                "data": "operation_type",
                "title": "操作種別",
                "width": "100px",
                "responsivePriority": 4
            },
            {
                "data": "stamp_time",
                "title": "打刻時刻",
                "width": "120px",
                "responsivePriority": 5
            },
            {
                "data": "update_employee_name",
                "title": "更新者氏名",
                "width": "150px",
                "responsivePriority": 7
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
    };
    
    // 共通スケルトンローディング処理を適用
    logHistoryTableConfig = datatableLoading.applySkeletonLoadingToConfig(logHistoryTableConfig, 'log-history-table');
    
    // DataTablesを初期化
    logHistoryTable = $('#log-history-table').DataTable(logHistoryTableConfig);
}

// DataTablesをリロードする関数
function reloadDataTable() {
    if (logHistoryTable) {
        const selectedYear = $('#select_year').val();
        const selectedMonth = $('#select_month').val();
        logHistoryTable.ajax.url(`/loghistory/data?year=${selectedYear}&month=${selectedMonth}`).load();
    }
}
