package com.manga.springboot.di.app.mangaverse.services;

import com.manga.springboot.di.app.mangaverse.models.Favorite;
import com.manga.springboot.di.app.mangaverse.models.User;
import com.manga.springboot.di.app.mangaverse.repositories.FavoriteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FavoriteService {
    
    @Autowired
    private FavoriteRepository favoriteRepository;
    
    public List<Favorite> getUserFavorites(User user) {
        return favoriteRepository.findByUserOrderByAddedAtDesc(user);
    }
    
    public List<Favorite> getUserFavoritesByType(User user, String contentType) {
        return favoriteRepository.findByUserAndContentTypeOrderByAddedAtDesc(user, contentType);
    }
    
    public boolean isFavorite(User user, String contentId, String contentType) {
        return favoriteRepository.existsByUserAndContentIdAndContentType(user, contentId, contentType);
    }
    
    @Transactional
    public Favorite addFavorite(User user, String contentId, String contentType, 
                               String title, String imageUrl, Double score, Integer year) {
        
        // Verificar si ya existe
        Optional<Favorite> existing = favoriteRepository.findByUserAndContentIdAndContentType(user, contentId, contentType);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Crear nuevo favorito
        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setContentId(contentId);
        favorite.setContentType(contentType);
        favorite.setTitle(title);
        favorite.setImageUrl(imageUrl);
        favorite.setScore(score);
        favorite.setYear(year);
        
        return favoriteRepository.save(favorite);
    }
    
    @Transactional
    public void removeFavorite(User user, String contentId, String contentType) {
        favoriteRepository.deleteByUserAndContentIdAndContentType(user, contentId, contentType);
    }
    
    @Transactional
    public void toggleFavorite(User user, String contentId, String contentType,
                              String title, String imageUrl, Double score, Integer year) {
        
        if (isFavorite(user, contentId, contentType)) {
            removeFavorite(user, contentId, contentType);
        } else {
            addFavorite(user, contentId, contentType, title, imageUrl, score, year);
        }
    }
    
    public Long countUserFavorites(User user) {
        return favoriteRepository.countByUser(user);
    }
    
    public Long countUserFavoritesByType(User user, String contentType) {
        return favoriteRepository.countByUserAndContentType(user, contentType);
    }
    
}