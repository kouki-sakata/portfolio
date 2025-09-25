package com.example.teamdev.dto.api.home;

public record HomeNewsItem(
    Integer id,
    String content,
    String newsDate,
    boolean released
) {
}
