package com.zidio.keystone.dto;

public record TechnicianLoadDto(Long technicianId, String technicianName, long openCount, long overdueCount) {}
