import { EventEmitter } from "events";

export type AuthEventType = "unauthorized" | "forbidden" | "sessionExpired";

export type AuthEventPayload = {
  type: AuthEventType;
  message?: string;
  redirectUrl?: string;
};

class AuthEventEmitter extends EventEmitter {
  /**
   * Emit an unauthorized event (401 error)
   */
  emitUnauthorized(message?: string): void {
    const payload: AuthEventPayload = {
      type: "unauthorized",
      message: message ?? "Unauthorized access detected",
      redirectUrl: "/signin",
    };
    this.emit("auth-event", payload);
    this.emit("unauthorized", payload);
  }

  /**
   * Emit a forbidden event (403 error)
   */
  emitForbidden(message?: string): void {
    const payload: AuthEventPayload = {
      type: "forbidden",
      message: message ?? "Access forbidden",
    };
    this.emit("auth-event", payload);
    this.emit("forbidden", payload);
  }

  /**
   * Emit a session expired event
   */
  emitSessionExpired(message?: string): void {
    const payload: AuthEventPayload = {
      type: "sessionExpired",
      message: message ?? "Your session has expired",
      redirectUrl: "/signin",
    };
    this.emit("auth-event", payload);
    this.emit("sessionExpired", payload);
  }

  /**
   * Subscribe to all auth events
   */
  onAuthEvent(listener: (payload: AuthEventPayload) => void): void {
    this.on("auth-event", listener);
  }

  /**
   * Subscribe to unauthorized events
   */
  onUnauthorized(listener: (payload: AuthEventPayload) => void): void {
    this.on("unauthorized", listener);
  }

  /**
   * Subscribe to forbidden events
   */
  onForbidden(listener: (payload: AuthEventPayload) => void): void {
    this.on("forbidden", listener);
  }

  /**
   * Subscribe to session expired events
   */
  onSessionExpired(listener: (payload: AuthEventPayload) => void): void {
    this.on("sessionExpired", listener);
  }

  /**
   * Unsubscribe from all auth events
   */
  offAuthEvent(listener: (payload: AuthEventPayload) => void): void {
    this.off("auth-event", listener);
  }

  /**
   * Unsubscribe from unauthorized events
   */
  offUnauthorized(listener: (payload: AuthEventPayload) => void): void {
    this.off("unauthorized", listener);
  }

  /**
   * Unsubscribe from forbidden events
   */
  offForbidden(listener: (payload: AuthEventPayload) => void): void {
    this.off("forbidden", listener);
  }

  /**
   * Unsubscribe from session expired events
   */
  offSessionExpired(listener: (payload: AuthEventPayload) => void): void {
    this.off("sessionExpired", listener);
  }
}

// Export a singleton instance
export const authEvents = new AuthEventEmitter();

// Set max listeners to avoid warnings in development
authEvents.setMaxListeners(20);
