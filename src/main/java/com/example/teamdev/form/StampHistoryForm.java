package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * StampHistoryForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StampHistoryForm {

    /**
     * 年
     */
    @NotBlank
    private String year;
    /**
     * 月
     */
    @NotBlank
    private String month;

}
