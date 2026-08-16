package com.zidio.keystone.service;

import com.zidio.keystone.domain.Site;
import com.zidio.keystone.dto.SiteDto;
import com.zidio.keystone.exception.AccessDeniedApiException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.SiteRepository;
import com.zidio.keystone.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final CustomerService customerService;
    private final CurrentUser currentUser;

    public SiteService(SiteRepository siteRepository, CustomerService customerService, CurrentUser currentUser) {
        this.siteRepository = siteRepository;
        this.customerService = customerService;
        this.currentUser = currentUser;
    }

    public Page<SiteDto> listByCustomer(Long customerId, Pageable pageable) {
        assertCustomerVisible(customerId);
        return siteRepository.findByCustomerId(customerId, pageable).map(this::toDto);
    }

    public List<SiteDto> allForCustomer(Long customerId) {
        assertCustomerVisible(customerId);
        return siteRepository.findByCustomerId(customerId).stream().map(this::toDto).toList();
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    @Transactional
    public SiteDto create(SiteDto dto) {
        Site site = Site.builder()
                .customer(customerService.findEntity(dto.customerId()))
                .name(dto.name())
                .address(dto.address())
                .build();
        return toDto(siteRepository.save(site));
    }

    Site findEntity(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site " + id + " not found"));
    }

    private void assertCustomerVisible(Long customerId) {
        var user = currentUser.get();
        boolean isCustomerRole = user.getUser().getRole().name().equals("CUSTOMER");
        if (isCustomerRole && !customerId.equals(user.getCustomerId())) {
            throw new AccessDeniedApiException("Cannot view another customer's sites");
        }
    }

    private SiteDto toDto(Site s) {
        return new SiteDto(s.getId(), s.getCustomer().getId(), s.getName(), s.getAddress());
    }
}
