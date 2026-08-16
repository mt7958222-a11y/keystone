package com.zidio.keystone.controller;

import com.zidio.keystone.dto.SiteDto;
import com.zidio.keystone.service.SiteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/{customerId}/sites")
@Tag(name = "Sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public Page<SiteDto> list(@PathVariable Long customerId, Pageable pageable) {
        return siteService.listByCustomer(customerId, pageable);
    }

    @GetMapping("/all")
    public List<SiteDto> all(@PathVariable Long customerId) {
        return siteService.allForCustomer(customerId);
    }

    @PostMapping
    public SiteDto create(@PathVariable Long customerId, @Valid @RequestBody SiteDto dto) {
        SiteDto toCreate = new SiteDto(null, customerId, dto.name(), dto.address());
        return siteService.create(toCreate);
    }
}
