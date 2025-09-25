import { httpClient } from '@/shared/api/httpClient'

interface StampRequest {
  stampType: string
  stampTime: string
  nightWorkFlag: string
}

interface StampResponse {
  message: string
}

export const submitStamp = async (payload: StampRequest) =>
  httpClient<StampResponse>('/home/stamps', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
