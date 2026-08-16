package com.zidio.keystone.exception;

import org.springframework.http.HttpStatus;

public class IllegalTransitionException extends ApiException {
    public IllegalTransitionException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
