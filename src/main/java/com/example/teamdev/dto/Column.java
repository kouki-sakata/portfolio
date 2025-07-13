package com.example.teamdev.dto;

import lombok.Data;

@Data
public class Column {
    private String data;
    private String name;
    private boolean searchable;
    private boolean orderable;
    private Search search;
}
