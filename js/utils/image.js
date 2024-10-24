// utils/image.js
import CONFIG from '../config/config.js';
import { Logger } from './logger.js';

export const ImageUtils = {
    loadingImages: new Map(),
    failedImages: new Set(),
    imageCache: new Map(),

    async loadImage(url, retryCount = 2) {
        // Verificar si la imagen ya está cargando
        if (this.loadingImages.has(url)) {
            return this.loadingImages.get(url);
        }

        // Crear nueva promesa de carga
        const loadPromise = new Promise(async (resolve, reject) => {
            let attempts = 0;
            
            const attemptLoad = () => {
                const img = new Image();
                
                img.onload = () => {
                    this.loadingImages.delete(url);
                    this.failedImages.delete(url);
                    resolve(img);
                };

                img.onerror = async () => {
                    attempts++;
                    if (attempts < retryCount) {
                        Logger.warn(`Retrying image load: ${url}, attempt ${attempts + 1}`);
                        setTimeout(attemptLoad, 1000 * attempts); // Retraso exponencial
                    } else {
                        Logger.error(`Failed to load image after ${retryCount} attempts: ${url}`);
                        this.failedImages.add(url);
                        this.loadingImages.delete(url);
                        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
                        resolve(img);
                    }
                };

                img.src = url;
            };

            attemptLoad();
        });

        this.loadingImages.set(url, loadPromise);
        return loadPromise;
    },

    handleImageError(img) {
        img.onerror = null;
        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
        Logger.warn(`Image load failed: ${img.src}`);
    },

    buildImageUrl(iconPath) {
        if (!iconPath) return CONFIG.DEFAULT_ERROR_IMAGE;
        return iconPath.startsWith('http') ? iconPath : `${CONFIG.BASE_URL}${iconPath}`;
    },

    async preloadImages(urls) {
        const results = await Promise.allSettled(urls.map(url => this.loadImage(url)));
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                Logger.warn(`Failed to preload image: ${urls[index]}`);
            }
        });

        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    },

    async getCachedImage(url) {
        if (this.imageCache.has(url)) {
            return this.imageCache.get(url);
        }

        const img = await this.loadImage(url);
        this.imageCache.set(url, img);
        return img;
    },

    clearImageCache() {
        this.imageCache.clear();
        Logger.debug('Image cache cleared');
    }
};
