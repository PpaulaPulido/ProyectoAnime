// dashboard.js
import { getDashboardAnime, getDashboardManga } from './datosApiJikan.js';
import {
    initScrollAnimations,
    makeScrollable,
    setupAnimations,
    showAlert,
    checkLoginStatus
} from './functions.js';
import {
    createMediaCard,
    renderCarouselItems,
    setupEventDelegation,
    showNotification,
    toggleFavorite,
    formatDate,
    escapeHtml,
    escapeHtmlShort
} from './mediaUtils.js';

// Estado global para los carruseles
const carouselInstances = new Map();

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadTrendingContent();
    animateWelcomeSection();
    setupEventDelegation();
    setupScrollAnimations();
    setupCarouselInteractions();
});


// Configurar animaciones al hacer scroll
function setupScrollAnimations() {
    initScrollAnimations([
        '.welcome-section',
        '.trending-category',
        '.continue-section'
    ], { threshold: 0.15 });
}

// Configurar interacciones de carruseles
function setupCarouselInteractions() {
    document.querySelectorAll('.carousel-container').forEach(container => {
        const carousel = container.querySelector('.carousel');
        const prevBtn = container.querySelector('.carousel-btn-prev');
        const nextBtn = container.querySelector('.carousel-btn-next');

        if (carousel && prevBtn && nextBtn) {
            setupCarouselWithControls(carousel, prevBtn, nextBtn);
        }
    });
}

// AÑADIR ESTA FUNCIÓN QUE FALTABA
function setupCarouselWithControls(carousel, prevBtn, nextBtn) {
    const inner = carousel.querySelector('.carousel-inner');
    if (!inner) return;

    const state = {
        position: 0,
        itemWidth: 0,
        maxPosition: 0,
        autoScrollInterval: null,
        isPaused: false
    };

    function calculateDimensions() {
        const items = inner.querySelectorAll('.card');
        if (items.length === 0) return;

        const computedStyle = getComputedStyle(inner);
        const gap = parseFloat(computedStyle.gap) || 20;
        state.itemWidth = items[0].offsetWidth + gap;

        const visibleItems = Math.floor(carousel.offsetWidth / state.itemWidth);
        state.maxPosition = Math.max(0, (items.length - visibleItems) * state.itemWidth);

        state.position = Math.max(Math.min(state.position, 0), -state.maxPosition);
        updatePosition();
    }

    function updatePosition() {
        inner.style.transform = `translateX(${state.position}px)`;
    }

    function moveLeft() {
        state.position = Math.min(state.position + state.itemWidth, 0);
        updatePosition();
        resetAutoScroll();
    }

    function moveRight() {
        state.position = Math.max(state.position - state.itemWidth, -state.maxPosition);
        updatePosition();
        resetAutoScroll();
    }

    function startAutoScroll() {
        if (state.autoScrollInterval) clearInterval(state.autoScrollInterval);

        state.autoScrollInterval = setInterval(() => {
            if (state.isPaused) return;

            if (-state.position >= state.maxPosition) {
                state.position = 0;
                updatePosition();
            } else {
                moveRight();
            }
        }, 4000);
    }

    function resetAutoScroll() {
        if (state.autoScrollInterval) {
            clearInterval(state.autoScrollInterval);
            startAutoScroll();
        }
    }

    function pauseAutoScroll() {
        state.isPaused = true;
    }

    function resumeAutoScroll() {
        state.isPaused = false;
    }

    // Event listeners
    prevBtn.addEventListener('click', moveLeft);
    nextBtn.addEventListener('click', moveRight);

    carousel.addEventListener('mouseenter', pauseAutoScroll);
    carousel.addEventListener('mouseleave', resumeAutoScroll);
    carousel.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    carousel.addEventListener('touchend', resumeAutoScroll, { passive: true });

    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') moveLeft();
        if (e.key === 'ArrowRight') moveRight();
    });

    // Inicializar
    calculateDimensions();
    startAutoScroll();

    const resizeObserver = new ResizeObserver(() => {
        calculateDimensions();
        resetAutoScroll();
    });

    resizeObserver.observe(carousel);

    carouselInstances.set(carousel, {
        cleanup: () => {
            clearInterval(state.autoScrollInterval);
            resizeObserver.disconnect();
        }
    });
}

// AÑADIR ESTA FUNCIÓN QUE TAMBIÉN FALTABA
function initAutoScroll(selector) {
    const carousel = document.querySelector(selector);
    const prevBtn = carousel?.closest('.carousel-container')?.querySelector('.carousel-btn-prev');
    const nextBtn = carousel?.closest('.carousel-container')?.querySelector('.carousel-btn-next');

    if (carousel && prevBtn && nextBtn) {
        setupCarouselWithControls(carousel, prevBtn, nextBtn);
    }
}

async function loadTrendingContent() {
    await loadTrendingAnime();
    await loadTrendingManga();
    setTimeout(setupAnimations, 100);
}

async function loadTrendingAnime() {
    const container = document.querySelector('#anime-carousel .carousel-inner');
    try {
        container.innerHTML = '<div class="loading">Cargando animes...</div>';
        const list = await getDashboardAnime(10);
        if (list && list.length) {
            await renderCarouselItems(list, container, 'anime'); // ← Añadir await
            initAutoScroll('#anime-carousel');
        } else {
            await showFallbackAnime(container); // ← Añadir await
        }
    } catch (err) {
        console.error('Error loading anime:', err);
        await showFallbackAnime(container); // ← Añadir await
    }
}

async function loadTrendingManga() {
    const container = document.querySelector('#manga-carousel .carousel-inner');
    try {
        container.innerHTML = '<div class="loading">Cargando mangas...</div>';
        const list = await getDashboardManga(10);
        if (list && list.length) {
            await renderCarouselItems(list, container, 'manga'); // ← Añadir await
            initAutoScroll('#manga-carousel');
        } else {
            await showFallbackManga(container); // ← Añadir await
        }
    } catch (err) {
        console.error('Error loading manga:', err);
        await showFallbackManga(container); // ← Añadir await
    }
}

async function showFallbackAnime(container) {
    const fallback = [
        { id: 1, title: "Cyber Guardians", score: "9.1", imageUrl: "/img/placeholder-anime.jpg", year: "2023" },
        { id: 2, title: "Samurai Requiem", score: "8.8", imageUrl: "/img/placeholder-anime.jpg", year: "2024" },
        { id: 3, title: "Stellar Mecha", score: "8.9", imageUrl: "/img/placeholder-anime.jpg", year: "2023" },
        { id: 4, title: "Dragon Lore", score: "9.0", imageUrl: "/img/placeholder-anime.jpg", year: "2022" },
        { id: 5, title: "Sunny Days", score: "8.2", imageUrl: "/img/placeholder-anime.jpg", year: "2023" }
    ];
    await renderCarouselItems(fallback, container, 'anime'); // ← Añadir await
    initAutoScroll('#anime-carousel');
}


async function showFallbackManga(container) {
    const fallback = [
        { id: 1, title: "Shadow Ink", score: "9.3", imageUrl: "/img/placeholder-manga.jpg", year: "2021" },
        { id: 2, title: "Hearts in Pages", score: "8.7", imageUrl: "/img/placeholder-manga.jpg", year: "2020" },
        { id: 3, title: "Mythweaver", score: "9.0", imageUrl: "/img/placeholder-manga.jpg", year: "2022" },
        { id: 4, title: "Noir Casebook", score: "8.9", imageUrl: "/img/placeholder-manga.jpg", year: "2019" },
        { id: 5, title: "Court Legend", score: "8.4", imageUrl: "/img/placeholder-manga.jpg", year: "2023" }
    ];
    await renderCarouselItems(fallback, container, 'manga'); // ← Añadir await
    initAutoScroll('#manga-carousel');
}

function animateWelcomeSection() {
    const el = document.querySelector('.welcome-section');
    if (!el) return;

    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';

    setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    }, 300);
}

// Cleanup function
export function cleanupCarousels() {
    carouselInstances.forEach((instance, carousel) => {
        instance.cleanup();
    });
    carouselInstances.clear();
}