package com.example.teamdev.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StampDelete {
    /**
     * 開始年月
     */
    private String startYear;
    /**
     * 開始月
     */
    private String startMonth;
    /**
     * 終了年
     */
    private String endYear;
    /**
     * 終了月
     */
    private String endMonth;
}
