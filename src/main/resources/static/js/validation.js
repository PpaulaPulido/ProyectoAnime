// swalHelper para mostrar alertas personalizadas
export function showAlert({ icon = 'info', title = '', html = '', draggable = false }) {
    let confirmButtonClass = 'btn-red';
    let popupClass = 'border-red';
    let iconClass = 'icon-swal';

    if (icon === 'success') {
        confirmButtonClass = 'btn-green';
        popupClass = 'border-green';
        iconClass = 'icon-swal-green';
    }

    return Swal.fire({
        icon,
        title: `<span class="title-swal">${title}</span>`,
        html: `<div class="div-swal">${html}</div>`,
        showConfirmButton: true,
        confirmButtonText: 'Aceptar',
        customClass: {
            confirmButton: confirmButtonClass,
            popup: popupClass,
            title: 'title-swal',
            icon: iconClass,
            htmlContainer: 'div-swal'
        },
        buttonsStyling: false,
        background: '#ffffff',
        draggable
    });
}

// Control para el campo de confirmación de contraseña
export function setupPasswordToggle(buttonId, inputId) {
    const toggleButton = document.getElementById(buttonId);
    const passwordInput = document.getElementById(inputId);

    // Verificamos que los elementos existan antes de agregar el listener
    if (!toggleButton || !passwordInput) {
        console.error(`Error: No se encontró el botón con ID '${buttonId}' o el campo con ID '${inputId}'.`);
        return;
    }

    toggleButton.addEventListener("click", function () {
        const isPassword = passwordInput.type === "password";

        // Buscar los iconos dentro del botón actual
        const eyeOpen = this.querySelector('.eye-open');
        const eyeClosed = this.querySelector('.eye-closed');

        passwordInput.type = isPassword ? "text" : "password";

        if (eyeOpen && eyeClosed) {
            eyeOpen.style.display = isPassword ? "none" : "block";
            eyeClosed.style.display = isPassword ? "block" : "none";
        }

        toggleButton.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
}

// Función para mostrar errores debajo del campo
export function showError(input, message) {
    if (!input) return;

    // Obtener el contenedor del formulario
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    // Buscar o crear el span de error
    let errorSpan = formGroup.querySelector('.error-message');

    if (!errorSpan) {
        errorSpan = document.createElement("span");
        errorSpan.className = "error-message";
        formGroup.appendChild(errorSpan);
    }

    // Mostrar el mensaje de error
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
    errorSpan.style.opacity = '1';

    // Marcar el campo como inválido
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
}

// Función para ocultar errores
export function hideError(input) {
    if (!input) return;

    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    const errorSpan = formGroup.querySelector('.error-message');
    if (errorSpan) {
        errorSpan.textContent = "";
        errorSpan.style.display = 'none';
        errorSpan.style.opacity = '0';
    }

    // Quitar clases de error y marcar como válido si tiene valor
    input.classList.remove("is-invalid");
    if (input.value.length > 0) {
        input.classList.add("is-valid");
    }
}

// Función para ocultar todos los errores
export function hideAllErrors(form) {
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        hideError(input);
        input.classList.remove("is-invalid");
    });

    // También ocultar todos los mensajes de error
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.textContent = "";
        msg.style.display = 'none';
    });
}

// Función para limpiar todos los errores (más completa)
export function clearAllErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.textContent = "";
        msg.style.display = 'none';
        msg.style.opacity = '0';
    });

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.classList.remove("is-invalid");
        input.classList.remove("is-valid");
    });
}

// Función para validar email con todas las reglas
export function validateEmail(email) {
    if (!email) return false;

    // Validar formato básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    const [localPart, domain] = email.split('@');

    // Validar local part
    if (localPart.length < 3) return false;

    // Validar caracteres repetidos consecutivos (más de 2)
    const repeatingChars = /(.)\1\1/;
    if (repeatingChars.test(localPart)) return false;

    // Validar dominios permitidos
    const validDomains = ['.com', '.co', '.net', '.org', '.edu', '.gov', '.io', '.info', '.biz'];
    const hasValidDomain = validDomains.some(dom => domain.endsWith(dom));
    if (!hasValidDomain) return false;

    // Validar estructura del dominio
    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) return false;

    // Validar caracteres válidos
    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) return false;

    // Validar puntos y guiones
    if (localPart.startsWith('.') || localPart.startsWith('-') ||
        localPart.endsWith('.') || localPart.endsWith('-')) return false;

    if (localPart.includes('..')) return false;

    return true;
}

// Función para obtener mensaje de error específico del email
export function getEmailErrorMessage(email) {
    if (!email) return 'El email es requerido';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Formato de email inválido';

    const [localPart, domain] = email.split('@');

    if (localPart.length < 3) return 'El email debe tener al menos 3 caracteres antes del @';

    const repeatingChars = /(.)\1\1/;
    if (repeatingChars.test(localPart)) return 'No puede tener caracteres repetidos consecutivos';

    const validDomains = ['.com', '.co', '.net', '.org', '.edu', '.gov', '.io'];
    const hasValidDomain = validDomains.some(dom => domain.endsWith(dom));
    if (!hasValidDomain) return 'Dominio no válido. Use: .com, .co, .net, .org';

    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
        return 'Dominio incompleto';
    }

    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) return 'Caracteres no válidos en el email';

    if (localPart.startsWith('.') || localPart.startsWith('-') ||
        localPart.endsWith('.') || localPart.endsWith('-')) {
        return 'No puede empezar o terminar con . o -';
    }

    if (localPart.includes('..')) return 'No puede tener puntos consecutivos';

    return null; // No hay error
}
// Agrega estas funciones para validación de username:

export function validateUsername(username) {
    if (!username) return false;

    // Longitud
    if (username.length < 3 || username.length > 20) return false;

    // Caracteres permitidos
    const validRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validRegex.test(username)) return false;

    // No más de 2 caracteres repetidos consecutivos
    const repeatingChars = /(.)\1\1/;
    if (repeatingChars.test(username)) return false;

    // No secuencias de teclado comunes o patrones aleatorios
    if (hasKeyboardSequences(username)) return false;

    // No muchos caracteres consecutivos sin vocales (para evitar "kfdhgkfdgfduvn")
    if (hasNoVowelsSequence(username)) return false;

    // No patrones repetitivos
    if (hasRepetitivePatterns(username)) return false;

    // No muchos caracteres especiales seguidos
    if (hasSpecialCharsSequence(username)) return false;

    return true;
}

export function getUsernameErrorMessage(username) {
    if (!username) return 'El nombre de usuario es requerido';

    if (username.length < 3) return 'Debe tener al menos 3 caracteres';
    if (username.length > 20) return 'No puede tener más de 20 caracteres';

    const validRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validRegex.test(username)) return 'Solo letras, números, guiones y guiones bajos';

    const repeatingChars = /(.)\1\1/;
    if (repeatingChars.test(username)) return 'No puede tener caracteres repetidos consecutivos';

    if (hasKeyboardSequences(username)) return 'Patrón de teclado muy obvio';

    if (hasNoVowelsSequence(username)) return 'Demasiadas consonantes seguidas sin vocales';

    if (hasRepetitivePatterns(username)) return 'Patrón repetitivo detectado';

    if (hasSpecialCharsSequence(username)) return 'Demasiados caracteres especiales seguidos';

    return null;
}

// Funciones auxiliares para detección de patrones incoherentes
function hasKeyboardSequences(text) {
    const keyboardSequences = [
        'qwerty', 'asdfgh', 'zxcvbn', '123456',
        'qwer', 'asdf', 'zxcv', '1234', '5678',
        'poiu', 'lkjh', 'mnbv'
    ];

    const lowerText = text.toLowerCase();
    return keyboardSequences.some(seq => lowerText.includes(seq));
}

function hasNoVowelsSequence(text) {
    const vowels = 'aeiouAEIOU';
    let consonantCount = 0;
    let maxConsonants = 4; // Máximo de consonantes seguidas permitidas

    for (let char of text) {
        if (vowels.includes(char)) {
            consonantCount = 0;
        } else if (/[a-zA-Z]/.test(char)) {
            consonantCount++;
            if (consonantCount > maxConsonants) {
                return true;
            }
        } else {
            consonantCount = 0; // Reset para caracteres no alfabéticos
        }
    }

    return false;
}

function hasRepetitivePatterns(text) {
    // Patrones como "abcabc", "1212", etc.
    if (text.length < 4) return false;

    for (let i = 2; i <= Math.floor(text.length / 2); i++) {
        const pattern = text.substring(0, i);
        const rest = text.substring(i);

        if (rest.startsWith(pattern)) {
            return true;
        }
    }

    return false;
}

function hasSpecialCharsSequence(text) {
    const specialChars = '_-';
    let specialCount = 0;
    let maxSpecial = 2; // Máximo de caracteres especiales consecutivos

    for (let char of text) {
        if (specialChars.includes(char)) {
            specialCount++;
            if (specialCount > maxSpecial) {
                return true;
            }
        } else {
            specialCount = 0;
        }
    }

    return false;
}