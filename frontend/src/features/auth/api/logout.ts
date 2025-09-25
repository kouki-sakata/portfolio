import { httpClient } from '@/shared/api/httpClient'

export const logout = async () => {
  await httpClient<undefined>('/auth/logout', {
    method: 'POST',
    parseJson: false,
  })
}
