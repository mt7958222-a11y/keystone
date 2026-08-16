package com.zidio.keystone.dto;

import com.zidio.keystone.domain.Priority;
import com.zidio.keystone.domain.WorkOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record WorkOrderDto(
        Long id,
        String code,
        String title,
        String description,
        Priority priority,
        WorkOrderStatus status,
        Long customerId,
        String customerName,
        Long siteId,
        String siteName,
        Long assignedToId,
        String assignedToName,
        Instant slaDueAt,
        boolean slaBreached,
        BigDecimal partsCost,
        int totalMinutesLogged,
        Instant createdAt,
        Instant updatedAt,
        List<StatusHistoryDto> history
) {}
