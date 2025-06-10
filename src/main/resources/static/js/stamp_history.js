/**
 * 2024/03/21 n.yasunari 新規作成
 * 2025/5/12 s.tominaga カラー変更
 */
// 初期処理
$(function () {
  $('.day_of_week').each(function(){
		if($(this).text() === '土'){
			// 土曜日の行は日付と曜日を青に変更
			// 2025/5/12↓土曜日も赤色に変更
            $(this).closest('tr').find('.day, td.day_of_week').css('color', 'red');
        } else if ($(this).text() === '日') {
			// 日曜日の行は日付と曜日を赤に変更
            $(this).closest('tr').find('.day, td.day_of_week').css('color', 'red');
        }
   });
});
//年変更
$('#select_year').change(function() {
	$("#search_form").submit();
});
//月変更
$('#select_month').change(function() {
	$("#search_form").submit();
});