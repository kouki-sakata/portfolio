/**
 * 2024/03/21 n.yasunari 新規作成
 */
// 初期表示時にイベントを発火
$(function () {
  // 公開チェックボックスの活性非活性設定
    updateCheckBoxes();
});
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
    let id = tr.find(".id").val();
    let date = tr.find(".date").text();
    let content = tr.find(".content").text();
    
    $("#input_id").val(id);
    $("#input_date").val(date.replace(/\//g, '-'));
    $("#input_content").val(content);
});
//公開チェックボックス変更
$('.release_flag').change(function() {
    $(this).addClass("value_change");
    updateCheckBoxes();
});
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