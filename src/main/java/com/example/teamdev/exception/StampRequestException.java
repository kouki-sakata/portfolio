package com.example.teamdev.exception;

import org.springframework.http.HttpStatus;

/**
 * Domain-specific exception for the stamp request workflow.
 *
 * <p>Extends {@link IllegalArgumentException} so既存のテストはそのままに、
 * HTTPレスポンスに必要なステータスコードを保持できるようにする。</p>
 */
public class StampRequestException extends IllegalArgumentException {

    private final HttpStatus status;

    public StampRequestException(HttpStatus status, String message) {
        super(message);
        this.status = status != null ? status : HttpStatus.BAD_REQUEST;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
