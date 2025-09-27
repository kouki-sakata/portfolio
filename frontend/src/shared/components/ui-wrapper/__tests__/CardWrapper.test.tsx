import { fireEvent,render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { vi } from 'vitest';

import { CardWrapper } from '../CardWrapper';

// Mock card component
const MockCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div data-testid="card" className={className}>
    {children}
  </div>
);

// Mock card components
vi.mock('../card-components', () => ({
  Card: MockCard,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
}));

describe('CardWrapper', () => {
  it('should render with default props', () => {
    render(
      <CardWrapper>
        <div>Test content</div>
      </CardWrapper>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <CardWrapper className="custom-class">
        <div>Test content</div>
      </CardWrapper>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('should render header when provided', () => {
    render(
      <CardWrapper header={<div>Header content</div>}>
        <div>Body content</div>
      </CardWrapper>
    );

    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    render(
      <CardWrapper footer={<div>Footer content</div>}>
        <div>Body content</div>
      </CardWrapper>
    );

    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    
    render(
      <CardWrapper onClick={handleClick}>
        <div>Clickable content</div>
      </CardWrapper>
    );

    // Fixed: Use Testing Library methods instead of direct node access
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with loading state', () => {
    render(
      <CardWrapper loading>
        <div>Content</div>
      </CardWrapper>
    );

    // Fixed: Use proper Testing Library queries
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('should render with error state', () => {
    const errorMessage = 'Something went wrong';
    
    render(
      <CardWrapper error={errorMessage}>
        <div>Content</div>
      </CardWrapper>
    );

    // Fixed: Use Testing Library methods instead of direct node access
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(
      <CardWrapper onFocus={handleFocus} onBlur={handleBlur}>
        <div>Focusable content</div>
      </CardWrapper>
    );

    const card = screen.getByTestId('card');
    
    // Fixed: Use Testing Library methods instead of direct node access
    fireEvent.focus(card);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(card);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events', () => {
    const handleKeyDown = vi.fn();
    
    render(
      <CardWrapper onKeyDown={handleKeyDown}>
        <div>Content with keyboard handling</div>
      </CardWrapper>
    );

    const card = screen.getByTestId('card');
    
    // Fixed: Use Testing Library methods instead of direct node access
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('should render nested cards correctly', () => {
    render(
      <CardWrapper>
        <CardWrapper>
          <div>Nested content</div>
        </CardWrapper>
      </CardWrapper>
    );

    // Fixed: Use Testing Library methods to query multiple cards
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  // Fixed: Proper error handling without unsafe assignments
  it('should handle component errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const ThrowError = () => {
      throw new Error('Test error');
    };

    expect(() => {
      render(
        <CardWrapper>
          <ThrowError />
        </CardWrapper>
      );
    }).toThrow('Test error');

    consoleSpy.mockRestore();
  });
});