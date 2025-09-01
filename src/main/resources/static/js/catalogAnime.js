// catalogAnime.js
import {
    getCatalogSections,
    getAnimeByGenre,
    POPULAR_GENRES
} from './datosApiJikan.js';

import {
    createMediaCard,
    setupEventDelegation,
    showNotification
} from './mediaUtils.js';

import { checkLoginStatus } from './functions.js';

// Estado global del catálogo
let catalogState = {
    currentGenre: 'acción',
    filters: {
        genre: '',
        type: '',
        status: ''
    },
    isLoading: false,
    currentSection: 'catalog' 
};

// Mapeo de géneros para la API
const genreMapping = {
    'acción': 1,
    'aventura': 2,
    'comedia': 4,
    'drama': 8,
    'fantasía': 10,
    'romance': 22,
    'shounen': 27,
    'escolar': 23,
    'ciencia ficción': 24,
    'slice of life': 36, 
    'sobrenatural': 37,
    'terror': 14,
    'misterio': 7,
    'deportes': 30
};

// Mapeo de tipos (español -> parámetro API)
const typeMapping = {
    'tv': 'tv',
    'película': 'movie',
    'ova': 'ova',
    'especial': 'special'
};

// Mapeo de estados (español -> parámetro API)
const statusMapping = {
    'en emisión': 'airing',
    'completado': 'complete',
    'próximamente': 'upcoming'
};

document.addEventListener('DOMContentLoaded', async () => {
    checkLoginStatus();
    setupEventDelegation();
    setupFilterListeners();
    populateGenreFilter();
    await loadCatalogContent();
});

// Llenar el filtro de géneros
function populateGenreFilter() {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter) return;

    // Limpiar opciones excepto la primera
    while (genreFilter.options.length > 1) {
        genreFilter.remove(1);
    }

    // Agregar géneros populares en español
    const genresInSpanish = [
        {id: 1, name: 'Acción'},
        {id: 2, name: 'Aventura'},
        {id: 4, name: 'Comedia'},
        {id: 8, name: 'Drama'},
        {id: 10, name: 'Fantasía'},
        {id: 22, name: 'Romance'},
        {id: 27, name: 'Shounen'},
        {id: 23, name: 'Escolar'},
        {id: 24, name: 'Ciencia Ficción'},
        {id: 36, name: 'Slice of Life'},
        {id: 37, name: 'Sobrenatural'},
        {id: 14, name: 'Terror'},
        {id: 7, name: 'Misterio'},
        {id: 30, name: 'Deportes'}
    ];

    genresInSpanish.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });
}

// Configurar listeners para los filtros
function setupFilterListeners() {
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');

    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

// Aplicar filtros
async function applyFilters() {
    if (catalogState.isLoading) return;

    catalogState.isLoading = true;

    // Obtener valores de los filtros
    const genreFilter = document.getElementById('genreFilter');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');

    catalogState.filters = {
        genre: genreFilter ? genreFilter.value : '',
        type: typeFilter ? typeFilter.value : '',
        status: statusFilter ? statusFilter.value : ''
    };

    // Ocultar secciones del catálogo y mostrar resultados de filtros
    document.querySelectorAll('.catalog-section').forEach(section => {
        section.style.display = 'none';
    });

    // Crear o mostrar sección de resultados filtrados
    let resultsSection = document.getElementById('filteredResults');
    if (!resultsSection) {
        resultsSection = document.createElement('section');
        resultsSection.id = 'filteredResults';
        resultsSection.className = 'catalog-section';
        resultsSection.innerHTML = `
            <h2><i class="fas fa-filter"></i> Resultados Filtrados</h2>
            <div class="anime-grid" id="filteredGrid"></div>
        `;
        document.querySelector('.catalog-sections').appendChild(resultsSection);
    } else {
        resultsSection.style.display = 'block';
    }

    const resultsGrid = document.getElementById('filteredGrid');
    resultsGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';

    try {
        // Construir URL de la API con los filtros
        let apiUrl = 'https://api.jikan.moe/v4/anime?';
        const params = [];

        if (catalogState.filters.genre) {
            params.push(`genres=${catalogState.filters.genre}`);
        }

        if (catalogState.filters.type) {
            // Convertir tipo a parámetro de API
            const typeParam = typeMapping[catalogState.filters.type] || catalogState.filters.type;
            params.push(`type=${typeParam}`);
        }

        if (catalogState.filters.status) {
            // Convertir estado a parámetro de API
            const statusParam = statusMapping[catalogState.filters.status] || catalogState.filters.status;
            params.push(`status=${statusParam}`);
        }

        // Ordenar por popularidad por defecto
        params.push('order_by=popularity');
        params.push('sort=desc');

        // Limitar a 20 resultados
        params.push('limit=20');

        apiUrl += params.join('&');
        console.log('API URL:', apiUrl); // Para debugging

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            await renderAnimeList(resultsGrid, data.data, 'anime');
        } else {
            resultsGrid.innerHTML = '<div class="no-results">No se encontraron resultados con estos filtros.</div>';
        }

    } catch (error) {
        console.error('Error applying filters:', error);
        resultsGrid.innerHTML = '<div class="error">Error al aplicar filtros. Intenta nuevamente.</div>';
        showNotification('Error al aplicar filtros', 'error');
    } finally {
        catalogState.isLoading = false;
    }
}

// Limpiar filtros
function clearFilters() {
    const genreFilter = document.getElementById('genreFilter');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (genreFilter) genreFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    // Ocultar resultados filtrados y mostrar catálogo normal
    const filteredSection = document.getElementById('filteredResults');
    if (filteredSection) {
        filteredSection.style.display = 'none';
    }

    document.querySelectorAll('.catalog-section').forEach(section => {
        section.style.display = 'block';
    });
}

// Cargar contenido inicial del catálogo
async function loadCatalogContent() {
    try {
        showLoadingStates();

        // Cargar todas las secciones en paralelo
        const { trending, popular, upcoming, favorites } = await getCatalogSections();

        // Renderizar cada sección
        await renderSection('trendingGrid', trending, 'anime');
        await renderSection('popularGrid', popular, 'anime');
        await renderSection('upcomingGrid', upcoming, 'anime');

    } catch (error) {
        console.error('Error loading catalog content:', error);
        showNotification('Error al cargar el catálogo', 'error');
        showFallbackContent();
    }
}

// Renderizar una sección del catálogo
async function renderSection(sectionId, animeList, type) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    if (animeList && animeList.length > 0) {
        await renderAnimeList(container, animeList, type);
    } else {
        container.innerHTML = '<div class="no-results">No se encontraron resultados.</div>';
    }
}

// Renderizar lista de animes
async function renderAnimeList(container, animeList, type) {
    container.innerHTML = '';

    // Crear todas las tarjetas
    for (const anime of animeList) {
        try {
            const card = await createMediaCard(anime, type);
            container.appendChild(card);
        } catch (error) {
            console.error('Error creating media card:', error);
        }
    }

    // Si no hay elementos, mostrar mensaje
    if (container.children.length === 0) {
        container.innerHTML = '<div class="no-results">No se encontraron resultados.</div>';
    }
}

// Mostrar estados de carga
function showLoadingStates() {
    const sections = ['trendingGrid', 'popularGrid', 'upcomingGrid'];

    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (container) {
            container.innerHTML = '<div class="loading">Cargando...</div>';
        }
    });
}

// Mostrar contenido de respaldo en caso de error
function showFallbackContent() {
    const fallbackAnime = [
        { id: 1, title: "Cyber Guardians", score: "9.1", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Completed", episodes: 12, year: "2023" },
        { id: 2, title: "Samurai Requiem", score: "8.8", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Ongoing", episodes: 24, year: "2024" },
        { id: 3, title: "Stellar Mecha", score: "8.9", imageUrl: "/img/placeholder-anime.jpg", type: "Movie", status: "Completed", episodes: 1, year: "2023" },
        { id: 4, title: "Dragon Lore", score: "9.0", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Completed", episodes: 36, year: "2022" }
    ];

    const sections = ['trendingGrid', 'popularGrid', 'upcomingGrid'];

    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (container) {
            renderAnimeList(container, fallbackAnime, 'anime');
        }
    });
}