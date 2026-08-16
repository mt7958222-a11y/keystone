package com.zidio.keystone.dto;

import java.time.Instant;

public record StatusHistoryDto(
        String fromStatus,
        String toStatus,
        String changedByName,
        Instant changedAt,
        String note
) {}
