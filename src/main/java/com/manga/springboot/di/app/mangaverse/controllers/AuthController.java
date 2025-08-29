package com.manga.springboot.di.app.mangaverse.controllers;

import com.manga.springboot.di.app.mangaverse.dto.request.LoginRequestDTO;
import com.manga.springboot.di.app.mangaverse.dto.request.UserRegistrationDTO;
import com.manga.springboot.di.app.mangaverse.models.User;
import com.manga.springboot.di.app.mangaverse.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new UserRegistrationDTO());
        return "auth/register";
    }

    @PostMapping("/register")
    public String registerUser(@Valid @ModelAttribute("user") UserRegistrationDTO registrationDTO,
            BindingResult result, Model model) {

        if (result.hasErrors()) {
            return "auth/register";
        }

        try {
            User user = userService.registerUser(registrationDTO);
            model.addAttribute("message", "¡Registro exitoso! Bienvenido " + user.getUsername());
            return "auth/login";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "auth/register";
        }
    }

    @GetMapping("/login")
    public String showLoginForm(
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model) {

        if (error != null) {
            model.addAttribute("error", "Email o contraseña incorrectos");
        }

        if (logout != null) {
            model.addAttribute("message", "Has cerrado sesión exitosamente");
        }

        model.addAttribute("loginRequest", new LoginRequestDTO());
        return "auth/login";
    }

}