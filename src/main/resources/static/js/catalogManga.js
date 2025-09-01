// catalogManga.js
import {
    getCatalogMangaSections,
    getMangaByGenre,
    searchManga,
    POPULAR_MANGA_GENRES
} from './datosApiJikan.js';

import {
    createMediaCard,
    setupEventDelegation,
    showNotification
} from './mediaUtils.js';

import { checkLoginStatus } from './functions.js';

// Estado global del catálogo
let catalogState = {
    filters: {
        genre: '',
        type: '',
        status: ''
    },
    isLoading: false,
    currentSection: 'catalog' 
};

// Mapeo de tipos de manga (español -> parámetro API)
const typeMapping = {
    'manga': 'manga',
    'novel': 'novel',
    'manhwa': 'manhwa',
    'manhua': 'manhua',
    'one_shot': 'one_shot'
};

// Mapeo de estados (español -> parámetro API)
const statusMapping = {
    'publicándose': 'publishing',
    'completado': 'complete',
    'en hiatus': 'hiatus',
    'descontinuado': 'discontinued'
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

    // Agregar géneros populares en español para manga
    POPULAR_MANGA_GENRES.forEach(genre => {
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
            <div class="manga-grid" id="filteredGrid"></div>
        `;
        document.querySelector('.catalog-sections').appendChild(resultsSection);
    } else {
        resultsSection.style.display = 'block';
    }

    const resultsGrid = document.getElementById('filteredGrid');
    resultsGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';

    try {
        // Construir URL de la API con los filtros
        let apiUrl = 'https://api.jikan.moe/v4/manga?';
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
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            await renderMangaList(resultsGrid, data.data, 'manga');
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
        const { trending, popular, newReleases, favorites } = await getCatalogMangaSections();

        // Renderizar cada sección
        await renderSection('trendingGrid', trending, 'manga');
        await renderSection('popularGrid', popular, 'manga');
        await renderSection('newReleasesGrid', newReleases, 'manga');

    } catch (error) {
        console.error('Error loading catalog content:', error);
        showNotification('Error al cargar el catálogo', 'error');
        showFallbackContent();
    }
}

// Renderizar una sección del catálogo
async function renderSection(sectionId, mangaList, type) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    if (mangaList && mangaList.length > 0) {
        await renderMangaList(container, mangaList, type);
    } else {
        container.innerHTML = '<div class="no-results">No se encontraron resultados.</div>';
    }
}

// Renderizar lista de mangas
async function renderMangaList(container, mangaList, type) {
    container.innerHTML = '';

    // Crear todas las tarjetas
    for (const manga of mangaList) {
        try {
            const card = await createMediaCard(manga, type);
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
    const sections = ['trendingGrid', 'popularGrid', 'newReleasesGrid'];

    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (container) {
            container.innerHTML = '<div class="loading">Cargando...</div>';
        }
    });
}

// Mostrar contenido de respaldo en caso de error
function showFallbackContent() {
    const fallbackManga = [
        { 
            id: 1, 
            title: "Shadow Ink", 
            score: "9.3", 
            imageUrl: "/img/placeholder-manga.jpg", 
            type: "Manga", 
            status: "Ongoing", 
            chapters: 87, 
            year: "2021",
            synopsis: "Una emocionante historia de misterio y aventuras.",
            genres: ["Misterio", "Aventura"],
            authors: ["Autor Desconocido"]
        },
        { 
            id: 2, 
            title: "Hearts in Pages", 
            score: "8.7", 
            imageUrl: "/img/placeholder-manga.jpg", 
            type: "Manhwa", 
            status: "Completed", 
            chapters: 124, 
            year: "2020",
            synopsis: "Una conmovedora historia de romance y drama.",
            genres: ["Romance", "Drama"],
            authors: ["Autor Desconocido"]
        },
        { 
            id: 3, 
            title: "Mythweaver", 
            score: "9.0", 
            imageUrl: "/img/placeholder-manga.jpg", 
            type: "Manga", 
            status: "Ongoing", 
            chapters: 56, 
            year: "2022",
            synopsis: "Un épico viaje de fantasía y magia.",
            genres: ["Fantasía", "Aventura"],
            authors: ["Autor Desconocido"]
        },
        { 
            id: 4, 
            title: "Noir Casebook", 
            score: "8.9", 
            imageUrl: "/img/placeholder-manga.jpg", 
            type: "Light Novel", 
            status: "Completed", 
            chapters: 24, 
            year: "2019",
            synopsis: "Intrigantes casos detectivescos en un ambiente noir.",
            genres: ["Misterio", "Suspenso"],
            authors: ["Autor Desconocido"]
        }
    ];

    const sections = ['trendingGrid', 'popularGrid', 'newReleasesGrid'];

    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (container) {
            renderMangaList(container, fallbackManga, 'manga');
        }
    });
}