$(document).ready(function() {
	// --- 要素のキャッシュ ---
	const outputForm = $("#output_form");
	const outputButton = $('#output');
	const messageArea = $("#message_area");
	const radioToggleButtons = $('input[name="tbody_toggle"]'); // "一般" / "管理者" ラジオボタン

	const noAdminTbody = $('#no_admin');
	const adminTbody = $('#admin');

	const checkboxClass = '.selection-days-checkbox-1';
	const employeeIdList = 'employeeIdList';
	const checkAllCheckbox = $('#check-all');

	// --- tbody 切り替え機能 ---
	function setActiveTbody() {
		const selectedValue = $('input[name="tbody_toggle"]:checked').val();
		messageArea.text("");
		// 動的に追加されるID入力もクリア
		outputForm.find(`input[name="${employeeIdList}"]`).remove();
		checkAllCheckbox.prop('checked', false);

		if (selectedValue === 'no_admin') {
			noAdminTbody.show();
			adminTbody.hide();
			adminTbody.find(checkboxClass).prop('checked', false);
		} else if (selectedValue === 'admin') {
			adminTbody.show();
			noAdminTbody.hide();
			noAdminTbody.find(checkboxClass).prop('checked', false);
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

		const activeTbodyValue = $('input[name="tbody_toggle"]:checked').val();
		let $activeTbody;

		if (activeTbodyValue === 'no_admin') {
			$activeTbody = noAdminTbody;
		} else if (activeTbodyValue === 'admin') {
			$activeTbody = adminTbody;
		} else {
			messageArea.text("表示モードが選択されていません。");
			return;
		}

		const $checkedCheckboxes = $activeTbody.find(checkboxClass + ':checked');
		const checkedCount = $checkedCheckboxes.length;

		if (checkedCount === 0) {
			messageArea.text("出力する従業員情報を1件以上選択してください。");
			return;
		}

		// 選択された各IDに対してhidden inputを生成してフォームに追加
		$checkedCheckboxes.each(function() {
			const idValue = $(this).closest('tr').find('.id').text();
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

		$activeTbody.find(checkboxClass).prop('checked', false);
		document.querySelector('#check-all').checked = false;
		outputForm.find(`input[name="${employeeIdList}"]`).remove();
	});
});

// チェックボックスのトグル関数 (アクティブなtbodyのみ対象)
function toggleAll(checkbox) {
    const isChecked = $(checkbox).prop('checked');
    const activeTbodyValue = $('input[name="tbody_toggle"]:checked').val();
    let $activeTbody;

    if (activeTbodyValue === 'no_admin') {
        $activeTbody = $('#no_admin');
    } else if (activeTbodyValue === 'admin') {
        $activeTbody = $('#admin');
    } else {
        return;
    }
    $activeTbody.find('.selection-days-checkbox-1').prop('checked', isChecked);
}