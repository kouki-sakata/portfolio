package com.example.teamdev.form;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ListForm(共通)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListForm {
	/**
	 * idlist
	 */
	private List<String> idList;
	/**
	 * 変更情報
	 */
	private List<Map<String,String>> editList;
}
