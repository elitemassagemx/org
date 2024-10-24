// main.js
import { CONFIG } from './config/config.js';
import { DEPENDENCIES } from './config/dependencies.js';
import { CacheSystem } from './systems/cache.js';
import { ErrorSystem } from './systems/error.js';
import { AnalyticsSystem } from './systems/analytics.js';
import { ResponsiveSystem } from './systems/responsive.js';

import { ServicesModule } from './modules/services.js';
import { CarouselModule } from './modules/carousel.js';
import { GalleryModule } from './modules/gallery.js';
import { PopupModule } from './modules/popup.js';
import { AnimationModule } from './modules/animation.js';

class App {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
        this.systems = new Map();
    }

    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            PerformanceMonitor.startMeasure('app-initialization');

            // Inicializar sistemas core
            await this.initializeSystems();

            // Verificar dependencias críticas
            this.checkDependencies();

            // Inicializar módulos
            await this.initializeModules();

            // Configurar características globales
            this.setupGlobalFeatures();

            this.initialized = true;
            
            const duration = PerformanceMonitor.endMeasure('app-initialization');
            console.log(`App initialized in ${duration}ms`);

            AnalyticsSystem.trackEvent('App', 'initialization', 'success');
        } catch (error) {
            ErrorSystem.handleError(error, 'App initialization', {
                severity: 'high',
                userImpact: true
            });
            this.handleInitializationError(error);
        }
    }

    async initializeSystems() {
        // Inicializar sistemas en orden de dependencia
        const systems = [
            { name: 'error', system: ErrorSystem },
            { name: 'cache', system: CacheSystem },
            { name: 'analytics', system: AnalyticsSystem },
            { name: 'responsive', system: ResponsiveSystem }
        ];

        for (const { name, system } of systems) {
            try {
                await system.init();
                this.systems.set(name, system);
            } catch (error) {
                console.error(`Failed to initialize ${name} system:`, error);
                throw error;
            }
        }
    }

    checkDependencies() {
        const requiredDependencies = [
            'IntersectionObserver',
            'ResizeObserver'
        ];

        const missingDependencies = requiredDependencies.filter(
            dep => !DEPENDENCIES[dep]
        );

        if (missingDependencies.length > 0) {
            console.warn('Missing dependencies:', missingDependencies);
        }
    }

    async initializeModules() {
        // Definir módulos y su orden de inicialización
        const modules = [
            { name: 'services', module: ServicesModule },
            { name: 'carousel', module: CarouselModule },
            { name: 'gallery', module: GalleryModule },
            { name: 'popup', module: PopupModule },
            { name: 'animation', module: AnimationModule }
        ];

        // Inicializar módulos en paralelo
        const initPromises = modules.map(async ({ name, module }) => {
            try {
                PerformanceMonitor.startMeasure(`init-${name}`);
                const initialized = await module.initialize();
                PerformanceMonitor.endMeasure(`init-${name}`);

                if (initialized) {
                    this.modules.set(name, module);
                } else {
                    throw new Error(`Failed to initialize ${name} module`);
                }
            } catch (error) {
                console.error(`Error initializing ${name} module:`, error);
                throw error;
            }
        });

        await Promise.all(initPromises);
    }

    setupGlobalFeatures() {
        // Configurar observadores globales
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        this.setupErrorHandling();
        this.setupServiceWorker();
    }

    setupIntersectionObserver() {
        if (!DEPENDENCIES.IntersectionObserver) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // Cargar imágenes lazy
                        if (element.tagName === 'IMG' && element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                        }

                        // Animar elementos
                        if (element.classList.contains('animate-on-scroll')) {
                            element.classList.add('animated');
                        }

                        observer.unobserve(element);
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        // Observar elementos
        document.querySelectorAll('[data-src], .animate-on-scroll').forEach(
            element => observer.observe(element)
        );
    }

    setupPerformanceMonitoring() {
        // Monitorear métricas de rendimiento
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    AnalyticsSystem.trackEvent('Performance', entry.name, '', entry.duration);
                });
            });

            observer.observe({ entryTypes: ['measure'] });
        }
    }

    setupErrorHandling() {
        // Manejar errores no capturados
        window.addEventListener('error', event => {
            ErrorSystem.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', event => {
            ErrorSystem.handleError(event.reason);
        });
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator && CONFIG.ENABLE_SERVICE_WORKER) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    handleInitializationError(error) {
        // Mostrar mensaje de error al usuario
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>Error de Inicialización</h2>
                <p>Lo sentimos, ha ocurrido un error al cargar la aplicación.</p>
                <button onclick="location.reload()">Recargar página</button>
            </div>
        `;

        document.body.appendChild(errorContainer);
    }

    cleanup() {
        // Limpiar recursos al cerrar/recargar
        this.modules.forEach(module => {
            if (typeof module.cleanup === 'function') {
                module.cleanup();
            }
        });

        // Limpiar sistemas
        CacheSystem.clear();
        ErrorSystem.clearErrors();
        AnalyticsSystem.clearEvents();

        this.initialized = false;
    }
}

// Crear instancia y exportar
const app = new App();
export default app;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
});

// Limpiar al cerrar/recargar
window.addEventListener('unload', () => {
    app.cleanup();
});
