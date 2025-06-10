/**
 * 2024/03/21 n.yasunari 新規作成
 */
//一般/管理者のトグルボタン変更
$("input[name='tbody_toggle']").change(function(){
    let selectedTbody = $(this).val();
    $("tbody").hide(); // すべてのtbodyを非表示にする
    $("#" + selectedTbody).show(); // 選択されたtbodyを表示する
});
