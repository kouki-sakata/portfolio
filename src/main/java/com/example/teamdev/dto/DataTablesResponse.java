package com.example.teamdev.dto;

import lombok.Data;
import java.util.List;

@Data
public class DataTablesResponse<T> {
    private int draw;
    private long recordsTotal;
    private long recordsFiltered;
    private List<T> data;
    
    // 既存コードとの互換性のためのデフォルトコンストラクタ
    public DataTablesResponse() {}
}
