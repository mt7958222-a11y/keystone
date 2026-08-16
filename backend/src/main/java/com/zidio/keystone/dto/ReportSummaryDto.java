package com.zidio.keystone.dto;

import java.util.List;
import java.util.Map;

public record ReportSummaryDto(
        Map<String, Long> countsByStatus,
        long overdueCount,
        double slaComplianceRate,
        List<TechnicianLoadDto> byTechnician
) {}
