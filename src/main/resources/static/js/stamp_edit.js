// 初期処理
$(function () {
  $('.day_of_week').each(function(){
		if($(this).text() === '土'){
			// 土曜日の行は日付と曜日を青に変更
            $(this).closest('tr').find('.day, td.day_of_week').css('color', 'blue');
        } else if ($(this).text() === '日') {
			// 日曜日の行は日付と曜日を赤に変更
            $(this).closest('tr').find('.day, td.day_of_week').css('color', 'red');
        }
   });
});
//検索ボタンsubmit
$('#search').on('click', function() {
	$("#search_form").submit();
});
// input要素の値の変更時
$("input").on("blur", function() {
    // 入力された値が変更された場合
    if ($(this).val() !== $(this).attr("data-original-value")) {
        $(this).addClass("value_change");
        $(this).css("color", "red"); // 文字色を赤に変更
    }
});
// input要素のフォーカスが当たったときに、元の値を保存する
$("input").on("focus", function() {
    $(this).attr("data-original-value", $(this).val());
});
//戻るボタンsubmit
$('#back').on('click', function() {
	$("#back_form").submit();
});
//登録ボタンsubmit
//「変更なし」をチェックし、POSTしない追記
$('#regist').on('click', function(e) {
	//必須チェック
	// value_changeクラスを持つ要素の数を取得
    let elementCount = $('.value_change').length;
    // 要素が1つも存在しない場合はエラー
    if (elementCount === 0) {
        $("#message_area").text("変更箇所がありません。");
		e.preventDefault();
    }else{
		//必須チェックOKの場合は変更箇所のみname属性を設定してsubmitする
		let index = 0;
		$('.tbody_tr').each(function(){
		    let hasValueChangeClass = false;
		    $(this).find('*').each(function() {
		        // 子要素が「value_change」クラスを持っているかをチェックする
		        if ($(this).hasClass('value_change')) {
		            hasValueChangeClass = true;
		            // 「value_change」クラスを持っていれば、ループを抜ける
		            return false;
					$("#regist_form").submit();
		        }
		    });

		    // 「value_change」クラスを持っている場合のみ、子・孫要素のname属性を設定する
		    if (hasValueChangeClass) {
		        $(this).find('*').each(function() {
		            let currentName = $(this).attr('name');
		            if(currentName){
		                $(this).attr('name', 'stampEdit[' + index +']['+ currentName +']');
		            }
		        });
		        index++;
		    }else{
				//「value_change」クラスを持っていない場合はformに格納しない行なのでname属性を削除する
				$(this).find('*').each(function() {
		            $(this).removeAttr('name');
		        });
			}
		});
		$("#regist_form").submit();
	}
});
