package com.zidio.keystone.dto;

import com.zidio.keystone.domain.Priority;
import com.zidio.keystone.domain.WorkOrderStatus;

import java.time.Instant;

public record WorkOrderSummaryDto(
        Long id,
        String code,
        String title,
        Priority priority,
        WorkOrderStatus status,
        String customerName,
        String siteName,
        String assignedToName,
        Instant slaDueAt,
        boolean slaBreached
) {}
