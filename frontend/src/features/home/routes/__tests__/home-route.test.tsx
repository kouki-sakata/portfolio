import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HomeRoute } from '@/features/home/routes/HomeRoute'

describe('HomeRoute', () => {
  it('renders call to action', () => {
    render(<HomeRoute />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '勤怠とお知らせ管理をもっとスマートに',
      }),
    ).toBeInTheDocument()
  })
})
