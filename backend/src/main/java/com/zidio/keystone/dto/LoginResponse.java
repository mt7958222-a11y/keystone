package com.zidio.keystone.dto;

public record LoginResponse(
        String token,
        Long userId,
        String name,
        String email,
        String role,
        Long customerId
) {}
