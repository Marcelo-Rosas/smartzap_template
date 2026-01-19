import { describe, expect, it, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/phone-numbers/route'

const errorMessage = '(#100) Tried accessing nonexisting field (phone_numbers) on node type (WhatsAppBusinessPhoneNumber)'

describe('POST /api/phone-numbers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna erro da API do Meta quando o campo phone_numbers é inválido', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: errorMessage,
        },
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const request = {
      json: async () => ({
        businessAccountId: 'business-id',
        accessToken: 'token',
      }),
    } as Request

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: errorMessage })
  })
})
