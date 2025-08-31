// ===== FUNCIONES DE FAVORITOS =====
export function toggleFavorite(button) {
    const icon = button.querySelector('i');
    const id = button.dataset.id;
    const type = button.dataset.type;

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const exists = favorites.find(f => f.id == id && f.type == type);

    if (!exists) {
        favorites.push({ id, type, addedAt: new Date().toISOString() });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        button.classList.add('favorited');
        icon.classList.remove('far');
        icon.classList.add('fas');
        showNotification('Agregado a favoritos', 'success');
    } else {
        const filtered = favorites.filter(f => !(f.id == id && f.type == type));
        localStorage.setItem('favorites', JSON.stringify(filtered));
        button.classList.remove('favorited');
        icon.classList.remove('fas');
        icon.classList.add('far');
        showNotification('Eliminado de favoritos', 'info');
    }
}

export function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

export function isFavorite(id, type) {
    const favorites = getFavorites();
    return favorites.some(f => f.id == id && f.type == type);
}

export function removeFavorite(id, type) {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => !(f.id == id && f.type == type));
    localStorage.setItem('favorites', JSON.stringify(filtered));
}

// ===== FUNCIONES DE NOTIFICACIONES =====
export function showNotification(msg, type = 'success', duration = 2000) {
    // Eliminar notificaciones existentes
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.textContent = msg;
    document.body.appendChild(n);

    // Animación de entrada
    n.animate([
        { opacity: 0, transform: 'translateX(100%) scale(0.9)' },
        { opacity: 1, transform: 'translateX(0) scale(1)' }
    ], {
        duration: 400,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    });

    // Remover después del tiempo especificado
    setTimeout(() => {
        n.animate([
            { opacity: 1, transform: 'translateX(0) scale(1)' },
            { opacity: 0, transform: 'translateX(100%) scale(0.9)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
            fill: 'forwards'
        }).onfinish = () => n.remove();
    }, duration);
}

// ===== FUNCIONES DE TARJETAS =====
export function createMediaCard(media, type) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'listitem');
    card.dataset.id = media.id ?? media.mal_id ?? '';
    card.dataset.type = type;

    const title = escapeHtml(media.title || media.name || 'Sin título');
    const shortTitle = escapeHtmlShort(title, 30);
    const img = media.imageUrl || media.images?.jpg?.image_url || media.image_url || `/img/placeholder-${type}.jpg`;
    const score = media.score ?? media.rating ?? 'N/A';
    const year = formatDate(media);

    card.innerHTML = `
        <div class="card-image">
            <img loading="lazy" src="${img}" alt="${title}" 
                 onerror="this.src='/img/placeholder-${type}.jpg'">
            <div class="card-overlay">
                <h4 title="${title}">${shortTitle}</h4>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${score}</span>
                </div>
                ${year ? `<div class="year">${year}</div>` : ''}
                <button class="btn-favorite" data-id="${card.dataset.id}" data-type="${type}" 
                        aria-label="Añadir a favoritos">
                    <i class="far fa-heart" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    `;

    // Si ya es favorito, marcarlo
    if (isFavorite(card.dataset.id, type)) {
        const heartIcon = card.querySelector('.btn-favorite i');
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        card.querySelector('.btn-favorite').classList.add('favorited');
    }

    return card;
}

export function renderCarouselItems(list, container, type) {
    container.innerHTML = '';
    list.forEach(item => {
        const card = createMediaCard(item, type);
        container.appendChild(card);
    });
}

// ===== FUNCIONES DE NAVEGACIÓN =====
export function viewDetails(id, type) {
    if (!id) return;
    window.location.href = `/${type}/details?id=${encodeURIComponent(id)}`;
}

export function navigateTo(url) {
    window.location.href = url;
}

// ===== FUNCIONES DE VALIDACIÓN =====
export function isValidId(id) {
    return id && !isNaN(parseInt(id)) && parseInt(id) > 0;
}

export function isValidType(type) {
    return ['anime', 'manga'].includes(type);
}

// ===== FUNCIONES DE FORMATO =====
export function formatDate(media) {
    if (!media) return '';

    if (media.year) {
        return media.year.toString();
    }

    if (media.aired?.prop?.from?.year) {
        return media.aired.prop.from.year.toString();
    }

    if (media.published?.prop?.from?.year) {
        return media.published.prop.from.year.toString();
    }

    return '';
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function escapeHtmlShort(text, maxLength) {
    if (!text) return '';

    const escaped = escapeHtml(text);
    return escaped.length > maxLength
        ? escaped.substring(0, maxLength) + '...'
        : escaped;
}

// ===== FUNCIONES DE EVENTOS =====
export function setupEventDelegation(container = document) {
    container.addEventListener('click', (e) => {
        const fav = e.target.closest('.btn-favorite');
        if (fav) {
            toggleFavorite(fav);
            return;
        }

        const card = e.target.closest('.card');
        // if (card && !e.target.closest('.btn-favorite')) {
        //     viewDetails(card.dataset.id, card.dataset.type);
        // }
    });
}

// ===== FUNCIONES DE ANIMACIÓN =====
export function animateElement(element, animationType = 'fadeIn') {
    const animations = {
        fadeIn: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ],
        slideInLeft: [
            { opacity: 0, transform: 'translateX(-50px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ],
        slideInRight: [
            { opacity: 0, transform: 'translateX(50px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ]
    };

    const animation = animations[animationType] || animations.fadeIn;

    return element.animate(animation, {
        duration: 800,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

export default {
    // Favoritos
    toggleFavorite,
    getFavorites,
    isFavorite,
    removeFavorite,

    // Notificaciones
    showNotification,

    // Tarjetas
    createMediaCard,
    renderCarouselItems,

    // Navegación
    viewDetails,
    navigateTo,

    // Validación
    isValidId,
    isValidType,

    // Formato
    formatDate,
    escapeHtml,
    escapeHtmlShort,

    // Eventos
    setupEventDelegation,

    // Animación
    animateElement
};