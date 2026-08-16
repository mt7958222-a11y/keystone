package com.zidio.keystone.repository;

import com.zidio.keystone.domain.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SiteRepository extends JpaRepository<Site, Long> {
    List<Site> findByCustomerId(Long customerId);
    Page<Site> findByCustomerId(Long customerId, Pageable pageable);
}
