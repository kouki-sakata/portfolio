package com.example.teamdev.dto;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.util.List;

@Data
public class DataTablesRequest {
    @Min(0)
    private int draw;
    
    @Min(0)
    private int start;
    
    @Min(1)
    @Max(100)
    private int length;
    
    @Valid
    private Search search;
    
    @Valid
    private List<Order> order;
    
    @Valid
    private List<Column> columns;
}
