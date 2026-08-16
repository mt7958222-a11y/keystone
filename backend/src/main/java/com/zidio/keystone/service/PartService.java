package com.zidio.keystone.service;

import com.zidio.keystone.domain.Part;
import com.zidio.keystone.dto.PartDto;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.PartRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public List<PartDto> list() {
        return partRepository.findAll().stream().map(this::toDto).toList();
    }

    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public PartDto create(PartDto dto) {
        Part part = Part.builder()
                .name(dto.name())
                .sku(dto.sku())
                .unitCost(dto.unitCost())
                .stockQty(dto.stockQty())
                .build();
        return toDto(partRepository.save(part));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public PartDto restock(Long id, int additionalQty) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part " + id + " not found"));
        part.setStockQty(part.getStockQty() + additionalQty);
        return toDto(part);
    }

    private PartDto toDto(Part p) {
        return new PartDto(p.getId(), p.getName(), p.getSku(), p.getUnitCost(), p.getStockQty());
    }
}
