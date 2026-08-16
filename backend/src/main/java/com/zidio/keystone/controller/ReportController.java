package com.zidio.keystone.controller;

import com.zidio.keystone.dto.ReportSummaryDto;
import com.zidio.keystone.service.ReportingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports")
public class ReportController {

    private final ReportingService reportingService;

    public ReportController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/summary")
    public ReportSummaryDto summary() {
        return reportingService.summary();
    }
}
