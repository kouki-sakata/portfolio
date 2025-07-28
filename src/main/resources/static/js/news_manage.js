// DataTables変数をグローバルに定義
let newsTable;
// 共通ローディング処理を初期化
const datatableLoading = createDataTablesLoading();

// 初期表示時にイベントを発火
$(function () {
    // DataTablesを初期化
    initializeDataTable();
    // 公開チェックボックスの活性非活性設定
    updateCheckBoxes();
});
// 重複したイベントバインディングを削除（bindEvents関数内で処理）
//登録ボタンsubmit
$('#regist').on('click', function() {
	//必須チェック
    let dateValue = $("#input_date").val();
    let contentValue = $("#input_content").val();

    if (dateValue.trim() === "") {
		$("#regist_message_area").text("日付を入力してください。");
        return;
    }
    if (contentValue.trim() === "") {
        $("#regist_message_area").text("メッセージを入力してください。");
        return;
    }
	//必須チェックOKの場合はsubmitする
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
	        $(this).val(trElement.find('.id').val());
	        // name属性をセット
	        $(this).attr("name", "idList[" + index + "]");
	    });
	    $("#delete_release_form").submit();
	} else {
	    $("#delete_release_message_area").text("削除するお知らせ情報を選択してください。");
	}
});
//公開ボタンsubmit
$('#release').click(function() {
	//必須チェック
	// value_changeクラスを持つ要素の数を取得
    let elementCount = $('.value_change').length;
    // 要素が1つも存在しない場合はエラー
    if (elementCount === 0) {
        $("#delete_release_message_area").text("変更箇所がありません。");
    } else {
		// 既存のname属性をクリア
		$('.submit_release_flag').removeAttr('name').val('');
		$('.id').removeAttr('name');
		
		//必須チェックOKの場合は変更箇所のみname属性を設定してsubmitする
		let index = 0;
		
		// DataTablesの全ての行を対象にする
		newsTable.rows().every(function(rowIdx, tableLoop, rowLoop) {
			let rowNode = this.node();
			let $row = $(rowNode);
			
			// 該当行でrelease_flagの変更があるかチェック
			let $releaseFlag = $row.find('.release_flag.value_change');
			if ($releaseFlag.length > 0) {
				console.log('Processing changed row:', index);
				
				// IDを取得
				let id = $row.find('.id').val();
				let isChecked = $releaseFlag.prop('checked');
				let submitValue = isChecked ? "true" : "false";
				
				console.log('ID:', id, 'Release Flag:', submitValue);
				
				// hiddenフィールドを動的に作成してフォームに追加
				let idInput = $('<input>').attr({
					type: 'hidden',
					name: 'editList[' + index + '][id]',
					value: id
				});
				
				let releaseFlagInput = $('<input>').attr({
					type: 'hidden',
					name: 'editList[' + index + '][releaseFlag]',
					value: submitValue
				});
				
				$('#delete_release_form').append(idInput).append(releaseFlagInput);
				index++;
			}
		});
		
		console.log('Total items to submit:', index);
		
		if (index === 0) {
			$("#delete_release_message_area").text("変更箇所がありません。");
			return;
		}
		
    	// フォームのアクションを変更
	    let newAction = "release";
	    $("#delete_release_form").attr("action", newAction);
	    $("#delete_release_form").submit();
	}
});
//公開フラグの数によってチェックボックスの活性非活性を変更
function updateCheckBoxes() {
    let checkedCount = $('.release_flag:checked').length;
    // 最大ON数が4未満の場合
    if (checkedCount < 4) {
        $('.release_flag:not(:checked)').prop('disabled', false);
    } else {
        // 最大ON数が4の場合、他のOFFチェックボックスを非活性化
        $('.release_flag:not(:checked)').prop('disabled', true);
    }
}
// お知らせ「内容」の文字数カウント
const inputContent = document.querySelector('#input_content');
const count = document.querySelector('#content_count');

inputContent.addEventListener('keyup', () => {
  count.textContent = inputContent.value.length;

  if (inputContent.value.length > 75){
    count.classList.add('text_red');
  } else {
    count.classList.remove('text_red');
  }
});

// DataTables初期化関数
function initializeDataTable() {
    // 既存のDataTablesインスタンスがあれば破棄
    if ($.fn.DataTable.isDataTable('#news-table')) {
        $('#news-table').DataTable().destroy();
    }

    // CSRFトークンを取得
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    // DataTables設定を作成
    let newsTableConfig = {
        "serverSide": false,
        "responsive": {
            "details": {
                "type": 'column',
                "target": 'tr'
            }
        },
        "ajax": {
            "url": "/newsmanage/data",
            "type": "POST",
            "contentType": "application/json",
            "beforeSend": function(xhr) {
                if (csrfHeader && csrfToken) {
                    xhr.setRequestHeader(csrfHeader, csrfToken);
                }
            },
            "data": function(d) {
                // クライアントサイドモード用の空のリクエスト
                return JSON.stringify({
                    draw: 1,
                    start: 0,
                    length: 1000  // 全件取得用
                });
            },
            "dataSrc": function(json) {
                // クライアントサイドモードではデータを直接返す
                return json.data || [];
            },
            "error": function(xhr, error, code) {
                console.error('DataTables AJAX error:', error);
                console.error('XHR status:', xhr.status);
                console.error('XHR response:', xhr.responseText);
                
                let errorMessage = 'データの取得に失敗しました。';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage += '\n詳細: ' + xhr.responseJSON.error;
                }
                alert(errorMessage);
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
                    return `
                        <input type="hidden" class="id" value="${row.id}"/>
                        <input type="hidden" class="submit_release_flag"/>
                        <input class="delete_check selection-days-checkbox-1 form-check-input checkbox-large" type="checkbox">
                    `;
                }
            },
            {
                "data": "news_date",
                "title": "日付",
                "width": "120px",
                "responsivePriority": 2,
                "render": function(data, type, row, meta) {
                    return `<span class="date">${data}</span>`;
                }
            },
            {
                "data": "content",
                "title": "内容",
                "width": "400px",
                "responsivePriority": 3,
                "render": function(data, type, row, meta) {
                    return `<span class="content">${data}</span>`;
                }
            },
            {
                "data": "release_flag",
                "title": "公開",
                "width": "80px",
                "orderable": true,
                "responsivePriority": 4,
                "render": function(data, type, row, meta) {
                    const checked = data ? 'checked' : '';
                    return `<input class="release_flag selection-days-checkbox-1 form-check-input checkbox-large" type="checkbox" ${checked}>`;
                }
            },
            {
                "data": null,
                "title": "編集",
                "width": "60px",
                "orderable": false,
                "searchable": false,
                "responsivePriority": 5,
                "render": function(data, type, row, meta) {
                    return '<i class="td_btn fa-solid fa-pencil"></i>';
                }
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
        "order": [[1, 'desc']],
        "columnDefs": [
            {
                "targets": [0, 3, 4],
                "className": "text-center"
            }
        ],
        "drawCallback": function(settings) {
            // DataTablesの描画後にイベントを再バインド
            bindEvents();
            updateCheckBoxes();
            
            // 各行にクラスを追加してJavaScriptでの行識別を改善
            $('#news-table tbody tr').each(function(index) {
                $(this).addClass('tbody_tr data-row-' + index);
            });
        }
    };

    // 共通スケルトンローディング処理を適用
    newsTableConfig = datatableLoading.applySkeletonLoadingToConfig(newsTableConfig, 'news-table');

    // DataTablesを初期化
    newsTable = $('#news-table').DataTable(newsTableConfig);
}

// イベントバインド関数
function bindEvents() {
    // 全選択チェックボックスのイベント
    $("#all").off('change').on('change', function() {
        let isChecked = $(this).prop("checked");
        $(".delete_check").prop("checked", isChecked);
    });

    // 編集ボタンクリックイベント
    $(".td_btn").off('click').on('click', function() {
        let tr = $(this).closest("tr");
        let id = tr.find(".id").val();
        let date = tr.find(".date").text();
        let content = tr.find(".content").text();

        $("#input_id").val(id);
        $("#input_date").val(date.replace(/\//g, '-'));
        $("#input_content").val(content);
    });

    // 公開チェックボックス変更イベント
    $('.release_flag').off('change').on('change', function() {
        $(this).addClass("value_change");
        console.log('Release flag changed for ID:', $(this).closest('tr').find('.id').val());
        console.log('New value:', $(this).prop('checked'));
        updateCheckBoxes();
    });
}
