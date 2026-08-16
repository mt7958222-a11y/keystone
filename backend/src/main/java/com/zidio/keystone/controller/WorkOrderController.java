package com.zidio.keystone.controller;

import com.zidio.keystone.domain.WorkOrderStatus;
import com.zidio.keystone.dto.*;
import com.zidio.keystone.service.WorkOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-orders")
@Tag(name = "Work Orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping
    public Page<WorkOrderSummaryDto> list(@RequestParam(required = false) WorkOrderStatus status, Pageable pageable) {
        return workOrderService.list(status, pageable);
    }

    @GetMapping("/{id}")
    public WorkOrderDto get(@PathVariable Long id) {
        return workOrderService.get(id);
    }

    @PostMapping
    public WorkOrderDto create(@Valid @RequestBody WorkOrderCreateRequest request) {
        return workOrderService.create(request);
    }

    @PutMapping("/{id}")
    public WorkOrderDto update(@PathVariable Long id, @Valid @RequestBody WorkOrderUpdateRequest request) {
        return workOrderService.update(id, request);
    }

    @PostMapping("/{id}/assign")
    public WorkOrderDto assign(@PathVariable Long id, @Valid @RequestBody AssignRequest request) {
        return workOrderService.assign(id, request);
    }

    @PostMapping("/{id}/status")
    public WorkOrderDto changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        return workOrderService.changeStatus(id, request);
    }

    @PostMapping("/{id}/parts")
    public WorkOrderDto logParts(@PathVariable Long id, @Valid @RequestBody PartUsageRequest request) {
        return workOrderService.logParts(id, request);
    }

    @PostMapping("/{id}/time")
    public WorkOrderDto logTime(@PathVariable Long id, @Valid @RequestBody TimeLogRequest request) {
        return workOrderService.logTime(id, request);
    }
}
