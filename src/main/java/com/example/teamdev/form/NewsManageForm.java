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
     * タイトル
     */
    @NotBlank
    @Size(min = 1, max = 200)
    private String title;
    /**
     * 内容
     */
    @NotBlank
    @Size(min = 1, max = 1000)
    private String content;
    /**
     * カテゴリ
     */
    @NotBlank
    @Pattern(regexp = "^(重要|システム|一般)$")
    private String category;
}
