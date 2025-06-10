/**
 * 2024/03/21 n.yasunari 新規作成
 */
$(function () {
	let targetNav = $('#target_nav').val();
	let targetNavButton = $('#target_nav').val() + '-button';
	$('#' + targetNav).removeClass('bg_white').removeClass('shadow');
	$('#' + targetNav).addClass('bg_red_info');
	$('#' + targetNavButton ).removeClass('mt-2');
	$('#' + targetNavButton ).addClass('bg_white').addClass('btn_shadow').addClass('active-menu');
	
});