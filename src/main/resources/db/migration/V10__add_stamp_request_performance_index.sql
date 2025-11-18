-- V10: Add performance index for stamp_request LATERAL JOIN queries
-- 勤怠履歴取得時の申請ステータス取得クエリを最適化

-- パフォーマンス最適化のための複合インデックス追加
-- このインデックスは以下のクエリパターンを最適化します:
-- WHERE employee_id = ? AND stamp_date = ? ORDER BY created_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_stamp_request_employee_date_created
ON stamp_request(employee_id, stamp_date, created_at DESC);

-- インデックスの説明コメント
COMMENT ON INDEX idx_stamp_request_employee_date_created IS
'勤怠履歴取得時のLATERAL JOINを最適化。employee_id + stamp_date でフィルタリングし、created_at DESC でソートするクエリに対応（StampHistoryMapper.xml）';
