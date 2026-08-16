package com.zidio.keystone.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Small helper to read the authenticated principal out of the security context. */
@Component
public class CurrentUser {

    public KeystoneUserDetails get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof KeystoneUserDetails details)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return details;
    }
}
