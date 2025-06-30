package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * NewsManageForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsManageForm {

    /**
     * ID
     */
    private String id;
    /**
     * お知らせ日時
     */
    @NotBlank
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$")
    private String newsDate;
    /**
     * 内容
     */
    @NotBlank
    @Size(min = 1, max = 75)
    private String content;
}
