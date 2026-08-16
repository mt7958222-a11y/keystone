package com.zidio.keystone.dto;

import java.math.BigDecimal;

public record PartDto(Long id, String name, String sku, BigDecimal unitCost, int stockQty) {}
