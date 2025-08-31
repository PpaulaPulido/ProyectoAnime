package com.manga.springboot.di.app.mangaverse.controllers;

import com.manga.springboot.di.app.mangaverse.models.User;
import com.manga.springboot.di.app.mangaverse.services.FavoriteService;
import com.manga.springboot.di.app.mangaverse.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/user/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @Autowired
    private UserService userService;

    @GetMapping
    public String favoritesPage(Model model, Authentication authentication) {
        String email = authentication.getName();
        System.out.println("Email autenticado: " + email);

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        System.out.println("Usuario: " + user.getUsername());
        System.out.println("Favoritos: " + favoriteService.getUserFavorites(user).size());

        model.addAttribute("favorites", favoriteService.getUserFavorites(user));
        model.addAttribute("totalFavorites", favoriteService.countUserFavorites(user));
        model.addAttribute("username", user.getUsername());

        return "favorites";
    }

    // API para agregar/quitar favorito
    @PostMapping("/toggle")
    @ResponseBody
    public Map<String, Object> toggleFavorite(@RequestBody Map<String, Object> request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String contentId = (String) request.get("contentId");
            String contentType = (String) request.get("contentType");
            String title = (String) request.get("title");
            String imageUrl = (String) request.get("imageUrl");
            Double score = request.get("score") != null ? Double.parseDouble(request.get("score").toString()) : 0.0;
            Integer year = request.get("year") != null ? Integer.parseInt(request.get("year").toString()) : 0;

            favoriteService.toggleFavorite(user, contentId, contentType, title, imageUrl, score, year);

            boolean isNowFavorite = favoriteService.isFavorite(user, contentId, contentType);

            response.put("success", true);
            response.put("isFavorite", isNowFavorite);
            response.put("message", isNowFavorite ? "Agregado a favoritos" : "Eliminado de favoritos");

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al procesar la solicitud: " + e.getMessage());
        }

        return response;
    }

    // API para eliminar favorito
    @DeleteMapping("/remove")
    @ResponseBody
    public Map<String, Object> removeFavorite(@RequestParam String contentId,
            @RequestParam String contentType,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            favoriteService.removeFavorite(user, contentId, contentType);
            response.put("success", true);
            response.put("message", "Eliminado de favoritos");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar de favoritos: " + e.getMessage());
        }

        return response;
    }

    // API para verificar si es favorito
    @GetMapping("/check")
    @ResponseBody
    public Map<String, Object> checkFavorite(
            @RequestParam String contentId,
            @RequestParam String contentType,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("isFavorite", false);
                response.put("message", "Usuario no autenticado");
                return response;
            }

            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            boolean isFavorite = favoriteService.isFavorite(user, contentId, contentType);

            response.put("success", true);
            response.put("isFavorite", isFavorite);

        } catch (Exception e) {
            response.put("success", false);
            response.put("isFavorite", false);
            response.put("message", "Error del servidor: " + e.getMessage());
        }

        return response;
    }
}