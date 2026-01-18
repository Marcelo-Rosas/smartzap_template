import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../../../../app/api/setup/env-status/route'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('GET /api/setup/env-status', () => {
  it('reports missing environment variables', async () => {
    process.env = { ...ORIGINAL_ENV }

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status.masterPassword).toBe(false)
    expect(body.steps.password).toBe(false)
    expect(body.allConfigured).toBe(false)
    expect(body.hasVercelToken).toBe(false)
  })

  it('reports fully configured environment', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      MASTER_PASSWORD: 'secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://db.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      UPSTASH_REDIS_REST_URL: 'redis',
      UPSTASH_REDIS_REST_TOKEN: 'token',
      QSTASH_TOKEN: 'qstash',
      WHATSAPP_TOKEN: 'whatsapp',
      WHATSAPP_PHONE_ID: 'phone',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'biz',
      VERCEL_TOKEN: 'vercel',
    }

    const response = await GET()
    const body = await response.json()

    expect(body.steps).toEqual({
      password: true,
      database: true,
      redis: true,
      whatsapp: true,
    })
    expect(body.allConfigured).toBe(true)
    expect(body.hasVercelToken).toBe(true)
    expect(body.nextStep).toBe(5)
  })
})
