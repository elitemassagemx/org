// systems/cache.js
import CONFIG from '../config/config.js';

export const CacheSystem = {
    cache: new Map(),
    
    set(key, value, ttl = CONFIG.CACHE_DURATION) {
        const item = {
            value,
            expiry: Date.now() + ttl,
            accessed: 0,
            created: Date.now()
        };
        
        this.cache.set(key, item);
        this.maintainCacheSize();
        
        // También guardar en localStorage para persistencia
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (error) {
            console.warn('LocalStorage not available:', error);
        }
    },

    get(key) {
        // Intentar obtener de la memoria primero
        let item = this.cache.get(key);
        
        // Si no está en memoria, intentar obtener de localStorage
        if (!item) {
            try {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    item = JSON.parse(stored);
                    this.cache.set(key, item);
                }
            } catch (error) {
                console.warn('Error reading from localStorage:', error);
            }
        }

        if (!item) return null;

        // Verificar expiración
        if (Date.now() > item.expiry) {
            this.remove(key);
            return null;
        }

        item.accessed++;
        return item.value;
    },

    remove(key) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (error) {
            console.warn('Error removing from localStorage:', error);
        }
    },

    clear() {
        this.cache.clear();
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith('cache_'))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Error clearing localStorage:', error);
        }
    },

    maintainCacheSize(maxSize = 100) {
        if (this.cache.size > maxSize) {
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].accessed - b[1].accessed);
            
            for (let i = 0; i < entries.length - maxSize; i++) {
                this.remove(entries[i][0]);
            }
        }
    },

    getStats() {
        return {
            memorySize: this.cache.size,
            items: Array.from(this.cache.entries()).map(([key, item]) => ({
                key,
                accessed: item.accessed,
                age: Date.now() - item.created
            }))
        };
    }
};
