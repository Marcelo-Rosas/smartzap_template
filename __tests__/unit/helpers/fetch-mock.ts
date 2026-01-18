import type { Mock } from 'vitest'

export const createFetchResponse = (
  data: unknown,
  init: ResponseInit = {}
): Response => {
  const body = data === undefined ? null : JSON.stringify(data)
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

export const mockFetchJsonOnce = (
  fetchMock: Mock,
  data: unknown,
  init: ResponseInit = {}
): void => {
  fetchMock.mockResolvedValueOnce(createFetchResponse(data, init))
}

export const mockFetchOnce = (fetchMock: Mock, init: ResponseInit = {}): void => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 200, ...init }))
}
