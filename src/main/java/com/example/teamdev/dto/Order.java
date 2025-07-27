package com.example.teamdev.dto;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

@Data
public class Order {
    @Min(0)
    private int column;
    
    @Pattern(regexp = "^(asc|desc)$", message = "ソート方向はascまたはdescのみ有効です")
    private String dir;
}
