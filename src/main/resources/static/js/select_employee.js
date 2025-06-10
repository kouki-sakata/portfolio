//従業員氏名クリック時のsubmit
$('.td_link').click(function() {
	//クリックした従業員行のIDを取得してformにセット
	let tr_id = $(this).closest('tr').find('.id').text();
	$("#employee_id").val(tr_id);
	$("#stamp_edit_form").submit();
});
