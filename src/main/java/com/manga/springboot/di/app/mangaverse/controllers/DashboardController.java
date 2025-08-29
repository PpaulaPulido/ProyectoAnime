package com.manga.springboot.di.app.mangaverse.controllers;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/user")
public class DashboardController {

    @GetMapping("/dashboard")
    public String showDashboard(Authentication authentication, Model model) {
        model.addAttribute("username", authentication.getName());
        return "dashboard";
    }
    
    @GetMapping("/home")
    public String showHome() {
        return "redirect:/dashboard"; 
    }
}