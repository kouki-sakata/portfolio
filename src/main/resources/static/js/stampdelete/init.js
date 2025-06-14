// 開始月と終了月のバリデーションチェック
$(document).ready(function () {
        // フォーム送信時の処理
        $('#stampDeleteForm').on('submit', function () {
            // 開始日が終了日より後の場合はエラー（バックエンドでもチェックしているが、二重チェック）
            const startYear = $('#startYear').val();
            const startMonth = $('#startMonth').val();
            const endYear = $('#endYear').val();
            const endMonth = $('#endMonth').val();

            const startDate = new Date(startYear, parseInt(startMonth) - 1);
            const endDate = new Date(endYear, parseInt(endMonth) - 1);

            if (startDate > endDate) {
                alert('開始年月が終了年月より後の日付になっています。正しい期間を選択してください。');
                return false;
            }

            // 削除確認
            return confirm('選択した期間の打刻記録を削除します。この操作は元に戻せません。よろしいですか？');
        });
    });
