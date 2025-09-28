import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { FeatureFlagProvider } from '../../../contexts/FeatureFlagContext';
import { ButtonWrapper } from '../ButtonWrapper';

describe('ButtonWrapper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('with feature flag disabled', () => {
    it('should render custom button implementation', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <ButtonWrapper>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeDefined();
      // Custom implementation should have specific class
      expect(button.className).not.toContain('inline-flex'); // shadcn/ui specific class
    });

    it('should handle onClick events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <ButtonWrapper onClick={handleClick}>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled state', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <ButtonWrapper disabled>Disabled Button</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toHaveProperty('disabled', true);
    });
  });

  describe('with feature flag enabled', () => {
    it('should render shadcn/ui button', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          <ButtonWrapper>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeDefined();
      // shadcn/ui button should have specific classes
      expect(button.className).toContain('inline-flex');
      expect(button.className).toContain('items-center');
    });

    it('should support variant prop with shadcn/ui', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          <ButtonWrapper variant="destructive">Delete</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button.className).toContain('bg-red-500');
    });

    it('should support size prop with shadcn/ui', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          <ButtonWrapper size="lg">Large Button</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Large Button' });
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('px-8');
    });
  });

  describe('type safety', () => {
    it('should accept all button HTML attributes', () => {
      const handleClick = vi.fn();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <ButtonWrapper
            id="test-button"
            className="custom-class"
            onClick={handleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            type="submit"
            disabled
            aria-label="Test Button"
            data-testid="button-test"
          >
            Test Button
          </ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toHaveProperty('id', 'test-button');
      expect(button).toHaveProperty('type', 'submit');
      expect(button).toHaveAttribute('data-testid', 'button-test');
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();

      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          <ButtonWrapper ref={ref}>Button with ref</ButtonWrapper>
        </FeatureFlagProvider>
      );

      // The ref callback should have been called with the button element
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading prop is true', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <ButtonWrapper loading>Loading...</ButtonWrapper>
        </FeatureFlagProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
      // Should contain loading text or spinner
      expect(button.textContent).toContain('Loading...');
    });
  });
});