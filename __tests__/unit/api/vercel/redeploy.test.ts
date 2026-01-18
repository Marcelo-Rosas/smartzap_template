import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../../../app/api/vercel/redeploy/route'
import { mockFetchOnce } from '../../helpers/fetch-mock'

const ORIGINAL_ENV = { ...process.env }

describe('POST /api/vercel/redeploy', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.clearAllMocks()
  })

  it('returns instructions when deploy hook is missing', async () => {
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.instructions).toHaveLength(3)
  })

  it('triggers redeploy when hook responds ok', async () => {
    process.env = { ...ORIGINAL_ENV, VERCEL_DEPLOY_HOOK_URL: 'https://hook' }
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchOnce(fetchMock)

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('https://hook', { method: 'POST' })
  })

  it('handles failed redeploy response', async () => {
    process.env = { ...ORIGINAL_ENV, VERCEL_DEPLOY_HOOK_URL: 'https://hook' }
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchOnce(fetchMock, { status: 500 })

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })

  it('handles fetch errors', async () => {
    process.env = { ...ORIGINAL_ENV, VERCEL_DEPLOY_HOOK_URL: 'https://hook' }
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    fetchMock.mockRejectedValueOnce(new Error('network'))

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.message).toBe('network')
  })
})
