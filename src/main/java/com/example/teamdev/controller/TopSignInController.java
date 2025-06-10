package com.example.teamdev.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TopSignInController {
	@GetMapping("/")
	public String topSignInController(
			Model model) {
		model.addAttribute("msg", "Welcome");
		return "signin/signin";
	}

}
