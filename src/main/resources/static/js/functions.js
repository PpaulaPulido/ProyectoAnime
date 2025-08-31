
// swalHelper para mostrar alertas personalizadas
export function showAlert({ icon = 'info', title = '', html = '', draggable = false, confirmButtonText = 'Aceptar' }) {
    let confirmButtonClass = 'btn-orange';
    let popupClass = 'border-orange';
    let iconClass = 'icon-swal-orange';

    if (icon === 'success') {
        confirmButtonClass = 'btn-green';
        popupClass = 'border-green';
        iconClass = 'icon-swal-green';
    } else if (icon === 'error' || icon === 'warning') {
        confirmButtonClass = 'btn-red';
        popupClass = 'border-red';
        iconClass = 'icon-swal';
    } else if (icon === 'question') {
        confirmButtonClass = 'btn-orange';
        popupClass = 'border-orange';
        iconClass = 'icon-swal-orange';
    }

    return Swal.fire({
        icon,
        title: `<span class="title-swal">${title}</span>`,
        html: `<div class="div-swal">${html}</div>`,
        showConfirmButton: true,
        confirmButtonText: confirmButtonText,
        customClass: {
            confirmButton: confirmButtonClass,
            popup: popupClass,
            title: 'title-swal',
            icon: iconClass,
            htmlContainer: 'div-swal'
        },
        buttonsStyling: false,
        background: 'var(--cr-bg)',
        color: 'var(--cr-text-primary)',
        draggable
    });
}

// crear animaciones que se activan al hacer scroll
export function initScrollAnimations(selectors = [], options = {}) {
    const config = { threshold: 0.2, rootMargin: "0px 0px -50px 0px", ...options };
    const animationObserver = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                if (!entry.target.dataset.repeatAnimation) {
                    observerInstance.unobserve(entry.target);
                }
            } else if (entry.target.dataset.repeatAnimation) {
                entry.target.classList.remove("visible");
            }
        });
    }, config);

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            animationObserver.observe(el);
        });
    });

    return animationObserver;
}

// Utilidades para formateo y manipulación del DOM
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, "&#39;");
}

export function escapeHtmlShort(str, max = 40) {
    const s = escapeHtml(str || '');
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
}

export function formatDate(obj) {
    try {
        const y = obj.year || obj['year'];
        if (y) return `${y}`;
        const d = new Date(obj);
        if (isNaN(d)) return '';
        return d.toLocaleDateString();
    } catch (e) { return ''; }
}

export function setupScrollers() {
    // popular
    const popularRow = document.getElementById('popularRow');
    const popularPrev = document.getElementById('popularPrev');
    const popularNext = document.getElementById('popularNext');

    if (popularRow && popularPrev && popularNext) {
        makeScrollable(popularRow, popularPrev, popularNext, 3000);
    }

    // latest
    const latestRow = document.getElementById('latestRow');
    const latestPrev = document.getElementById('latestPrev');
    const latestNext = document.getElementById('latestNext');

    if (latestRow && latestPrev && latestNext) {
        makeScrollable(latestRow, latestPrev, latestNext, 3200);
    }
}

// Función auxiliar para añadir event listeners passive
function addPassiveEventListener(element, eventName, handler) {
    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function () { supportsPassive = true; }
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
    } catch (e) { }

    element.addEventListener(eventName, handler, supportsPassive ? { passive: true } : false);
}

export function makeScrollable(container, leftBtn, rightBtn, autoMs = 3000) {
    if (!container) return;
    let timer = null;
    let paused = false;
    const step = Math.max(220, Math.floor(container.clientWidth * 0.7));

    function start() {
        stop();
        timer = setInterval(() => {
            if (paused) return;
            // si llegamos al final, volver al inicio
            if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: step, behavior: 'smooth' });
            }
        }, autoMs);
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    leftBtn.addEventListener('click', () => {
        stop();
        container.scrollBy({ left: -step, behavior: 'smooth' });
        start();
    });

    rightBtn.addEventListener('click', () => {
        stop();
        container.scrollBy({ left: step, behavior: 'smooth' });
        start();
    });

    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { paused = false; });

    // Usar event listeners passive para eventos táctiles
    addPassiveEventListener(container, 'touchstart', () => { paused = true; });
    addPassiveEventListener(container, 'touchend', () => { paused = false; });

    start();
}

export function setupAnimations() {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    // celebration sides
    const left = document.getElementById('celebrateLeft');
    const right = document.getElementById('celebrateRight');
    if (left) io.observe(left);
    if (right) io.observe(right);

    // tambien observar los elementos que contienen la img en .sobre-img-wrapper
    document.querySelectorAll('.sobre-img-wrapper').forEach(n => io.observe(n));
}


//Verificar estado de login
 export function checkLoginStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('loginSuccess');
    const logoutSuccess = urlParams.get('logout');

    if (loginSuccess === 'true') {
        showAlert({
            icon: 'success',
            title: '¡Sesión Iniciada!',
            html: 'Has iniciado sesión correctamente. ¡Bienvenido de nuevo!',
            draggable: true
        }).then(() => {
            // Limpiar el parámetro de la URL sin recargar
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        });
    }

    if (logoutSuccess === 'true') {
        showAlert({
            icon: 'info',
            title: 'Sesión Cerrada',
            html: 'Has cerrado sesión correctamente. ¡Hasta pronto!',
            draggable: true
        }).then(() => {
            // Limpiar el parámetro de la URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        });
    }

    // Configurar logout para el enlace (no botón)
    const logoutLink = document.getElementById('logoutBtn');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir la navegación normal

            showAlert({
                icon: 'question',
                title: 'Cerrar sesión',
                html: '¿Estás seguro de que quieres cerrar sesión?',
                draggable: true,
                confirmButtonText: 'Sí, cerrar sesión'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Redirigir al logout de Spring Security
                    window.location.href = '/auth/logout';
                }
            });
        });
    }
}
