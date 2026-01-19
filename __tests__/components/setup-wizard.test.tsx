/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import WizardPage from '@/app/(auth)/setup/wizard/page'
import { renderWithProviders } from './utils/render-with-providers'
import { setupWizardFixture } from './fixtures/setup-data'

const { mockRouterPush, getSearchParams, setSearchParams } = vi.hoisted(() => {
  let searchParams = new URLSearchParams()
  return {
    mockRouterPush: vi.fn(),
    getSearchParams: () => searchParams,
    setSearchParams: (params: URLSearchParams) => {
      searchParams = params
    },
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => getSearchParams(),
}))

describe('Setup Wizard', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    mockRouterPush.mockReset()
    setSearchParams(new URLSearchParams())
    localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('inicializa com dados do localStorage', async () => {
    localStorage.setItem('setup_token', 'token-123')
    localStorage.setItem('setup_project', JSON.stringify({ id: 'proj-1', name: 'Projeto' }))
    localStorage.setItem('smartzap_setup_step', '3')
    localStorage.setItem(
      'smartzap_setup_data',
      JSON.stringify({ redisUrl: setupWizardFixture.redisUrl })
    )

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ envs: [] }),
    })

    renderWithProviders(<WizardPage />)

    expect(await screen.findByRole('heading', { name: 'Upstash Redis & QStash' })).toBeInTheDocument()
    expect(screen.getByDisplayValue(setupWizardFixture.redisUrl)).toBeInTheDocument()
  })

  it('avança para o passo indicado quando resume=true', async () => {
    setSearchParams(new URLSearchParams('resume=true'))

    fetchMock.mockResolvedValueOnce({
      json: async () => ({ nextStep: 4 }),
    })

    renderWithProviders(<WizardPage />)

    expect(await screen.findByRole('heading', { name: 'WhatsApp Cloud API' })).toBeInTheDocument()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('preenche campos automaticamente via /api/setup/get-env', async () => {
    localStorage.setItem('setup_token', 'token-123')
    localStorage.setItem('setup_project', JSON.stringify({ id: 'proj-2', name: 'Projeto 2' }))
    localStorage.setItem('smartzap_setup_step', '2')

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        envs: [
          { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://env.supabase.co' },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'anon-from-env' },
        ],
      }),
    })

    renderWithProviders(<WizardPage />)

    expect(await screen.findByRole('heading', { name: 'Supabase Database' })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('https://env.supabase.co')).toBeInTheDocument()
    expect(screen.getByDisplayValue('anon-from-env')).toBeInTheDocument()
  })
})
