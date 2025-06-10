/**
 * 2024/03/20 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.example.teamdev.entity.News;

/**
 * @author n.yasunari
 * お知らせ情報テーブル：news
 */
@Mapper
public interface NewsMapper {
	//公開フラグtrueのレコードをすべて、お知らせ日付の降順で取得する
	@Select("SELECT * FROM news WHERE release_flag = true ORDER BY news_date DESC")
	List<News> getNewsByReleaseFlagTrue();
	
	//お知らせ日付の降順で取得する
	@Select("SELECT * FROM news ORDER BY news_date DESC")
	List<News> getNewsOrderByNewsDateDesc();
	
	//指定のidで1レコードを取得する
	@Select("SELECT * FROM news WHERE id = #{id}")
	Optional<News> getById(@Param("id") Integer id);
	
	//データを挿入する
	int save(News news);
	
	@Delete("DELETE FROM news WHERE id = #{id}")
	int deleteById(@Param("id") Integer id);
	
	// データを更新する（2025/4/18 山本追記）
	int upDate(News entity);
}
