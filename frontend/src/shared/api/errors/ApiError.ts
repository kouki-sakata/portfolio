export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if the error is a client error (4xx status code)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if the error is a server error (5xx status code)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if the error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if the error is a forbidden error (403)
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if the error is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if the error is a validation error (422)
   */
  isValidationError(): boolean {
    return this.status === 422;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    if (this.message) {
      return this.message;
    }

    switch (this.status) {
      case 400:
        return "Bad request. Please check your input.";
      case 401:
        return "You are not authenticated. Please log in.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 422:
        return "Validation error. Please check your input.";
      case 500:
        return "An internal server error occurred. Please try again later.";
      case 502:
        return "Bad gateway. Please try again later.";
      case 503:
        return "Service unavailable. Please try again later.";
      default:
        return "An unexpected error occurred.";
    }
  }
}
