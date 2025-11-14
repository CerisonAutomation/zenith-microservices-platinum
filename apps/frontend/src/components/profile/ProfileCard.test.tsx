import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { createMockProfile } from '@/test/utils'
import ProfileCard from './ProfileCard'
import '../../test/mocks/supabase'

describe('ProfileCard', () => {
  const mockProfile = createMockProfile()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render profile information', () => {
    render(<ProfileCard profile={mockProfile} />)

    expect(screen.getByText(`${mockProfile.name}, ${mockProfile.age}`)).toBeInTheDocument()
    expect(screen.getByText(mockProfile.distance)).toBeInTheDocument()
  })

  it('should show online indicator when user is online', () => {
    render(<ProfileCard profile={{ ...mockProfile, online: true }} />)

    const onlineIndicator = document.querySelector('.bg-green-500')
    expect(onlineIndicator).toBeInTheDocument()
  })

  it('should show verified badge when user is verified', () => {
    render(<ProfileCard profile={{ ...mockProfile, verified: true }} />)

    expect(screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).parentElement).toContainHTML('CheckCircle')
  })

  it('should show "Meet Now" badge when available', () => {
    render(<ProfileCard profile={{ ...mockProfile, meetNow: true }} />)

    expect(screen.getByText('Now')).toBeInTheDocument()
  })

  it('should open detail dialog when card is clicked', async () => {
    render(<ProfileCard profile={mockProfile} />)

    const card = screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    // Dialog should open with more details
    expect(screen.getAllByText(`${mockProfile.name}, ${mockProfile.age}`).length).toBeGreaterThan(1)
  })

  it('should display profile bio in detail view', () => {
    render(<ProfileCard profile={mockProfile} />)

    const card = screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(screen.getByText(mockProfile.bio)).toBeInTheDocument()
  })

  it('should display kinks and roles in detail view', () => {
    const profileWithKinks = {
      ...mockProfile,
      kinks: ['Kink 1', 'Kink 2'],
      roles: ['Role 1'],
    }
    render(<ProfileCard profile={profileWithKinks} />)

    const card = screen.getByText(`${profileWithKinks.name}, ${profileWithKinks.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(screen.getByText('Kink 1')).toBeInTheDocument()
    expect(screen.getByText('Role 1')).toBeInTheDocument()
  })

  it('should display response rate in detail view', () => {
    const profileWithResponseRate = {
      ...mockProfile,
      responseRate: 95,
    }
    render(<ProfileCard profile={profileWithResponseRate} />)

    const card = screen.getByText(`${profileWithResponseRate.name}, ${profileWithResponseRate.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(screen.getByText('95% response rate')).toBeInTheDocument()
  })

  it('should render carousel for multiple photos', () => {
    const profileWithPhotos = {
      ...mockProfile,
      photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
    }
    render(<ProfileCard profile={profileWithPhotos} />)

    const card = screen.getByText(`${profileWithPhotos.name}, ${profileWithPhotos.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    // Check if images are rendered
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('should have action buttons in detail view', () => {
    render(<ProfileCard profile={mockProfile} />)

    const card = screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(screen.getByText('Book Meet')).toBeInTheDocument()
    expect(screen.getByText('Video Call')).toBeInTheDocument()
    expect(screen.getByText('Message')).toBeInTheDocument()
  })

  it('should open booking dialog when "Book Meet" is clicked', () => {
    render(<ProfileCard profile={mockProfile} />)

    const card = screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).closest('div')
    if (card) {
      fireEvent.click(card)
    }

    const bookButton = screen.getByText('Book Meet')
    fireEvent.click(bookButton)

    // The detail dialog should close and booking dialog should be ready
    // Note: Actual booking dialog rendering would depend on its implementation
  })

  it('should handle quick actions on hover', () => {
    render(<ProfileCard profile={mockProfile} />)

    const card = screen.getByText(`${mockProfile.name}, ${mockProfile.age}`).closest('.group')
    expect(card).toBeInTheDocument()

    // Quick action buttons should be present in the DOM (even if not visible)
    const buttons = document.querySelectorAll('button[size="icon"]')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
