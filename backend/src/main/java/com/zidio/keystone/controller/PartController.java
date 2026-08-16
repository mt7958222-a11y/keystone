package com.zidio.keystone.controller;

import com.zidio.keystone.dto.PartDto;
import com.zidio.keystone.service.PartService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@Tag(name = "Parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public List<PartDto> list() {
        return partService.list();
    }

    @PostMapping
    public PartDto create(@Valid @RequestBody PartDto dto) {
        return partService.create(dto);
    }

    @PostMapping("/{id}/restock")
    public PartDto restock(@PathVariable Long id, @RequestParam int qty) {
        return partService.restock(id, qty);
    }
}
