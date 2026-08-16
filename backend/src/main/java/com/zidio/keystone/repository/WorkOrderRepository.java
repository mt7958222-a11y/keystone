package com.zidio.keystone.repository;

import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    Page<WorkOrder> findByCustomerId(Long customerId, Pageable pageable);

    Page<WorkOrder> findByAssignedToId(Long technicianId, Pageable pageable);

    Page<WorkOrder> findByStatus(WorkOrderStatus status, Pageable pageable);

    Page<WorkOrder> findByCustomerIdAndStatus(Long customerId, WorkOrderStatus status, Pageable pageable);

    long countByStatus(WorkOrderStatus status);

    @Query("select w from WorkOrder w where w.status not in ('CLOSED','CANCELLED','COMPLETED') and w.slaDueAt < :now")
    List<WorkOrder> findBreached(@Param("now") Instant now);

    @Query("select count(w) from WorkOrder w where w.status = 'COMPLETED' and w.slaDueAt >= w.updatedAt")
    long countCompletedWithinSla();

    boolean existsByCode(String code);
}
