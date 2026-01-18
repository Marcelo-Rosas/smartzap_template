import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  findProjectByDomain,
  getEnvVars,
  getProject,
  upsertEnvVar,
} from '../../../lib/vercel-api'
import { mockFetchJsonOnce } from '../helpers/fetch-mock'

const token = 'token-123'

describe('vercel-api', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('findProjectByDomain uses domain API configured project when available', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, { configuredBy: 'proj_123' })
    mockFetchJsonOnce(fetchMock, { id: 'proj_123', name: 'my-app', accountId: 'acc' })

    const result = await findProjectByDomain(token, 'www.Example.com')

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('proj_123')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vercel.com/v6/domains/example.com/config',
      expect.any(Object)
    )
  })

  it('findProjectByDomain falls back to alias matching', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, {}, { status: 404 })
    mockFetchJsonOnce(fetchMock, {
      projects: [
        {
          id: 'proj_abc',
          name: 'smartzap',
          accountId: 'acc',
          alias: [{ domain: 'app.example.com' }],
        },
      ],
    })

    const result = await findProjectByDomain(token, 'app.example.com')

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('smartzap')
  })

  it('findProjectByDomain returns error when project list fails', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, {}, { status: 404 })
    mockFetchJsonOnce(fetchMock, {}, { status: 500 })

    const result = await findProjectByDomain(token, 'example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Erro ao buscar projetos')
  })

  it('getProject returns error when not found', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, {}, { status: 404 })

    const result = await getProject(token, 'proj_missing')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Projeto não encontrado')
  })

  it('getEnvVars returns env list', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, {
      envs: [{ key: 'FOO', value: 'bar', type: 'encrypted', target: ['production'] }],
    })

    const result = await getEnvVars(token, 'proj_1')

    expect(result.success).toBe(true)
    expect(result.data?.[0].key).toBe('FOO')
  })

  it('upsertEnvVar creates a new env var when missing', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, { envs: [] })
    mockFetchJsonOnce(fetchMock, {}, { status: 201 })

    const result = await upsertEnvVar(token, 'proj_1', { key: 'NEW', value: 'value' })

    expect(result.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vercel.com/v10/projects/proj_1/env',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('upsertEnvVar updates existing env var by id', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, { envs: [{ key: 'EXISTING' }] })
    mockFetchJsonOnce(fetchMock, { envs: [{ id: 'env_123', key: 'EXISTING' }] })
    mockFetchJsonOnce(fetchMock, {})

    const result = await upsertEnvVar(token, 'proj_1', { key: 'EXISTING', value: 'next' })

    expect(result.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vercel.com/v9/projects/proj_1/env/env_123',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('upsertEnvVar returns error when create fails', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    mockFetchJsonOnce(fetchMock, { envs: [] })
    mockFetchJsonOnce(fetchMock, { error: { message: 'nope' } }, { status: 400 })

    const result = await upsertEnvVar(token, 'proj_1', { key: 'FAIL', value: 'bad' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('nope')
  })
})
