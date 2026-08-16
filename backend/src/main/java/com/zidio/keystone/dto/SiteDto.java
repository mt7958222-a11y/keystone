package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SiteDto(
        Long id,
        @NotNull Long customerId,
        @NotBlank String name,
        @NotBlank String address
) {}
