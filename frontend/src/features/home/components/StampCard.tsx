import { memo,useState } from 'react'

/**
 * StampCardのProps
 * Interface Segregation: 必要最小限のプロパティ
 */
export interface StampCardProps {
  onStamp: (type: '1' | '2', nightWork: boolean) => Promise<void>
  isLoading?: boolean
  message?: string | null
}

/**
 * StampCardプレゼンテーション コンポーネント
 * Single Responsibility: 打刻UIの表示のみを担当
 * Dependency Inversion: onStampコールバックに依存
 */
export const StampCard = memo(({
  onStamp,
  isLoading = false,
  message = null
}: StampCardProps) => {
  const [nightWork, setNightWork] = useState(false)

  const handleStamp = async (type: '1' | '2') => {
    await onStamp(type, nightWork)
  }

  return (
    <article className="home-card">
      <header className="home-card__header">
        <h2 className="home-card__title">ワンクリック打刻</h2>
        <label className="home-card__nightwork">
          <input
            type="checkbox"
            checked={nightWork}
            onChange={(event) => { setNightWork(event.target.checked); }}
            disabled={isLoading}
          />
          夜勤扱い
        </label>
      </header>

      <div className="home-card__actions">
        <button
          type="button"
          className="button"
          onClick={() => void handleStamp('1')}
          disabled={isLoading}
        >
          出勤打刻
        </button>
        <button
          type="button"
          className="button"
          onClick={() => void handleStamp('2')}
          disabled={isLoading}
        >
          退勤打刻
        </button>
      </div>

      {message && (
        <p className="home-card__result">{message}</p>
      )}
    </article>
  )
})

StampCard.displayName = 'StampCard'