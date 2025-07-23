// DataTables変数をグローバルに定義
let newsTable;

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
    }else{
		//必須チェックOKの場合は変更箇所のみname属性を設定してsubmitする
		let index = 0;
		$('.tbody_tr').each(function() {
	        // tbody_tr内のrelease_flagクラスを持つ要素で、value_changeクラスがある場合
	        $(this).find('.release_flag.value_change').each(function() {
	            // 変更行の.submit_release_flagにname属性と値を設定
		        $(this).closest('tr').find('.submit_release_flag').attr('name', 'editList[' + index +'][releaseFlag]');
		        let isChecked = $(this).prop('checked');
			    let submitValue = isChecked ? "true" : "false";
			    $(this).closest('tr').find('.submit_release_flag').val(submitValue);
		        // 変更行の.idにname属性を設定
		        $(this).closest('tr').find('.id').attr('name', 'editList[' + index +'][id]');
		        index++;
	        });
    	});
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

    newsTable = $('#news-table').DataTable({
        "serverSide": false,
        "responsive": true,
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
                "orderable": false,
                "searchable": false,
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
                "render": function(data, type, row, meta) {
                    return `<span class="date">${data}</span>`;
                }
            },
            {
                "data": "content",
                "title": "内容",
                "render": function(data, type, row, meta) {
                    return `<span class="content">${data}</span>`;
                }
            },
            {
                "data": "release_flag",
                "title": "公開",
                "orderable": false,
                "render": function(data, type, row, meta) {
                    const checked = data ? 'checked' : '';
                    return `<input class="release_flag selection-days-checkbox-1 form-check-input checkbox-large" type="checkbox" ${checked}>`;
                }
            },
            {
                "data": null,
                "title": "編集",
                "orderable": false,
                "searchable": false,
                "render": function(data, type, row, meta) {
                    return '<i class="td_btn fa-solid fa-pencil"></i>';
                }
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json"
        },
        "drawCallback": function(settings) {
            // DataTablesの描画後にイベントを再バインド
            bindEvents();
            updateCheckBoxes();
        }
    });
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
        updateCheckBoxes();
    });
}
