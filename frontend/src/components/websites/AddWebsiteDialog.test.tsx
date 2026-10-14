import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RefreshProvider } from '@/context/RefreshProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { AddWebsiteDialog } from './AddWebsiteDialog'

afterEach(() => vi.restoreAllMocks())

function setup(onClose = vi.fn()) {
  render(
    <ToastProvider>
      <RefreshProvider>
        <AddWebsiteDialog open onClose={onClose} />
      </RefreshProvider>
    </ToastProvider>,
  )
  return { user: userEvent.setup(), onClose }
}

describe('AddWebsiteDialog', () => {
  it('shows inline errors and does not call the API for invalid input', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Add website' }))
    expect(await screen.findByText('Enter a name for this website.')).toBeInTheDocument()
    expect(screen.getByText('Enter the website URL.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects non-http URLs and out-of-range intervals', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Name'), 'Docs')
    await user.type(screen.getByLabelText('URL'), 'ftp://example.com')
    await user.clear(screen.getByLabelText('Check interval (seconds)'))
    await user.type(screen.getByLabelText('Check interval (seconds)'), '5')
    await user.click(screen.getByRole('button', { name: 'Add website' }))
    expect(await screen.findByText('Enter a full URL starting with http:// or https://.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 15 seconds.')).toBeInTheDocument()
  })

  it('submits only the supported payload fields and closes on success', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).endsWith('/check')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 1, website_id: 5, is_up: true, status_code: 200, response_time_ms: 12, error_message: null, checked_at: '2026-10-13T10:00:00Z' })),
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ id: 5, name: 'Docs', url: 'https://example.com/', check_interval_seconds: 30, is_active: true, created_at: '2026-10-13T10:00:00Z' }), { status: 201 }),
      )
    })
    const { user, onClose } = setup()
    await user.type(screen.getByLabelText('Name'), 'Docs')
    await user.type(screen.getByLabelText('URL'), 'https://example.com')
    await user.clear(screen.getByLabelText('Check interval (seconds)'))
    await user.type(screen.getByLabelText('Check interval (seconds)'), '30')
    await user.click(screen.getByRole('button', { name: 'Add website' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/websites/')
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Docs', url: 'https://example.com', check_interval_seconds: 30 })
    await waitFor(() => expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/websites/5/check'))
  })

  it('surfaces backend validation errors on the field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: [{ loc: ['body', 'url'], msg: 'Input should be a valid URL' }] }), { status: 422 }),
    )
    const { user, onClose } = setup()
    await user.type(screen.getByLabelText('Name'), 'Docs')
    await user.type(screen.getByLabelText('URL'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: 'Add website' }))
    expect(await screen.findAllByText('Input should be a valid URL')).not.toHaveLength(0)
    expect(onClose).not.toHaveBeenCalled()
  })
})
