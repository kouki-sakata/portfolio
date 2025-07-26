// DataTables変数をグローバルに定義
let employeeOutputTable;
// 共通ローディング処理を初期化
const datatableLoading = createDataTablesLoading();

$(document).ready(function() {
	// --- 要素のキャッシュ ---
	const outputForm = $("#output_form");
	const outputButton = $('#output');
	const messageArea = $("#message_area");
	const radioToggleButtons = $('input[name="tbody_toggle"]'); // "一般" / "管理者" ラジオボタン

	const checkboxClass = '.selection-days-checkbox-1';
	const employeeIdList = 'employeeIdList';
	const checkAllCheckbox = $('#check-all');

	// DataTablesを初期化
	initializeDataTable();

	// --- tbody 切り替え機能 ---
	function setActiveTbody() {
		const selectedValue = $('input[name="tbody_toggle"]:checked').val();
		messageArea.text("");
		// 動的に追加されるID入力もクリア
		outputForm.find(`input[name="${employeeIdList}"]`).remove();
		checkAllCheckbox.prop('checked', false);

		// DataTablesをリロード
		if (employeeOutputTable) {
			const userType = selectedValue === 'admin' ? 'admin' : 'general';
			employeeOutputTable.ajax.url('/stampoutput/data?userType=' + userType).load();
		}
	}

	// 初期表示時のtbody制御
	setActiveTbody();

	// ラジオボタン変更イベント
	radioToggleButtons.change(function() {
		setActiveTbody();
	});

	// --- 出力ボタンクリック時の処理 ---
	outputButton.on('click', function(e) {
		e.preventDefault();
		messageArea.text("");

		// 既存の動的に追加されたID用hidden inputを削除 (再送信時の重複を防ぐため)
		outputForm.find(`input[type="hidden"][name="${employeeIdList}"]`).remove();

		const $checkedCheckboxes = $(checkboxClass + ':checked');
		const checkedCount = $checkedCheckboxes.length;

		if (checkedCount === 0) {
			messageArea.text("出力する従業員情報を1件以上選択してください。");
			return;
		}

		// 選択された各IDに対してhidden inputを生成してフォームに追加
		$checkedCheckboxes.each(function() {
			const idValue = $(this).closest('tr').find('.employee-id').text();
			if (idValue) {
				$('<input>').attr({
					type: 'hidden',
					name: employeeIdList,
					value: idValue
				}).appendTo(outputForm);
			}
		});

		// フォームを送信
		outputForm.submit();

		$(checkboxClass).prop('checked', false);
		document.querySelector('#check-all').checked = false;
		outputForm.find(`input[name="${employeeIdList}"]`).remove();
	});
});

// DataTables初期化関数
function initializeDataTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#employee-output-table')) {
        $('#employee-output-table').DataTable().destroy();
    }

    // CSRFトークンを取得
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    // DataTables設定を作成
    let employeeOutputTableConfig = {
        "serverSide": false,
        "responsive": {
            "details": {
                "type": 'column',
                "target": 'tr'
            }
        },
        "ajax": {
            "url": "/stampoutput/data?userType=general",
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
                "data": null,
                "width": "60px",
                "orderable": false,
                "searchable": false,
                "responsivePriority": 1,
                "render": function(data, type, row, meta) {
                    return `<input class="selection-days-checkbox-1 form-check-input checkbox-large" type="checkbox">`;
                }
            },
            {
                "data": "id",
                "title": "ID",
                "width": "80px",
                "responsivePriority": 2,
                "render": function(data, type, row, meta) {
                    return `<span class="employee-id">${data}</span>`;
                }
            },
            {
                "data": "fullName",
                "title": "氏名",
                "width": "200px",
                "responsivePriority": 3
            },
            {
                "data": "email",
                "title": "メールアドレス",
                "width": "300px",
                "responsivePriority": 4
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.7/i18n/ja.json"
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
                "targets": [0],
                "className": "text-center"
            },
            {
                "targets": [1],
                "className": "text-center"
            }
        ],
        "drawCallback": function(settings) {
            // DataTablesの描画後にイベントを再バインド
            bindToggleAllEvent();
        }
    };
    
    // 共通スケルトンローディング処理を適用
    employeeOutputTableConfig = datatableLoading.applySkeletonLoadingToConfig(employeeOutputTableConfig, 'employee-output-table');
    
    // DataTablesを初期化
    employeeOutputTable = $('#employee-output-table').DataTable(employeeOutputTableConfig);
}

// 全選択機能のイベントバインド
function bindToggleAllEvent() {
    $('#check-all').off('click').on('click', function() {
        const isChecked = $(this).prop('checked');
        $('.selection-days-checkbox-1').prop('checked', isChecked);
    });
}

// チェックボックスのトグル関数 (DataTables対応)
function toggleAll(checkbox) {
    const isChecked = $(checkbox).prop('checked');
    $('.selection-days-checkbox-1').prop('checked', isChecked);
}