package com.example.teamdev.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;


/**
 * 2025/4/21 山本作成
 */
@Controller
public class TopSignInController {
	@GetMapping("/")
	public String topSignInController(
			Model model) {
		model.addAttribute("msg", "Welcome");
		return "signin/signin";
	}

}
