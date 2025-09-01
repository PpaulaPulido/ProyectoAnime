// datosApiJikan.js - API Completa para MangaVerse

const API_BASE = 'https://api.jikan.moe/v4';
const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;
const requestCache = new Map();

// ===== FUNCIONES BASE DE API =====
async function fetchWithRetry(url, retries = MAX_RETRIES) {
    if (requestCache.has(url)) {
        return requestCache.get(url);
    }

    try {
        const response = await fetch(url);

        if (response.status === 429 && retries > 0) {
            console.log(`Demasiadas peticiones. Reintentando en ${RETRY_DELAY / 1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, retries - 1);
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        requestCache.set(url, data);
        setTimeout(() => requestCache.delete(url), 60000);

        return data;
    } catch (error) {
        if (retries > 0) {
            console.log(`Error en petición. Reintentando... (${retries} intentos restantes)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

export function safeImage(obj, type = 'anime') {
    if (!obj) return `/img/placeholder-${type}.jpg`;
    if (obj.images && obj.images.jpg) {
        return obj.images.jpg.large_image_url || obj.images.jpg.image_url || `/img/placeholder-${type}.jpg`;
    }
    if (obj.image_url) return obj.image_url;
    return `/img/placeholder-${type}.jpg`;
}

// ===== INFORMACIÓN BÁSICA (Para el Dashboard) =====
export async function getTrendingAnime(limit = 10, filter = 'airing') {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/anime?limit=${limit}&filter=${filter}`);
        const animeList = response.data || [];

        return animeList.map(anime => ({
            // Información básica
            id: anime.mal_id,
            title: anime.title,
            imageUrl: safeImage(anime, 'anime'),
            score: anime.score,
            type: anime.type,

            // Stats básicos
            rank: anime.rank,
            popularity: anime.popularity,
            members: anime.members,
            favorites: anime.favorites,

            // Estado
            status: anime.status,
            episodes: anime.episodes,
            year: anime.year || (anime.aired?.prop?.from?.year || 'N/A'),

            // Información adicional para catálogo
            synopsis: anime.synopsis,
            genres: anime.genres?.map(g => g.name) || [],
            rating: anime.rating,
            studios: anime.studios?.map(s => s.name) || []
        }));
    } catch (error) {
        console.error('Error getting trending anime:', error);
        return getFallbackAnime();
    }
}

// ===== FUNCIONES ESPECÍFICAS PARA CATÁLOGO =====

// Para el dashboard (10 items)
export async function getDashboardAnime() {
    return await getTrendingAnime(10, 'airing');
}

// Para el catálogo (20 items)
export async function getCatalogAnime() {
    return await getTrendingAnime(20, 'bypopularity');
}

// Para diferentes secciones del catálogo
export async function getCatalogSections() {
    const [trending, popular, upcoming, favorites] = await Promise.all([
        getTrendingAnime(20, 'airing'),           // En emisión
        getTrendingAnime(20, 'bypopularity'),     // Populares
        getTrendingAnime(12, 'upcoming'),         // Próximos
        getTrendingAnime(15, 'favorite')          // Favoritos
    ]);

    return { trending, popular, upcoming, favorites };
}

// Por géneros para el catálogo
export async function getAnimeByGenre(genreId, limit = 150) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime?genres=${genreId}&limit=${limit}&order_by=popularity`);
        const animeList = response.data || [];

        return animeList.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            imageUrl: safeImage(anime, 'anime'),
            score: anime.score,
            type: anime.type,
            episodes: anime.episodes,
            status: anime.status,
            year: anime.year || (anime.aired?.prop?.from?.year || 'N/A'),
            genres: anime.genres?.map(g => g.name) || [],
            synopsis: anime.synopsis
        }));
    } catch (error) {
        console.error('Error getting anime by genre:', error);
        return [];
    }
}

// Géneros populares predefinidos
export const POPULAR_GENRES = [
    { id: 1, name: 'Acción', slug: 'action' },
    { id: 2, name: 'Aventura', slug: 'adventure' },
    { id: 4, name: 'Comedia', slug: 'comedy' },
    { id: 8, name: 'Drama', slug: 'drama' },
    { id: 10, name: 'Fantasía', slug: 'fantasy' },
    { id: 22, name: 'Romance', slug: 'romance' },
    { id: 27, name: 'Shounen', slug: 'shounen' },
    { id: 23, name: 'Escolar', slug: 'school' }
];


// Obtener anime por múltiples géneros
export async function getAnimeByMultipleGenres(genreIds, limit = 15) {
    try {
        const genreString = genreIds.join(',');
        const response = await fetchWithRetry(`${API_BASE}/anime?genres=${genreString}&limit=${limit}&order_by=popularity`);
        return response.data || [];
    } catch (error) {
        console.error('Error getting anime by multiple genres:', error);
        return [];
    }
}

export async function getTrendingManga(limit = 5) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/manga?limit=${limit}`);
        const mangaList = response.data || [];

        return mangaList.map(manga => ({
            // Información básica
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,

            // Stats básicos
            rank: manga.rank,
            popularity: manga.popularity,
            members: manga.members,
            favorites: manga.favorites,

            // Estado
            status: manga.status,
            chapters: manga.chapters,
            volumes: manga.volumes,
            year: manga.year || (manga.published?.prop?.from?.year || 'N/A'),

            // Información adicional para catálogo (¡FALTABAN ESTOS!)
            synopsis: manga.synopsis,
            genres: manga.genres?.map(g => g.name) || [],
            authors: manga.authors?.map(a => a.name) || []
        }));
    } catch (error) {
        console.error('Error getting trending manga:', error);
        return getFallbackManga();
    }
}

// ===== FUNCIONES ESPECÍFICAS PARA MANGA =====
export async function getDashboardManga() {
    return await getTrendingManga(10);
}

// Para el catálogo (20 items)
export async function getCatalogManga() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/manga?limit=20`);
        const mangaList = response.data || [];

        return mangaList.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,
            chapters: manga.chapters,
            status: manga.status,
            year: manga.year || (manga.published?.prop?.from?.year || 'N/A'),
            genres: manga.genres?.map(g => g.name) || [],
            synopsis: manga.synopsis
        }));
    } catch (error) {
        console.error('Error getting catalog manga:', error);
        return getFallbackManga();
    }
}

// Para diferentes secciones del catálogo de manga
export async function getCatalogMangaSections() {
    const [trending, popular, newReleases, favorites] = await Promise.all([
        getTrendingManga(20),           // Tendencia
        getTopMangas(20),               // Populares
        getLatestMangas(12),            // Nuevos lanzamientos
        getTrendingManga(15)            // Favoritos (usamos trending como proxy)
    ]);

    return { trending, popular, newReleases, favorites };
}

// Por géneros para el catálogo de manga
export async function getMangaByGenre(genreId, limit = 150) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga?genres=${genreId}&limit=${limit}&order_by=popularity`);
        const mangaList = response.data || [];

        return mangaList.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,
            chapters: manga.chapters,
            status: manga.status,
            year: manga.year || (manga.published?.prop?.from?.year || 'N/A'),
            genres: manga.genres?.map(g => g.name) || [],
            synopsis: manga.synopsis
        }));
    } catch (error) {
        console.error('Error getting manga by genre:', error);
        return [];
    }
}

// Géneros populares predefinidos para manga
export const POPULAR_MANGA_GENRES = [
    { id: 1, name: 'Acción', slug: 'accion' },
    { id: 2, name: 'Aventura', slug: 'aventura' },
    { id: 4, name: 'Comedia', slug: 'comedia' },
    { id: 8, name: 'Drama', slug: 'drama' },
    { id: 10, name: 'Fantasía', slug: 'fantasia' },
    { id: 22, name: 'Romance', slug: 'romance' },
    { id: 27, name: 'Shounen', slug: 'shounen' },
    { id: 23, name: 'Escolar', slug: 'escolar' },
    { id: 37, name: 'Sobrenatural', slug: 'sobrenatural' },
    { id: 7, name: 'Misterio', slug: 'misterio' },
    { id: 36, name: 'Slice of Life', slug: 'slice-of-life' },
    { id: 9, name: 'Ecchi', slug: 'ecchi' },
    { id: 33, name: 'Harem', slug: 'harem' },
    { id: 24, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' },
    { id: 30, name: 'Deportes', slug: 'deportes' },
    { id: 14, name: 'Terror', slug: 'terror' },
    { id: 42, name: 'Seinen', slug: 'seinen' },
    { id: 25, name: 'Shoujo', slug: 'shoujo' },
    { id: 31, name: 'Superpoderes', slug: 'superpoderes' },
    { id: 17, name: 'Mecha', slug: 'mecha' }
];

// Obtener manga por múltiples géneros
export async function getMangaByMultipleGenres(genreIds, limit = 15) {
    try {
        const genreString = genreIds.join(',');
        const response = await fetchWithRetry(`${API_BASE}/manga?genres=${genreString}&limit=${limit}&order_by=popularity`);
        return response.data || [];
    } catch (error) {
        console.error('Error getting manga by multiple genres:', error);
        return [];
    }
}

// Obtener manga por tipo
export async function getMangaByType(type, limit = 15) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga?type=${type}&limit=${limit}&order_by=popularity`);
        const mangaList = response.data || [];

        return mangaList.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,
            chapters: manga.chapters,
            status: manga.status,
            year: manga.year || (manga.published?.prop?.from?.year || 'N/A'),
            genres: manga.genres?.map(g => g.name) || []
        }));
    } catch (error) {
        console.error(`Error getting manga by type ${type}:`, error);
        return [];
    }
}

// Obtener manga por estado
export async function getMangaByStatus(status, limit = 15) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga?status=${status}&limit=${limit}&order_by=popularity`);
        const mangaList = response.data || [];

        return mangaList.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,
            chapters: manga.chapters,
            status: manga.status,
            year: manga.year || (manga.published?.prop?.from?.year || 'N/A'),
            genres: manga.genres?.map(g => g.name) || []
        }));
    } catch (error) {
        console.error(`Error getting manga by status ${status}:`, error);
        return [];
    }
}

// ===== DETALLES DEL CONTENIDO (Para páginas de detalle) =====
export async function getAnimeDetails(animeId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime/${animeId}/full`);
        const anime = response.data;

        return {
            // INFORMACIÓN BÁSICA
            id: anime.mal_id,
            title: anime.title,
            imageUrl: safeImage(anime, 'anime'),
            score: anime.score,
            type: anime.type,

            // DETALLES DEL CONTENIDO
            episodes: anime.episodes,
            status: anime.status,
            rating: anime.rating,
            duration: anime.duration,
            source: anime.source,
            season: anime.season,
            year: anime.year,
            broadcast: anime.broadcast,

            // ESTADÍSTICAS
            rank: anime.rank,
            popularity: anime.popularity,
            members: anime.members,
            favorites: anime.favorites,

            // FECHAS
            aired: anime.aired,
            streaming: anime.streaming,

            // INFORMACIÓN DESCRIPTIVA
            synopsis: anime.synopsis,
            background: anime.background,
            trailer: anime.trailer,

            // GÉNEROS Y CATEGORÍAS
            genres: anime.genres.map(g => g.name),
            themes: anime.themes.map(t => t.name),
            demographics: anime.demographics.map(d => d.name),

            // RELACIONES
            relations: anime.relations || [],
            recommendations: anime.recommendations?.map(r => r.entry) || [],

            // PRODUCCIÓN
            studios: anime.studios.map(s => s.name),
            producers: anime.producers.map(p => p.name),
            licensors: anime.licensors.map(l => l.name),

            // PERSONAJES
            characters: anime.characters?.slice(0, 10).map(char => ({
                id: char.character.mal_id,
                name: char.character.name,
                image: char.character.images?.jpg?.image_url,
                role: char.role,
                voiceActors: char.voice_actors.map(va => ({
                    id: va.person.mal_id,
                    name: va.person.name,
                    image: va.person.images?.jpg?.image_url,
                    language: va.language
                }))
            })) || []
        };
    } catch (error) {
        console.error('Error getting anime details:', error);
        return null;
    }
}

export async function getMangaDetails(mangaId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga/${mangaId}/full`);
        const manga = response.data;

        return {
            // INFORMACIÓN BÁSICA
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,

            // DETALLES DEL CONTENIDO
            chapters: manga.chapters,
            volumes: manga.volumes,
            status: manga.status,
            published: manga.published,
            serializations: manga.serializations.map(s => s.name),

            // ESTADÍSTICAS
            rank: manga.rank,
            popularity: manga.popularity,
            members: manga.members,
            favorites: manga.favorites,

            // INFORMACIÓN DESCRIPTIVA
            synopsis: manga.synopsis,
            background: manga.background,

            // GÉNEROS Y CATEGORÍAS
            genres: manga.genres.map(g => g.name),
            themes: manga.themes.map(t => t.name),
            demographics: manga.demographics.map(d => d.name),

            // RELACIONES
            relations: manga.relations || [],
            recommendations: manga.recommendations?.map(r => r.entry) || [],

            // AUTORES
            authors: manga.authors.map(a => a.name),

            // PERSONAJES (si están disponibles)
            characters: manga.characters?.slice(0, 10).map(char => ({
                id: char.character.mal_id,
                name: char.character.name,
                image: char.character.images?.jpg?.image_url,
                role: char.role
            })) || []
        };
    } catch (error) {
        console.error('Error getting manga details:', error);
        return null;
    }
}

// ===== INFORMACIÓN DESCRIPTIVA ADICIONAL =====
export async function getAnimeStatistics(animeId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime/${animeId}/statistics`);
        return response.data;
    } catch (error) {
        console.error('Error getting anime statistics:', error);
        return null;
    }
}

export async function getMangaStatistics(mangaId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga/${mangaId}/statistics`);
        return response.data;
    } catch (error) {
        console.error('Error getting manga statistics:', error);
        return null;
    }
}

export async function getAnimeReviews(animeId, limit = 3) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime/${animeId}/reviews`);
        return response.data.slice(0, limit);
    } catch (error) {
        console.error('Error getting anime reviews:', error);
        return [];
    }
}

export async function getMangaReviews(mangaId, limit = 3) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga/${mangaId}/reviews`);
        return response.data.slice(0, limit);
    } catch (error) {
        console.error('Error getting manga reviews:', error);
        return [];
    }
}

// ===== RELACIONES Y RECOMENDACIONES =====
export async function getAnimeRelations(animeId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime/${animeId}/relations`);
        return response.data;
    } catch (error) {
        console.error('Error getting anime relations:', error);
        return [];
    }
}

export async function getMangaRelations(mangaId) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga/${mangaId}/relations`);
        return response.data;
    } catch (error) {
        console.error('Error getting manga relations:', error);
        return [];
    }
}

export async function getAnimeRecommendations(animeId, limit = 6) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime/${animeId}/recommendations`);
        return response.data.slice(0, limit);
    } catch (error) {
        console.error('Error getting anime recommendations:', error);
        return [];
    }
}

export async function getMangaRecommendations(mangaId, limit = 6) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga/${mangaId}/recommendations`);
        return response.data.slice(0, limit);
    } catch (error) {
        console.error('Error getting manga recommendations:', error);
        return [];
    }
}

// ===== BÚSQUEDA =====
export async function searchAnime(query, limit = 10) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=${limit}`);
        return response.data.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            imageUrl: safeImage(anime, 'anime'),
            score: anime.score,
            type: anime.type,
            episodes: anime.episodes,
            status: anime.status,
            year: anime.year
        }));
    } catch (error) {
        console.error('Error searching anime:', error);
        return [];
    }
}

export async function searchManga(query, limit = 10) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga?q=${encodeURIComponent(query)}&limit=${limit}`);
        return response.data.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            imageUrl: safeImage(manga, 'manga'),
            score: manga.score,
            type: manga.type,
            chapters: manga.chapters,
            status: manga.status,
            year: manga.year
        }));
    } catch (error) {
        console.error('Error searching manga:', error);
        return [];
    }
}

// ===== CONTENIDO ESTACIONAL =====
export async function getCurrentSeasonAnime(limit = 6) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/seasons/now?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error getting current season anime:', error);
        return [];
    }
}

export async function getUpcomingAnime(limit = 6) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/seasons/upcoming?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error getting upcoming anime:', error);
        return [];
    }
}

export function getFallbackAnime() {
    return [
        { id: 1, title: "Cyber Guardians", score: "9.1", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Completed", episodes: 12, year: "2023" },
        { id: 2, title: "Samurai Requiem", score: "8.8", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Ongoing", episodes: 24, year: "2024" },
        { id: 3, title: "Stellar Mecha", score: "8.9", imageUrl: "/img/placeholder-anime.jpg", type: "Movie", status: "Completed", episodes: 1, year: "2023" },
        { id: 4, title: "Dragon Lore", score: "9.0", imageUrl: "/img/placeholder-anime.jpg", type: "TV", status: "Completed", episodes: 36, year: "2022" },
        { id: 5, title: "Sunny Days", score: "8.2", imageUrl: "/img/placeholder-anime.jpg", type: "OVA", status: "Completed", episodes: 4, year: "2023" }
    ];
}

export function getFallbackManga() {
    return [
        { id: 1, title: "Shadow Ink", score: "9.3", imageUrl: "/img/placeholder-manga.jpg", type: "Manga", status: "Ongoing", chapters: 87, year: "2021" },
        { id: 2, title: "Hearts in Pages", score: "8.7", imageUrl: "/img/placeholder-manga.jpg", type: "Manhwa", status: "Completed", chapters: 124, year: "2020" },
        { id: 3, title: "Mythweaver", score: "9.0", imageUrl: "/img/placeholder-manga.jpg", type: "Manga", status: "Ongoing", chapters: 56, year: "2022" },
        { id: 4, title: "Noir Casebook", score: "8.9", imageUrl: "/img/placeholder-manga.jpg", type: "Light Novel", status: "Completed", chapters: 24, year: "2019" },
        { id: 5, title: "Court Legend", score: "8.4", imageUrl: "/img/placeholder-manga.jpg", type: "Manhua", status: "Ongoing", chapters: 42, year: "2023" }
    ];
}

export async function getTopMangas(limit = 10) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/manga?limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching top mangas:', error);
        return [];
    }
}

export async function getLatestMangas(limit = 10) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/manga?order_by=start_date&sort=desc&limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching latest mangas:', error);
        return [];
    }
}

export async function getTopAnime(limit = 5) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/anime?limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching top anime:', error);
        return [];
    }
}

// ===== EXPORTACIÓN COMPLETA =====
export default {
    // Información básica (Dashboard)
    getTrendingAnime,
    getTrendingManga,
    getCatalogAnime,
    getCatalogSections,
    getAnimeByGenre,
    getAnimeByMultipleGenres,
    getCatalogManga,
    getCatalogMangaSections,
    getMangaByGenre,
    getMangaByMultipleGenres,
    getMangaByType,
    getMangaByStatus,


    // Detalles completos (Páginas de detalle)
    getAnimeDetails,
    getMangaDetails,

    // Información descriptiva adicional
    getAnimeStatistics,
    getMangaStatistics,
    getAnimeReviews,
    getMangaReviews,

    // Relaciones y recomendaciones
    getAnimeRelations,
    getMangaRelations,
    getAnimeRecommendations,
    getMangaRecommendations,

    // Búsqueda
    searchAnime,
    searchManga,

    // Contenido estacional
    getCurrentSeasonAnime,
    getUpcomingAnime,

    getTopMangas,
    getLatestMangas,
    getTopAnime

};