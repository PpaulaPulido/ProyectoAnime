import {
    safeImage,
    getTopMangas,
    getLatestMangas,
    getTopAnime
} from './datosApiJikan.js';

import {
    escapeHtml,
    escapeHtmlShort,
    formatDate,
    setupScrollers,
    setupAnimations
} from './functions.js';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    init();

    // Configuración del Intersection Observer para animaciones
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                // Deja de observar si no necesita repetirse
                if (!entry.target.dataset.repeatAnimation) {
                    observerInstance.unobserve(entry.target);
                }
            } else if (entry.target.dataset.repeatAnimation) {
                // Si sale del viewport y la animación debe repetirse
                entry.target.classList.remove("visible");
            }
        });
    }, observerOptions);

    // Observar elementos principales
    const elementsToObserve = [
        ".about-image-wrapper",
        ".about-text-wrapper",
        ".scroll-animate",
        ".rank-item.hidden"
    ];

    elementsToObserve.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });
    });

    // Configuración del carrusel con validación
    const carouselElement = document.getElementById('carouselExampleCaptions');
    if (carouselElement) {
        // Verificar si Bootstrap está disponible
        if (typeof bootstrap !== 'undefined' && bootstrap.Carousel) {
            const carousel = new bootstrap.Carousel(carouselElement, {
                interval: 4000,
                ride: 'carousel',
                wrap: true,
                touch: true // Habilitar desplazamiento táctil
            });

            // Pausar el carrusel cuando el usuario interactúa con él
            carouselElement.addEventListener('mouseenter', () => {
                carousel.pause();
            });

            carouselElement.addEventListener('mouseleave', () => {
                carousel.cycle();
            });
        } else {
            console.warn('Bootstrap no está cargado. El carrusel no funcionará correctamente.');
        }
    }

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
        }, 100);
    });

    // Manejo de errores
    window.addEventListener('error', (e) => {
        console.error('Error capturado:', e.error);
    });
});

async function init() {
    try {
        await Promise.all([
            loadPopularMangas(),
            loadLatestMangas(),
            loadRanking()
        ]);
        setupScrollers();
        setupAnimations();
    } catch (err) {
        console.error('Error inicializando la página:', err);
    }
}

/* ---------------------- POPULARES ---------------------- */
let popularData = [];
async function loadPopularMangas() {
    try {
        popularData = await getTopMangas(12);
        const row = document.getElementById('popularRow');

        if (!row) {
            console.error('Elemento popularRow no encontrado');
            return;
        }

        row.innerHTML = popularData.map(m => {
            const img = safeImage(m);
            const title = m.title || 'Sin título';
            const type = m.type || '';
            const score = m.score ? m.score.toFixed(1) : '—';
            return `
        <div class="card-manga">
          <img src="${img}" alt="${escapeHtml(title)}" loading="lazy">
          <div class="manga-meta">
            <div class="manga-title">${escapeHtmlShort(title, 36)}</div>
            <div class="manga-sub">${escapeHtml(type)} • <strong>${score}</strong></div>
          </div>
        </div>
      `;
        }).join('');

        // si queremos una imagen de fondo transparente en alguna sección, usar la primera portada
        if (popularData[1]) {
            const bgSection = document.querySelector('.bg-section');
            if (bgSection) {
                const img = safeImage(popularData[1]);
                // añadir como fondo ligero (se verá por el overlay)
                bgSection.style.backgroundImage = `linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.45)), url('${img}')`;
                bgSection.style.backgroundSize = 'cover';
                bgSection.style.backgroundPosition = 'center';
            }
        }
    } catch (e) {
        console.error('Error cargando populares', e);
        const row = document.getElementById('popularRow');
        if (row) {
            row.innerHTML = '<div class="text-muted p-3">No se pudieron cargar mangas populares.</div>';
        }
    }
}

/* ---------------------- ÚLTIMOS LANZAMIENTOS ---------------------- */
let latestData = [];
async function loadLatestMangas() {
    try {
        // ordenados por start_date descendente
        latestData = await getLatestMangas(12);
        const row = document.getElementById('latestRow');

        if (!row) {
            console.error('Elemento latestRow no encontrado');
            return;
        }

        row.innerHTML = latestData.map(m => {
            const img = safeImage(m);
            const title = m.title || 'Sin título';
            // mostrar capítulo o fecha si llega
            const start = m.published && m.published.prop && m.published.prop.from ? formatDate(m.published.prop.from) : '';
            return `
        <div class="card-manga">
          <img src="${img}" alt="${escapeHtml(title)}" loading="lazy">
          <div class="manga-meta">
            <div class="manga-title">${escapeHtmlShort(title, 36)}</div>
            <div class="manga-sub">${start || ''}</div>
          </div>
        </div>
      `;
        }).join('');

        // set images for celebrate side
        const leftImg = safeImage(latestData[0] || popularData[0]);
        const rightImg = safeImage(popularData[2] || latestData[1]);

        const celebrateLeftImg = document.getElementById('celebrateLeftImg');
        const celebrateRightImg = document.getElementById('celebrateRightImg');
        const aboutImage = document.getElementById('aboutImage');

        if (celebrateLeftImg) celebrateLeftImg.src = leftImg;
        if (celebrateRightImg) celebrateRightImg.src = rightImg;

    } catch (e) {
        console.error('Error cargando últimos lanzamientos', e);
        const row = document.getElementById('latestRow');
        if (row) {
            row.innerHTML = '<div class="text-muted p-3">No se pudieron cargar los últimos lanzamientos.</div>';
        }
    }
}

/* ---------------------- RANKING ---------------------- */
async function loadRanking() {
    try {
        const [animeData, mangaData] = await Promise.all([
            getTopAnime(5),
            getTopMangas(5)
        ]);

        const topAnimesList = document.getElementById('topAnimes');
        const topMangasList = document.getElementById('topMangas');

        if (topAnimesList) {
            topAnimesList.innerHTML = animeData.map(a => {
                const img = safeImage(a);
                const title = a.title || '—';
                const score = a.score ? a.score.toFixed(1) : '—';
                return `
                    <li class="rank-item hidden">
                        <img src="${img}" alt="${escapeHtml(title)}" class="rank-thumb">
                        <div class="rank-info">
                            <div class="title">${escapeHtmlShort(title, 38)}</div>
                            <div class="type">${escapeHtml(a.type || '')}</div>
                        </div>
                        <div class="score">${score}</div>
                    </li>
                `;
            }).join('');
        }

        if (topMangasList) {
            topMangasList.innerHTML = mangaData.map(m => {
                const img = safeImage(m);
                const title = m.title || '—';
                const score = m.score ? m.score.toFixed(1) : '—';
                return `
                    <li class="rank-item hidden">
                        <img src="${img}" alt="${escapeHtml(title)}" class="rank-thumb">
                        <div class="rank-info">
                            <div class="title">${escapeHtmlShort(title, 38)}</div>
                            <div class="type">${escapeHtml(m.type || '')}</div>
                        </div>
                        <div class="score">${score}</div>
                    </li>
                `;
            }).join('');
        }

        // Animación con IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.rank-item.hidden').forEach(item => {
            observer.observe(item);
        });

    } catch (e) {
        console.error('Error cargando ranking', e);
        const topAnimesList = document.getElementById('topAnimes');
        const topMangasList = document.getElementById('topMangas');

        if (topAnimesList) topAnimesList.innerHTML = '<li class="rank-item">No disponible</li>';
        if (topMangasList) topMangasList.innerHTML = '<li class="rank-item">No disponible</li>';
    }
}
