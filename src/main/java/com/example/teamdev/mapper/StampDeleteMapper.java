package com.example.teamdev.mapper;

import com.example.teamdev.entity.StampDelete;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StampDeleteMapper {

    /**
     * 指定した年月範囲の打刻記録を削除する
     *
     * @return 削除された件数
     */
    int deleteStampsByYearMonthRange(StampDelete stampDelete);
}
