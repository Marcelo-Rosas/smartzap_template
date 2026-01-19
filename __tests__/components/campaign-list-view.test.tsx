/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CampaignListView } from '@/components/features/campaigns/CampaignListView'
import { CampaignStatus, type Campaign } from '@/types'
import type React from 'react'

const campaigns: Campaign[] = [
  {
    id: 'draft-1',
    name: 'Campanha Draft',
    status: CampaignStatus.DRAFT,
    recipients: 120,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    createdAt: '2024-01-10T12:00:00.000Z',
    templateName: 'Template Draft',
  },
  {
    id: 'sending-1',
    name: 'Campanha Enviando',
    status: CampaignStatus.SENDING,
    recipients: 200,
    sent: 150,
    delivered: 140,
    read: 50,
    failed: 2,
    createdAt: '2024-01-11T12:00:00.000Z',
    templateName: 'Template Sending',
  },
  {
    id: 'paused-1',
    name: 'Campanha Pausada',
    status: CampaignStatus.PAUSED,
    recipients: 80,
    sent: 40,
    delivered: 35,
    read: 20,
    failed: 1,
    createdAt: '2024-01-12T12:00:00.000Z',
    templateName: 'Template Paused',
  },
]

const setup = (overrides?: Partial<React.ComponentProps<typeof CampaignListView>>) => {
  const props: React.ComponentProps<typeof CampaignListView> = {
    campaigns,
    isLoading: false,
    filter: 'All',
    searchTerm: '',
    onFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    onRefresh: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onRowClick: vi.fn(),
    ...overrides,
  }

  const view = render(<CampaignListView {...props} />)

  return { ...view, props }
}

describe('CampaignListView CRUD actions', () => {
  it('dispara refresh, filtro e busca', () => {
    const { props } = setup()

    fireEvent.click(screen.getByTitle('Atualizar'))
    expect(props.onRefresh).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByPlaceholderText('Buscar campanhas...'), {
      target: { value: 'promo' },
    })
    expect(props.onSearchChange).toHaveBeenCalledWith('promo')

    fireEvent.change(screen.getByDisplayValue('Todos os Status'), {
      target: { value: CampaignStatus.DRAFT },
    })
    expect(props.onFilterChange).toHaveBeenCalledWith(CampaignStatus.DRAFT)
  })

  it('executa duplicar/excluir sem disparar clique da linha', () => {
    const { props } = setup()

    fireEvent.click(screen.getAllByTitle('Duplicar')[0])
    expect(props.onDuplicate).toHaveBeenCalledWith('draft-1')
    expect(props.onRowClick).not.toHaveBeenCalled()

    fireEvent.click(screen.getAllByTitle('Excluir')[0])
    expect(props.onDelete).toHaveBeenCalledWith('draft-1')
    expect(props.onRowClick).not.toHaveBeenCalled()
  })

  it('executa ações rápidas de iniciar, pausar e retomar', () => {
    const onStart = vi.fn()
    const onPause = vi.fn()
    const onResume = vi.fn()

    setup({ onStart, onPause, onResume })

    fireEvent.click(screen.getByTitle('Iniciar agora'))
    expect(onStart).toHaveBeenCalledWith('draft-1')

    fireEvent.click(screen.getByTitle('Pausar'))
    expect(onPause).toHaveBeenCalledWith('sending-1')

    fireEvent.click(screen.getByTitle('Retomar'))
    expect(onResume).toHaveBeenCalledWith('paused-1')
  })

  it('navega ao clicar na linha da campanha', () => {
    const { props } = setup()

    fireEvent.click(screen.getByText('Campanha Draft'))
    expect(props.onRowClick).toHaveBeenCalledWith('draft-1')
  })
})
