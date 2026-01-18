import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from '../../../../app/api/setup/migrate/route'
import { Client } from 'pg'
import { promises as fs } from 'fs'

type MockedClient = {
  connect: ReturnType<typeof vi.fn>
  query: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
}

vi.mock('pg', () => ({
  Client: vi.fn(),
}))

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}))

const makeRequest = (payload: Record<string, unknown>) =>
  ({
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as NextRequest

describe('POST /api/setup/migrate', () => {
  const clientMock: MockedClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  }

  beforeEach(() => {
    global.fetch = vi.fn()
    vi.mocked(Client).mockImplementation(() => clientMock as never)
    vi.mocked(fs.readFile).mockResolvedValue('SELECT 1;')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('validates missing connection string', async () => {
    const response = await POST(makeRequest({}))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Connection string is required')
  })

  it('returns table existence for check action', async () => {
    clientMock.query.mockResolvedValueOnce({ rows: [{ count: '2' }] })

    const response = await POST(
      makeRequest({ connectionString: 'postgres://', action: 'check' })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.exists).toBe(true)
    expect(body.count).toBe(2)
  })

  it('runs migrations for default action', async () => {
    const response = await POST(
      makeRequest({ connectionString: 'postgres://', action: 'migrate' })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(clientMock.query).toHaveBeenCalled()
  })

  it('returns helpful error for Supabase DNS issues', async () => {
    const error = new Error('fail') as Error & { code?: string; hostname?: string }
    error.code = 'ENOTFOUND'
    error.hostname = 'db.supabase.co'

    clientMock.connect.mockRejectedValueOnce(error)

    const response = await POST(
      makeRequest({ connectionString: 'postgres://', action: 'migrate' })
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('Connection Pooler')
  })
})
