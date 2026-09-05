import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileOffersTab from '@/components/profile/ProfileOffersTab';

// Wrapper component for routing context
const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('ProfileOffersTab', () => {
  it('renders loading state', () => {
    renderWithRouter(<ProfileOffersTab loading={true} offers={[]} />);

    // Should show loading spinner (Loader2 component)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no offers', () => {
    renderWithRouter(<ProfileOffersTab loading={false} offers={[]} />);

    expect(screen.getByText('No offers sent yet')).toBeInTheDocument();
    expect(screen.getByText('Browse Events')).toBeInTheDocument();
  });

  it('renders offers list', () => {
    const mockOffers = [
      {
        id: '1',
        status: 'pending',
        created_at: '2026-01-09T12:00:00Z',
        requester_context: 'I can help with fundraising',
        founder_asks: {
          category: 'fundraising',
          description: 'Need help with Series A',
          sector: 'FinTech',
        },
      },
    ];

    renderWithRouter(<ProfileOffersTab loading={false} offers={mockOffers} />);

    expect(screen.getByText('My Offers')).toBeInTheDocument();
    expect(screen.getByText('I can help with fundraising')).toBeInTheDocument();
    expect(screen.getByText('Need help with Series A')).toBeInTheDocument();
  });

  it('shows accepted state with LinkedIn button', () => {
    const mockOffers = [
      {
        id: '1',
        status: 'accepted',
        created_at: '2026-01-09T12:00:00Z',
        requester_context: 'I can help',
        founder_linkedin: 'https://linkedin.com/in/founder',
        founder_asks: {
          category: 'general_advice',
          description: 'Need advice',
          sector: 'Tech',
        },
      },
    ];

    renderWithRouter(<ProfileOffersTab loading={false} offers={mockOffers} />);

    expect(screen.getByText('Connection Accepted!')).toBeInTheDocument();
    expect(screen.getByText('Connect on LinkedIn')).toBeInTheDocument();
  });

  it('shows pending state message', () => {
    const mockOffers = [
      {
        id: '1',
        status: 'pending',
        created_at: '2026-01-09T12:00:00Z',
        requester_context: 'I can help',
        founder_asks: {
          category: 'general_advice',
          description: 'Need advice',
          sector: 'Tech',
        },
      },
    ];

    renderWithRouter(<ProfileOffersTab loading={false} offers={mockOffers} />);

    expect(screen.getByText('Waiting for founder to respond...')).toBeInTheDocument();
  });

  it('shows declined state message', () => {
    const mockOffers = [
      {
        id: '1',
        status: 'declined',
        created_at: '2026-01-09T12:00:00Z',
        requester_context: 'I can help',
        founder_asks: {
          category: 'general_advice',
          description: 'Need advice',
          sector: 'Tech',
        },
      },
    ];

    renderWithRouter(<ProfileOffersTab loading={false} offers={mockOffers} />);

    expect(screen.getByText('The founder declined this offer. Keep helping others!')).toBeInTheDocument();
  });
});
