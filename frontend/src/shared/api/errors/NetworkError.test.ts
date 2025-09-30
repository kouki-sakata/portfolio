import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { NetworkError } from './NetworkError';

describe('NetworkError', () => {
  it('should be instance of ApiError', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error).toBeInstanceOf(ApiError);
  });

  it('should have isRetryable property set to true', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error.isRetryable).toBe(true);
  });

  it('should store the original error', () => {
    const originalError = new Error('Original network error');
    const error = new NetworkError('Network failed', originalError);
    expect(error.originalError).toBe(originalError);
  });

  it('should generate user-friendly message in Japanese', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error.getUserMessage()).toBe('ネットワークエラーが発生しました。接続を確認してください。');
  });

  it('should have status code 0 for network errors', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error.status).toBe(0);
  });

  it('should have NETWORK_ERROR code', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('should be retryable', () => {
    const error = new NetworkError('Network timeout', new Error('Timeout'));
    expect(error.canRetry()).toBe(true);
  });

  it('should provide retry suggestion', () => {
    const error = new NetworkError('Network failed', new Error('Original error'));
    expect(error.getRetrySuggestion()).toBe('ネットワーク接続を確認して、再試行してください。');
  });
});