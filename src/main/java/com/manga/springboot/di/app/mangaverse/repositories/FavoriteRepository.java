package com.manga.springboot.di.app.mangaverse.repositories;

import com.manga.springboot.di.app.mangaverse.models.Favorite;
import com.manga.springboot.di.app.mangaverse.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    
    List<Favorite> findByUserOrderByAddedAtDesc(User user);
    
    List<Favorite> findByUserAndContentTypeOrderByAddedAtDesc(User user, String contentType);
    
    Optional<Favorite> findByUserAndContentIdAndContentType(User user, String contentId, String contentType);
    
    boolean existsByUserAndContentIdAndContentType(User user, String contentId, String contentType);
    
    void deleteByUserAndContentIdAndContentType(User user, String contentId, String contentType);
    
    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.user = :user AND f.contentType = :contentType")
    Long countByUserAndContentType(@Param("user") User user, @Param("contentType") String contentType);
}