import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import PaymentDialog from '../members/PaymentDialog';
import { renderWithProviders } from '@/test/setupTests';

describe('PaymentDialog Component', () => {
  const defaultProps = {
    memberProfile: {
      yearly_payment_status: 'pending' as const,
      emergency_collection_status: 'pending' as const,
      emergency_collection_amount: 100,
      yearly_payment_due_date: '2025-01-01',
      emergency_collection_due_date: '2025-02-01',
      member_number: 'TEST001',
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment sections correctly', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} />);
    expect(screen.getByText(/Annual Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency Collection/i)).toBeInTheDocument();
  });

  it('displays correct payment status', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows completed status correctly', () => {
    renderWithProviders(
      <PaymentDialog 
        memberProfile={{
          ...defaultProps.memberProfile,
          yearly_payment_status: 'completed',
          emergency_collection_status: 'completed'
        }}
      />
    );
    expect(screen.getByText('completed')).toBeInTheDocument();
  });
});