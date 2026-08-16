package com.zidio.keystone.service;

import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import com.zidio.keystone.dto.ReportSummaryDto;
import com.zidio.keystone.dto.TechnicianLoadDto;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.repository.WorkOrderRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Powers the manager dashboard: status mix, overdue work, SLA compliance,
 * and workload by technician.
 */
@Service
public class ReportingService {

    private final WorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;

    public ReportingService(WorkOrderRepository workOrderRepository, UserRepository userRepository) {
        this.workOrderRepository = workOrderRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ReportSummaryDto summary() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (WorkOrderStatus status : WorkOrderStatus.values()) {
            counts.put(status.name(), workOrderRepository.countByStatus(status));
        }

        List<WorkOrder> breached = workOrderRepository.findBreached(Instant.now());
        long overdue = breached.size();

        long closedOrCompleted = counts.getOrDefault("CLOSED", 0L) + counts.getOrDefault("COMPLETED", 0L);
        long metSla = workOrderRepository.countCompletedWithinSla();
        double complianceRate = closedOrCompleted == 0 ? 100.0 : (metSla * 100.0) / closedOrCompleted;

        List<User> technicians = userRepository.findByRole(Role.TECHNICIAN);
        List<TechnicianLoadDto> byTechnician = technicians.stream()
                .map(t -> {
                    var page = workOrderRepository.findByAssignedToId(t.getId(), Pageable.unpaged());
                    long open = page.stream()
                            .filter(w -> !Set.of(WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED).contains(w.getStatus()))
                            .count();
                    long over = page.stream()
                            .filter(w -> !Set.of(WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED).contains(w.getStatus()))
                            .filter(w -> w.getSlaDueAt().isBefore(Instant.now()))
                            .count();
                    return new TechnicianLoadDto(t.getId(), t.getName(), open, over);
                })
                .collect(Collectors.toList());

        return new ReportSummaryDto(counts, overdue, Math.round(complianceRate * 10) / 10.0, byTechnician);
    }
}
