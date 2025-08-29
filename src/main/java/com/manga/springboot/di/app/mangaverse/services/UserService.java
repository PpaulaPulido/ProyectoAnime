package com.manga.springboot.di.app.mangaverse.services;

import com.manga.springboot.di.app.mangaverse.dto.request.UserRegistrationDTO;
import com.manga.springboot.di.app.mangaverse.models.User;
import com.manga.springboot.di.app.mangaverse.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).+$";

    @Transactional
    public User registerUser(UserRegistrationDTO registrationDTO) {
        validateUserExists(registrationDTO);
        validatePasswordMatch(registrationDTO);
        validatePasswordStrength(registrationDTO.getPassword());

        String encryptedPassword = passwordEncoder.encode(registrationDTO.getPassword());

        User user = new User(
                registrationDTO.getUsername(),
                registrationDTO.getEmail(),
                encryptedPassword);

        return userRepository.save(user);
    }

    private void validateUserExists(UserRegistrationDTO registrationDTO) {
        if (userRepository.existsByUsername(registrationDTO.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        if (userRepository.existsByEmail(registrationDTO.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
    }

    private void validatePasswordMatch(UserRegistrationDTO registrationDTO) {
        if (!registrationDTO.getPassword().equals(registrationDTO.getConfirmPassword())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }
    }

    private void validatePasswordStrength(String password) {
        if (!Pattern.matches(PASSWORD_PATTERN, password)) {
            throw new RuntimeException("La contraseña debe contener al menos una mayúscula y un carácter especial");
        }
    }

    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean isPasswordStrong(String password) {
        return Pattern.matches(PASSWORD_PATTERN, password);
    }
}