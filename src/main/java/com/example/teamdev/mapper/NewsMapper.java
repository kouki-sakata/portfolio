package com.example.teamdev.mapper;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
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
	@ResultMap("newsResultMap")
	@Select("SELECT * FROM news WHERE release_flag = TRUE ORDER BY news_date DESC")
	List<News> getNewsByReleaseFlagTrue();

	/**
	 * 公開フラグTRUEのレコードを指定件数まで、お知らせ日付の降順で取得
	 *
	 * @param limit 取得件数
	 * @return 公開お知らせリスト（上限件数）
	 */
	@ResultMap("newsResultMap")
	@Select("SELECT * FROM news WHERE release_flag = TRUE ORDER BY news_date DESC LIMIT #{limit}")
	List<News> getNewsByReleaseFlagTrueWithLimit(@Param("limit") int limit);

	/**
	 * すべてのお知らせを日付の降順で取得
	 *
	 * @return お知らせリスト
	 */
	@ResultMap("newsResultMap")
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

	/**
	 * 複数のお知らせを一括削除
	 *
	 * @param ids お知らせIDリスト
	 * @return 削除件数
	 */
	@Delete({
		"<script>",
		"DELETE FROM news WHERE id IN",
		"<foreach collection='ids' item='id' open='(' separator=',' close=')'>",
		"#{id}",
		"</foreach>",
		"</script>"
	})
	int deleteByIds(@Param("ids") List<Integer> ids);

	/**
	 * 指定されたIDリストのうち、実際に存在するIDのみを返す
	 *
	 * @param ids チェック対象のIDリスト
	 * @return 存在するIDのリスト
	 */
	@Select({
		"<script>",
		"SELECT id FROM news WHERE id IN",
		"<foreach collection='ids' item='id' open='(' separator=',' close=')'>",
		"#{id}",
		"</foreach>",
		"</script>"
	})
	List<Integer> findExistingIds(@Param("ids") List<Integer> ids);

	/**
	 * 複数のお知らせの公開フラグを一括更新
	 * <p>
	 * XMLマッパーで定義（src/main/resources/com/example/teamdev/mapper/NewsMapper.xml）
	 * </p>
	 *
	 * @param ids お知らせIDリスト
	 * @param releaseFlag 公開フラグ
	 * @param updateDate 更新日時
	 * @return 更新件数
	 */
	int bulkUpdateReleaseFlag(
		@Param("ids") List<Integer> ids,
		@Param("releaseFlag") Boolean releaseFlag,
		@Param("updateDate") Timestamp updateDate
	);

	/**
	 * 複数のお知らせの公開フラグを個別に一括更新（異なるフラグ値）
	 * <p>
	 * XMLマッパーで定義（src/main/resources/com/example/teamdev/mapper/NewsMapper.xml）
	 * </p>
	 *
	 * @param items 更新アイテムリスト
	 * @param updateDate 更新日時
	 * @return 更新件数
	 */
	int bulkUpdateReleaseFlagIndividual(
		@Param("items") List<NewsBulkPublishRequest.NewsPublishItem> items,
		@Param("updateDate") Timestamp updateDate
	);
}
