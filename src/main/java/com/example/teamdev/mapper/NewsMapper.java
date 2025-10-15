package com.example.teamdev.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import com.example.teamdev.entity.News;

/**
 * お知らせ情報Mapper
 * <p>
 * データベーステーブル: news
 * </p>
 * <p>
 * 注意: snake_case (DB) → camelCase (Java Entity) マッピングを@Results で定義
 * </p>
 */
@Mapper
public interface NewsMapper {

	/**
	 * カラムマッピング定義
	 * <p>
	 * DB: snake_case → Java Entity: camelCase
	 * </p>
	 */
	@Results(id = "newsResultMap", value = {
		@Result(property = "id", column = "id"),
		@Result(property = "newsDate", column = "news_date"),
		@Result(property = "content", column = "content"),
		@Result(property = "releaseFlag", column = "release_flag"),
		@Result(property = "updateDate", column = "update_date")
	})
	@Select("SELECT * FROM news WHERE id = #{id}")
	Optional<News> getById(@Param("id") Integer id);

	/**
	 * 公開フラグTRUEのレコードをすべて、お知らせ日付の降順で取得
	 *
	 * @return 公開お知らせリスト
	 */
	@Results(id = "newsResultMapList")
	@Select("SELECT * FROM news WHERE release_flag = TRUE ORDER BY news_date DESC")
	List<News> getNewsByReleaseFlagTrue();

	/**
	 * 公開フラグTRUEのレコードを指定件数まで、お知らせ日付の降順で取得
	 *
	 * @param limit 取得件数
	 * @return 公開お知らせリスト（上限件数）
	 */
	@Results(id = "newsResultMapLimitList")
	@Select("SELECT * FROM news WHERE release_flag = TRUE ORDER BY news_date DESC LIMIT #{limit}")
	List<News> getNewsByReleaseFlagTrueWithLimit(@Param("limit") int limit);

	/**
	 * すべてのお知らせを日付の降順で取得
	 *
	 * @return お知らせリスト
	 */
	@Results(id = "newsResultMapAllList")
	@Select("SELECT * FROM news ORDER BY news_date DESC")
	List<News> getNewsOrderByNewsDateDesc();

	/**
	 * お知らせを挿入
	 * <p>
	 * XMLマッパーで定義（src/main/resources/com/example/teamdev/mapper/NewsMapper.xml）
	 * </p>
	 *
	 * @param news お知らせエンティティ
	 * @return 挿入件数
	 */
	int save(News news);

	/**
	 * 指定IDのお知らせを削除
	 *
	 * @param id お知らせID
	 * @return 削除件数
	 */
	@Delete("DELETE FROM news WHERE id = #{id}")
	int deleteById(@Param("id") Integer id);

	/**
	 * お知らせを更新
	 * <p>
	 * XMLマッパーで定義（src/main/resources/com/example/teamdev/mapper/NewsMapper.xml）
	 * </p>
	 *
	 * @param entity お知らせエンティティ
	 * @return 更新件数
	 */
	int upDate(News entity);
}
