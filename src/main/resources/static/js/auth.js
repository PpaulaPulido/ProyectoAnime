import {
    showAlert,
    setupPasswordToggle,
    showError,
    hideError,
    hideAllErrors,
    clearAllErrors,
    getEmailErrorMessage,
    getUsernameErrorMessage
} from './validation.js';

document.addEventListener('DOMContentLoaded', function () {
    // Limpiar todos los errores al cargar la página
    clearAllErrors();

    // Configurar toggles de contraseña
    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Validación en tiempo real del username
    if (usernameInput) {
        usernameInput.addEventListener('input', function () {
            validateUsernameRealTime(this.value);
        });

        usernameInput.addEventListener('blur', function () {
            validateUsernameRealTime(this.value);
        });

        usernameInput.addEventListener('focus', function () {
            hideError(usernameInput);
        });
    }

    // Validación en tiempo real del email
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            validateEmailRealTime(this.value);
        });

        emailInput.addEventListener('blur', function () {
            validateEmailRealTime(this.value);
        });

        emailInput.addEventListener('focus', function () {
            hideError(emailInput);
        });
    }

    // Validación en tiempo real de la contraseña
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            validatePasswordRealTime(this.value);
            // Si hay confirmación, validarla también
            if (confirmPasswordInput.value.length > 0) {
                validateConfirmPasswordRealTime(confirmPasswordInput.value, this.value);
            }
        });

        passwordInput.addEventListener('blur', function () {
            validatePasswordRealTime(this.value);
        });

        passwordInput.addEventListener('focus', function () {
            hideError(passwordInput);
        });
    }

    // Validación en tiempo real de confirmación de contraseña
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            validateConfirmPasswordRealTime(this.value, passwordInput.value);
        });

        confirmPasswordInput.addEventListener('blur', function () {
            validateConfirmPasswordRealTime(this.value, passwordInput.value);
        });

        confirmPasswordInput.addEventListener('focus', function () {
            hideError(confirmPasswordInput);
        });
    }

    // Validación del formulario al enviar
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Ocultar errores anteriores
            hideAllErrors(registerForm);

            let isValid = true;
            const errors = [];

            // Validar username
            if (!validateUsernameRealTime(usernameInput.value)) {
                isValid = false;
                errors.push('Nombre de usuario inválido');
            }

            // Validar email
            if (!validateEmailRealTime(emailInput.value)) {
                isValid = false;
                errors.push('Email inválido');
            }

            // Validar contraseña
            if (!validatePasswordRealTime(passwordInput.value)) {
                isValid = false;
                errors.push('Contraseña inválida');
            }

            // Validar confirmación de contraseña
            if (!validateConfirmPasswordRealTime(confirmPasswordInput.value, passwordInput.value)) {
                isValid = false;
                errors.push('Las contraseñas no coinciden');
            }

            if (!isValid) {
                showAlert({
                    icon: 'error',
                    title: 'Error de validación',
                    html: errors.join('<br>'),
                    draggable: false
                });
                return;
            }
            this.submit();
        });
    }

    // Mostrar mensajes del servidor con SweetAlert
    setTimeout(() => {
        const errorMessage = document.querySelector('.error-message-container');
        const successMessage = document.querySelector('.success-message-container');

        if (errorMessage && errorMessage.textContent.trim()) {
            showAlert({
                icon: 'error',
                title: 'Error',
                html: errorMessage.textContent,
                draggable: false
            });
            errorMessage.style.display = 'none';
        }

        if (successMessage && successMessage.textContent.trim()) {
            showAlert({
                icon: 'success',
                title: 'Éxito',
                html: successMessage.textContent,
                draggable: false
            });
            successMessage.style.display = 'none';
        }
    }, 100);

    // Función para validar username en tiempo real
    function validateUsernameRealTime(username) {
        if (username.length === 0) {
            hideError(usernameInput);
            return true;
        }

        const errorMessage = getUsernameErrorMessage(username);

        if (errorMessage) {
            showError(usernameInput, errorMessage);
            return false;
        }

        hideError(usernameInput);
        return true;
    }

    // Función para validar email en tiempo real
    function validateEmailRealTime(email) {
        if (email.length === 0) {
            hideError(emailInput);
            return true;
        }

        const errorMessage = getEmailErrorMessage(email);

        if (errorMessage) {
            showError(emailInput, errorMessage);
            return false;
        }

        hideError(emailInput);
        return true;
    }

    function validateConfirmPasswordRealTime(confirmPassword, password) {
        if (confirmPassword.length === 0) {
            hideError(confirmPasswordInput);
            return true;
        }

        const errorMessage = getConfirmPasswordErrorMessage(confirmPassword, password);

        if (errorMessage) {
            showError(confirmPasswordInput, errorMessage);
            return false;
        }

        hideError(confirmPasswordInput);
        return true;
    }

    // Función para validar contraseña en tiempo real
    function validatePasswordRealTime(password) {
        if (password.length === 0) {
            hideError(passwordInput);
            return true;
        }

        if (password.length < 6) {
            showError(passwordInput, 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        // Validar fortaleza de contraseña
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
        if (!strongPasswordRegex.test(password)) {
            showError(passwordInput, 'Debe contener al menos una mayúscula y un carácter especial');
            return false;
        }

        hideError(passwordInput);
        return true;
    }

    // Función para validar confirmación de contraseña en tiempo real
    function validateConfirmPasswordRealTime(confirmPassword, password) {
        if (confirmPassword.length === 0) {
            hideError(confirmPasswordInput);
            return true;
        }

        if (confirmPassword !== password) {
            showError(confirmPasswordInput, 'Las contraseñas no coinciden');
            return false;
        }

        hideError(confirmPasswordInput);
        return true;
    }

    window.addEventListener('beforeunload', function () {
        clearAllErrors();
    });
});