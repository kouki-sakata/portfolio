package com.example.teamdev.dto;

import lombok.Data;
import java.util.List;

@Data
public class DataTablesRequest {
    private int draw;
    private int start;
    private int length;
    private Search search;
    private List<Order> order;
    private List<Column> columns;
}
