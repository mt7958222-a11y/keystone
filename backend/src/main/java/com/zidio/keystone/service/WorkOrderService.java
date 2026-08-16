package com.zidio.keystone.service;

import com.zidio.keystone.domain.*;
import com.zidio.keystone.dto.*;
import com.zidio.keystone.exception.AccessDeniedApiException;
import com.zidio.keystone.exception.IllegalTransitionException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.*;
import com.zidio.keystone.security.CurrentUser;
import com.zidio.keystone.security.KeystoneUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Owns the work-order lifecycle. This is the heart of KEYSTONE: every status
 * change is validated against the guarded state machine (Figure 4 of the
 * brief), restricted by role, and written to the append-only history table
 * inside the same transaction as the status change itself.
 */
@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final CustomerService customerService;
    private final SiteService siteService;
    private final UserRepository userRepository;
    private final PartRepository partRepository;
    private final PartUsageRepository partUsageRepository;
    private final TimeLogRepository timeLogRepository;
    private final CurrentUser currentUser;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                             WorkOrderStatusHistoryRepository historyRepository,
                             CustomerService customerService,
                             SiteService siteService,
                             UserRepository userRepository,
                             PartRepository partRepository,
                             PartUsageRepository partUsageRepository,
                             TimeLogRepository timeLogRepository,
                             CurrentUser currentUser) {
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
        this.customerService = customerService;
        this.siteService = siteService;
        this.userRepository = userRepository;
        this.partRepository = partRepository;
        this.partUsageRepository = partUsageRepository;
        this.timeLogRepository = timeLogRepository;
        this.currentUser = currentUser;
    }

    // --- Guarded state machine -------------------------------------------------

    private static final Map<WorkOrderStatus, Set<WorkOrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(WorkOrderStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.NEW, EnumSet.of(WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.ASSIGNED, EnumSet.of(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.IN_PROGRESS, EnumSet.of(WorkOrderStatus.ON_HOLD, WorkOrderStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.ON_HOLD, EnumSet.of(WorkOrderStatus.IN_PROGRESS));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.COMPLETED, EnumSet.of(WorkOrderStatus.CLOSED, WorkOrderStatus.IN_PROGRESS)); // IN_PROGRESS = reopen
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.CLOSED, EnumSet.noneOf(WorkOrderStatus.class));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.CANCELLED, EnumSet.noneOf(WorkOrderStatus.class));
    }

    private static final AtomicInteger CODE_SEQUENCE_FALLBACK = new AtomicInteger(9000);

    // --- Queries -----------------------------------------------------------

    public Page<WorkOrderSummaryDto> list(WorkOrderStatus status, Pageable pageable) {
        var user = currentUser.get();
        Page<WorkOrder> page = switch (user.getUser().getRole()) {
            case CUSTOMER -> status != null
                    ? workOrderRepository.findByCustomerIdAndStatus(user.getCustomerId(), status, pageable)
                    : workOrderRepository.findByCustomerId(user.getCustomerId(), pageable);
            case TECHNICIAN -> workOrderRepository.findByAssignedToId(user.getId(), pageable);
            case DISPATCHER, MANAGER -> status != null
                    ? workOrderRepository.findByStatus(status, pageable)
                    : workOrderRepository.findAll(pageable);
        };
        return page.map(this::toSummaryDto);
    }

    public WorkOrderDto get(Long id) {
        WorkOrder wo = findEntity(id);
        assertVisible(wo);
        return toDto(wo);
    }

    // --- Commands ------------------------------------------------------------

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    @Transactional
    public WorkOrderDto create(WorkOrderCreateRequest req) {
        var user = currentUser.get();
        Long customerId = req.customerId();

        // Customers may only raise requests for their own organisation.
        if (user.getUser().getRole() == Role.CUSTOMER && !customerId.equals(user.getCustomerId())) {
            throw new AccessDeniedApiException("Cannot raise a request for another customer");
        }

        Customer customer = customerService.findEntity(customerId);
        Site site = siteService.findEntity(req.siteId());
        if (!site.getCustomer().getId().equals(customerId)) {
            throw new IllegalTransitionException("Site does not belong to the given customer");
        }

        WorkOrder wo = WorkOrder.builder()
                .code(nextCode())
                .title(req.title())
                .description(req.description())
                .priority(req.priority())
                .status(WorkOrderStatus.NEW)
                .customer(customer)
                .site(site)
                .slaDueAt(slaDueDateFor(req.priority()))
                .createdBy(userRepository.findById(user.getId()).orElse(null))
                .build();

        wo = workOrderRepository.save(wo);
        writeHistory(wo, null, WorkOrderStatus.NEW, "Work order raised");
        return toDto(wo);
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    @Transactional
    public WorkOrderDto update(Long id, WorkOrderUpdateRequest req) {
        WorkOrder wo = findEntity(id);
        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalTransitionException("Cannot edit a " + wo.getStatus() + " work order");
        }
        wo.setTitle(req.title());
        wo.setDescription(req.description());
        wo.setPriority(req.priority());
        return toDto(wo);
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    @Transactional
    public WorkOrderDto assign(Long id, AssignRequest req) {
        WorkOrder wo = findEntity(id);
        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED
                || wo.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new IllegalTransitionException("Cannot (re)assign a " + wo.getStatus() + " work order");
        }
        User technician = userRepository.findById(req.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician " + req.technicianId() + " not found"));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalTransitionException("Work orders can only be assigned to a technician");
        }

        wo.setAssignedTo(technician);
        if (wo.getStatus() == WorkOrderStatus.NEW) {
            WorkOrderStatus from = wo.getStatus();
            wo.setStatus(WorkOrderStatus.ASSIGNED);
            writeHistory(wo, from, WorkOrderStatus.ASSIGNED, "Assigned to " + technician.getName());
        } else {
            writeHistory(wo, wo.getStatus(), wo.getStatus(), "Reassigned to " + technician.getName());
        }
        return toDto(wo);
    }

    @Transactional
    public WorkOrderDto changeStatus(Long id, StatusChangeRequest req) {
        WorkOrder wo = findEntity(id);
        WorkOrderStatus from = wo.getStatus();
        WorkOrderStatus to = req.toStatus();

        assertTransitionAllowed(from, to);
        assertRoleCanTransition(wo, from, to);

        wo.setStatus(to);
        writeHistory(wo, from, to, req.note());
        return toDto(wo);
    }

    @Transactional
    public WorkOrderDto logParts(Long id, PartUsageRequest req) {
        WorkOrder wo = findEntity(id);
        assertAssignedTechnicianOrDispatch(wo);
        assertOpenForFieldUpdates(wo);

        Part part = partRepository.findById(req.partId())
                .orElseThrow(() -> new ResourceNotFoundException("Part " + req.partId() + " not found"));

        // Decrement stock and record usage in the same transaction - never a partial update.
        if (part.getStockQty() < req.qtyUsed()) {
            throw new IllegalTransitionException("Insufficient stock for " + part.getName()
                    + " (have " + part.getStockQty() + ", need " + req.qtyUsed() + ")");
        }
        part.setStockQty(part.getStockQty() - req.qtyUsed());
        partRepository.save(part);

        PartUsage usage = PartUsage.builder()
                .workOrder(wo)
                .part(part)
                .qtyUsed(req.qtyUsed())
                .loggedBy(userRepository.findById(currentUser.get().getId()).orElse(null))
                .build();
        partUsageRepository.save(usage);

        return toDto(wo);
    }

    @Transactional
    public WorkOrderDto logTime(Long id, TimeLogRequest req) {
        WorkOrder wo = findEntity(id);
        assertAssignedTechnicianOrDispatch(wo);
        assertOpenForFieldUpdates(wo);

        TimeLog log = TimeLog.builder()
                .workOrder(wo)
                .technician(userRepository.findById(currentUser.get().getId()).orElseThrow())
                .minutes(req.minutes())
                .note(req.note())
                .build();
        timeLogRepository.save(log);
        return toDto(wo);
    }

    // --- Guards --------------------------------------------------------------

    private void assertTransitionAllowed(WorkOrderStatus from, WorkOrderStatus to) {
        Set<WorkOrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new IllegalTransitionException("Illegal transition: " + from + " -> " + to);
        }
    }

    private void assertRoleCanTransition(WorkOrder wo, WorkOrderStatus from, WorkOrderStatus to) {
        var user = currentUser.get();
        Role role = user.getUser().getRole();
        boolean isAssignedTechnician = wo.getAssignedTo() != null && wo.getAssignedTo().getId().equals(user.getId());

        boolean allowed = switch (to) {
            case IN_PROGRESS -> (from == WorkOrderStatus.ASSIGNED || from == WorkOrderStatus.ON_HOLD)
                    ? isAssignedTechnician
                    : role == Role.MANAGER; // reopen from COMPLETED
            case ON_HOLD -> isAssignedTechnician;
            case COMPLETED -> isAssignedTechnician;
            case CLOSED -> role == Role.MANAGER;
            case CANCELLED -> role == Role.DISPATCHER || role == Role.MANAGER;
            default -> false;
        };

        if (!allowed) {
            throw new AccessDeniedApiException("Role " + role + " cannot move a work order from " + from + " to " + to);
        }
    }

    private void assertAssignedTechnicianOrDispatch(WorkOrder wo) {
        var user = currentUser.get();
        Role role = user.getUser().getRole();
        boolean isAssignedTechnician = wo.getAssignedTo() != null && wo.getAssignedTo().getId().equals(user.getId());
        if (role == Role.TECHNICIAN && !isAssignedTechnician) {
            throw new AccessDeniedApiException("Only the assigned technician can log parts or time on this job");
        }
        if (role == Role.CUSTOMER) {
            throw new AccessDeniedApiException("Customers cannot log parts or time");
        }
    }

    private void assertOpenForFieldUpdates(WorkOrder wo) {
        if (Set.of(WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED).contains(wo.getStatus())) {
            throw new IllegalTransitionException("Cannot log parts/time on a " + wo.getStatus() + " work order");
        }
    }

    private void assertVisible(WorkOrder wo) {
        var user = currentUser.get();
        Role role = user.getUser().getRole();
        if (role == Role.CUSTOMER && !wo.getCustomer().getId().equals(user.getCustomerId())) {
            throw new AccessDeniedApiException("Cannot view another customer's work order");
        }
        if (role == Role.TECHNICIAN && (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(user.getId()))) {
            throw new AccessDeniedApiException("Technicians can only view their assigned jobs");
        }
    }

    // --- Helpers ---------------------------------------------------------------

    private WorkOrder findEntity(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work order " + id + " not found"));
    }

    private void writeHistory(WorkOrder wo, WorkOrderStatus from, WorkOrderStatus to, String note) {
        User changedBy = userRepository.findById(currentUser.get().getId()).orElse(null);
        historyRepository.save(WorkOrderStatusHistory.builder()
                .workOrder(wo)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(changedBy)
                .note(note)
                .build());
    }

    private String nextCode() {
        long count = workOrderRepository.count() + 1;
        String candidate = String.format("WO-%04d", 1000 + count);
        while (workOrderRepository.existsByCode(candidate)) {
            candidate = String.format("WO-%04d", 1000 + CODE_SEQUENCE_FALLBACK.incrementAndGet());
        }
        return candidate;
    }

    private Instant slaDueDateFor(Priority priority) {
        Duration window = switch (priority) {
            case URGENT -> Duration.ofHours(2);
            case HIGH -> Duration.ofHours(8);
            case MEDIUM -> Duration.ofDays(2);
            case LOW -> Duration.ofDays(5);
        };
        return Instant.now().plus(window);
    }

    private boolean isBreached(WorkOrder wo) {
        boolean terminalOk = wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED;
        return !terminalOk && wo.getSlaDueAt().isBefore(Instant.now());
    }

    private WorkOrderSummaryDto toSummaryDto(WorkOrder wo) {
        return new WorkOrderSummaryDto(
                wo.getId(), wo.getCode(), wo.getTitle(), wo.getPriority(), wo.getStatus(),
                wo.getCustomer().getName(), wo.getSite().getName(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getSlaDueAt(), isBreached(wo));
    }

    private WorkOrderDto toDto(WorkOrder wo) {
        List<PartUsage> usages = partUsageRepository.findByWorkOrderId(wo.getId());
        List<TimeLog> logs = timeLogRepository.findByWorkOrderId(wo.getId());
        List<WorkOrderStatusHistory> history = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(wo.getId());

        BigDecimal partsCost = usages.stream()
                .map(u -> u.getPart().getUnitCost().multiply(BigDecimal.valueOf(u.getQtyUsed())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalMinutes = logs.stream().mapToInt(TimeLog::getMinutes).sum();

        List<StatusHistoryDto> historyDtos = history.stream()
                .map(h -> new StatusHistoryDto(
                        h.getFromStatus() != null ? h.getFromStatus().name() : null,
                        h.getToStatus().name(),
                        h.getChangedBy() != null ? h.getChangedBy().getName() : "system",
                        h.getChangedAt(),
                        h.getNote()))
                .toList();

        return new WorkOrderDto(
                wo.getId(), wo.getCode(), wo.getTitle(), wo.getDescription(), wo.getPriority(), wo.getStatus(),
                wo.getCustomer().getId(), wo.getCustomer().getName(),
                wo.getSite().getId(), wo.getSite().getName(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getId() : null,
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getSlaDueAt(), isBreached(wo),
                partsCost, totalMinutes,
                wo.getCreatedAt(), wo.getUpdatedAt(),
                historyDtos);
    }
}
