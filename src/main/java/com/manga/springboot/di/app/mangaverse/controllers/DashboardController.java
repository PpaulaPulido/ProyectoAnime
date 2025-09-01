package com.manga.springboot.di.app.mangaverse.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.manga.springboot.di.app.mangaverse.models.User;
import com.manga.springboot.di.app.mangaverse.repositories.UserRepository;

@Controller
@RequestMapping("/user")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    public String dashboard(Model model, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            model.addAttribute("username", user.getUsername());
        } else {
            model.addAttribute("username", "Usuario");
        }
        return "dashboard";
    }

    @GetMapping("/home")
    public String showHome() {
        return "redirect:/dashboard";
    }

    @GetMapping("/catalogAnime")
    public String catalogAnime(Model model, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            model.addAttribute("username", user.getUsername());
        } else {
            model.addAttribute("username", "Usuario");
        }

        return "catalogAnime";
    }

    @GetMapping("/catalogManga")
    public String catalogManga(Model model, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            model.addAttribute("username", user.getUsername());
        } else {
            model.addAttribute("username", "Usuario");
        }

        return "catalogManga";
    }
}