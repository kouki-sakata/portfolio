import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { GlobalErrorHandler } from './GlobalErrorHandler';
import { UnexpectedError } from '../api/errors';

// モックコンソール
const originalError = console.error;

beforeEach(() => {
  // React Error Boundaryのエラーログを抑制
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

// エラーをスローするテスト用コンポーネント
const ThrowError: React.FC<{ error: Error }> = ({ error }) => {
  throw error;
};

// 正常にレンダリングされるテスト用コンポーネント
const NormalComponent: React.FC = () => {
  return <div>Normal Component</div>;
};

describe('ErrorBoundary', () => {
  const mockToast = vi.fn();
  const mockLogger = {
    log: vi.fn(),
    sendToRemote: vi.fn().mockResolvedValue(undefined),
  };
  const mockOnError = vi.fn();
  const mockResetQueries = vi.fn();

  beforeEach(() => {
    // GlobalErrorHandlerを初期化
    GlobalErrorHandler.reset();
    GlobalErrorHandler.initialize({
      toast: mockToast,
      logger: mockLogger,
      environment: 'development',
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    GlobalErrorHandler.reset();
  });

  describe('Normal Rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary fallback={<div>Error Fallback</div>}>
          <NormalComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal Component')).toBeInTheDocument();
      expect(screen.queryByText('Error Fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display fallback UI', () => {
      const error = new Error('Test error');

      render(
        <ErrorBoundary fallback={<div>Error Fallback</div>}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
      expect(screen.queryByText('Normal Component')).not.toBeInTheDocument();
    });

    it('should call GlobalErrorHandler when error occurs', () => {
      const error = new UnexpectedError('Test error');
      const handleSpy = vi.spyOn(GlobalErrorHandler.getInstance(), 'handle');

      render(
        <ErrorBoundary fallback={<div>Error Fallback</div>}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(handleSpy).toHaveBeenCalledWith(error);
    });

    it('should call onError callback when provided', () => {
      const error = new Error('Test error');

      render(
        <ErrorBoundary
          fallback={<div>Error Fallback</div>}
          onError={mockOnError}
        >
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should pass error to fallback component when using render prop', () => {
      const error = new Error('Test error message');

      render(
        <ErrorBoundary
          fallback={(props) => (
            <div>
              <h1>Error occurred</h1>
              <p>{props.error.message}</p>
              <button onClick={props.reset}>Reset</button>
            </div>
          )}
        >
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error state when reset is called', async () => {
      const error = new Error('Test error');
      let shouldThrow = true;

      const ConditionalError: React.FC = () => {
        if (shouldThrow) {
          throw error;
        }
        return <div>Recovered Component</div>;
      };

      const { rerender } = render(
        <ErrorBoundary
          fallback={(props) => (
            <div>
              <span>Error Fallback</span>
              <button onClick={() => {
                shouldThrow = false;
                props.reset();
              }}>
                Reset
              </button>
            </div>
          )}
        >
          <ConditionalError />
        </ErrorBoundary>
      );

      // エラー状態を確認
      expect(screen.getByText('Error Fallback')).toBeInTheDocument();

      // リセットボタンをクリック
      const resetButton = screen.getByRole('button', { name: 'Reset' });
      resetButton.click();

      // コンポーネントを再レンダリング
      rerender(
        <ErrorBoundary
          fallback={(props) => (
            <div>
              <span>Error Fallback</span>
              <button onClick={props.reset}>Reset</button>
            </div>
          )}
        >
          <ConditionalError />
        </ErrorBoundary>
      );

      // 復旧したことを確認
      await waitFor(() => {
        expect(screen.getByText('Recovered Component')).toBeInTheDocument();
      });
      expect(screen.queryByText('Error Fallback')).not.toBeInTheDocument();
    });

    it('should call resetQueries when provided on reset', () => {
      const error = new Error('Test error');

      render(
        <ErrorBoundary
          fallback={(props) => (
            <div>
              <span>Error Fallback</span>
              <button onClick={props.reset}>Reset</button>
            </div>
          )}
          resetQueries={mockResetQueries}
        >
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: 'Reset' });
      resetButton.click();

      expect(mockResetQueries).toHaveBeenCalled();
    });
  });

  describe('Fallback Types', () => {
    it('should support React element as fallback', () => {
      const error = new Error('Test error');

      render(
        <ErrorBoundary fallback={<div>Static Fallback</div>}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Static Fallback')).toBeInTheDocument();
    });

    it('should support function as fallback', () => {
      const error = new Error('Test error');

      render(
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <div>
              <span>Function Fallback</span>
              <span>{error.message}</span>
            </div>
          )}
        >
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Function Fallback')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should support component as fallback', () => {
      const error = new Error('Test error');

      const FallbackComponent: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => (
        <div>
          <h1>Component Fallback</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={FallbackComponent}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Fallback')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });

  describe('Isolation', () => {
    it('should isolate errors to the boundary', () => {
      const error = new Error('Test error');

      render(
        <div>
          <div>Outside Component</div>
          <ErrorBoundary fallback={<div>Error Fallback</div>}>
            <ThrowError error={error} />
          </ErrorBoundary>
          <div>Another Outside Component</div>
        </div>
      );

      // エラー境界外のコンポーネントは正常に表示される
      expect(screen.getByText('Outside Component')).toBeInTheDocument();
      expect(screen.getByText('Another Outside Component')).toBeInTheDocument();
      // エラー境界内はフォールバックが表示される
      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
    });

    it('should allow nested error boundaries', () => {
      const outerError = new Error('Outer error');
      const innerError = new Error('Inner error');

      render(
        <ErrorBoundary fallback={<div>Outer Fallback</div>}>
          <div>Normal Content</div>
          <ErrorBoundary fallback={<div>Inner Fallback</div>}>
            <ThrowError error={innerError} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // 内側のエラー境界でエラーが処理される
      expect(screen.getByText('Normal Content')).toBeInTheDocument();
      expect(screen.getByText('Inner Fallback')).toBeInTheDocument();
      expect(screen.queryByText('Outer Fallback')).not.toBeInTheDocument();
    });
  });
});