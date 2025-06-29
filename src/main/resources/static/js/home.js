// 現在日時を取得してリアルタイム表示
setInterval(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = now.getDay();
  const dayWeek = new Array('日', '月', '火', '水', '木', '金', '土');
  document.querySelector('#curdate').textContent = year + '年' + month + '月' + date + '日(' + dayWeek[day] + ')';

  const hours = zerofill(now.getHours());
  const minutes = zerofill(now.getMinutes());
  const seconds = zerofill(now.getSeconds());
  document.querySelector('#curtime').textContent = hours + ':' + minutes + ':' + seconds;
}, 100);

// ゼロ埋め処理
const zerofill = (value) => {
	if (value < 10) {
		value = '0' + value;
	}
	return value;
}

//出勤ボタンsubmit
$('#in_button').on('click', function() {
	setNightWorkFlag();
	$("#stampTime").val(formatDateTime());
	$("#stampType").val("1");
	$("#home_form").submit();
});
//退勤ボタンsubmit
$('#out_button').on('click', function() {
	setNightWorkFlag();
	$("#stampTime").val(formatDateTime());
	$("#stampType").val("2");
	$("#home_form").submit();
});

//打刻時刻生成
//形式：yyyy-MM-ddTHH:mm:ss
function formatDateTime(){
	//yyyy年MM月dd日(X)→yyyy-MM-dd
	let curdate = $("#curdate").text();
	// Dateオブジェクトを生成
	let dateObj = new Date(curdate.replace(/年|月|日/g, '/'));
	// yyyy-MM-dd形式に変換
	let formattedDate = dateObj.getFullYear() + '-'
		+ ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' 
		+ ('0' + dateObj.getDate()).slice(-2);
	let curtime = $("#curtime").text();
	 return formattedDate +"T"+ curtime;
}
//夜勤ボタンの値設定
function setNightWorkFlag(){
	if($('#switch').prop("checked") == true){
		$('#nightWorkFlag').val("1");
	}else{
		$('#nightWorkFlag').val("0");
	}
}

// メッセージの自動消去
$(document).ready(function() {
    $('.alert').delay(3000).fadeOut('slow', function() {
        $(this).remove();
    });
});
