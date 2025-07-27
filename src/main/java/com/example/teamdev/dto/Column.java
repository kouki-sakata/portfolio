package com.example.teamdev.dto;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

@Data
public class Column {
    @Size(max = 50, message = "カラム名は50文字以内で入力してください")
    @Pattern(regexp = "^[a-zA-Z_][a-zA-Z0-9_]*$", message = "カラム名は英数字とアンダースコアのみ使用可能です")
    private String data;
    
    @Size(max = 50, message = "表示名は50文字以内で入力してください")
    private String name;
    
    private boolean searchable;
    private boolean orderable;
    
    @Valid
    private Search search;
}
