package com.example.teamdev.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class Search {
    @Size(max = 100, message = "検索値は100文字以内で入力してください")
    private String value;
    
    private boolean regex;
}
