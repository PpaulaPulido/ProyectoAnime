import { showNotification, viewDetails } from './mediaUtils.js';
import {
    checkLoginStatus
} from './functions.js';

document.addEventListener('DOMContentLoaded', function () {
    setupFavoriteEvents();
    checkLoginStatus();
});

function setupFavoriteEvents() {
    // Eliminar favoritos
    document.addEventListener('click', async function (e) {
        // Para eliminar favoritos
        if (e.target.closest('.btn-remove-favorite')) {
            const button = e.target.closest('.btn-remove-favorite');
            const contentId = button.dataset.contentId;
            const contentType = button.dataset.contentType;

            await removeFavorite(contentId, contentType);
        }

        // Para ver detalles
        if (e.target.closest('.btn-view-details')) {
            const button = e.target.closest('.btn-view-details');
            const contentId = button.dataset.contentId;
            const contentType = button.dataset.contentType;

            viewDetails(contentId, contentType);
        }
    });
}

async function removeFavorite(contentId, contentType) {
    try {
        const response = await fetch(`/user/favorites/remove?contentId=${contentId}&contentType=${contentType}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            const items = document.querySelectorAll('.favorite-item');
            let itemToRemove = null;

            items.forEach(item => {
                const removeBtn = item.querySelector('.btn-remove-favorite');
                if (removeBtn &&
                    removeBtn.dataset.contentId === contentId &&
                    removeBtn.dataset.contentType === contentType) {
                    itemToRemove = item;
                }
            });

            if (itemToRemove) {
                itemToRemove.remove();
                showNotification('Eliminado de favoritos', 'success');

                // Actualizar contador
                updateFavoritesCount();
            }
        } else {
            showNotification('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

function updateFavoritesCount() {
    const count = document.querySelectorAll('.favorite-item').length;
    const countElement = document.querySelector('.favorites-header p');

    if (countElement) {
        countElement.textContent = `Total: ${count} items`;
    }

    // Si no hay favoritos, mostrar estado vacío
    if (count === 0) {
        const grid = document.querySelector('.favorites-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No tienes favoritos aún</h3>
                    <p>Agrega algunos animes o mangas a tus favoritos para verlos aquí.</p>
                    <a href="/user/dashboard" class="btn btn-primary">Explorar Contenido</a>
                </div>
            `;
        }
    }
}

//Manejar la actualización del contador desde el servidor
async function refreshFavoritesList() {
    try {
        // Recargar la página para obtener los favoritos actualizados
        window.location.reload();
    } catch (error) {
        console.error('Error refreshing favorites:', error);
    }
}