package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerDto(
        Long id,
        @NotBlank String name,
        String contactEmail,
        String contactPhone
) {}
