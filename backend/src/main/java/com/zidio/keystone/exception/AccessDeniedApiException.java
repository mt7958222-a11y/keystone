package com.zidio.keystone.exception;

import org.springframework.http.HttpStatus;

public class AccessDeniedApiException extends ApiException {
    public AccessDeniedApiException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
