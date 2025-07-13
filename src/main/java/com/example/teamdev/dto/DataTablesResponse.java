package com.example.teamdev.dto;

import com.example.teamdev.entity.Employee;
import lombok.Data;
import java.util.List;

@Data
public class DataTablesResponse {
    private int draw;
    private long recordsTotal;
    private long recordsFiltered;
    private List<Employee> data;
}
