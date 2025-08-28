const API_BASE = 'https://api.jikan.moe/v4';
const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;
const placeholder = 'https://via.placeholder.com/250x350?text=No+Image';

// Cache simple para evitar peticiones duplicadas
const requestCache = new Map();

export async function fetchWithRetry(url, retries = MAX_RETRIES) {
    // Verificar si tenemos una respuesta en caché
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
        // Almacenar en caché por 1 minuto
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

export function safeImage(obj) {
    if (!obj) return placeholder;
    if (obj.images && obj.images.jpg) return obj.images.jpg.large_image_url || obj.images.jpg.image_url || placeholder;
    if (obj.image_url) return obj.image_url;
    return placeholder;
}

export async function getTopMangas(limit = 12) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/top/manga?limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching top mangas:', error);
        return [];
    }
}

export async function getLatestMangas(limit = 12) {
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