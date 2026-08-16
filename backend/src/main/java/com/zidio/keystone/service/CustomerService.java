package com.zidio.keystone.service;

import com.zidio.keystone.domain.Customer;
import com.zidio.keystone.dto.CustomerDto;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public Page<CustomerDto> list(String search, Pageable pageable) {
        Page<Customer> page = (search == null || search.isBlank())
                ? customerRepository.findAll(pageable)
                : customerRepository.findByNameContainingIgnoreCase(search, pageable);
        return page.map(this::toDto);
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    public CustomerDto get(Long id) {
        return toDto(findEntity(id));
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    @Transactional
    public CustomerDto create(CustomerDto dto) {
        Customer customer = Customer.builder()
                .name(dto.name())
                .contactEmail(dto.contactEmail())
                .contactPhone(dto.contactPhone())
                .build();
        return toDto(customerRepository.save(customer));
    }

    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    @Transactional
    public CustomerDto update(Long id, CustomerDto dto) {
        Customer customer = findEntity(id);
        customer.setName(dto.name());
        customer.setContactEmail(dto.contactEmail());
        customer.setContactPhone(dto.contactPhone());
        return toDto(customer);
    }

    Customer findEntity(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + id + " not found"));
    }

    private CustomerDto toDto(Customer c) {
        return new CustomerDto(c.getId(), c.getName(), c.getContactEmail(), c.getContactPhone());
    }
}
