// systems/error.js
import CONFIG from '../config/config.js';

export const ErrorSystem = {
    errors: [],
    errorHandlers: new Map(),
    
    init() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    },

    handleError(error, context = '', options = {}) {
        const errorInfo = {
            error: error instanceof Error ? error : new Error(error),
            context,
            timestamp: new Date(),
            stack: error.stack || new Error().stack,
            severity: options.severity || 'medium',
            userImpact: options.userImpact || false,
            metadata: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                ...options.metadata
            }
        };

        this.errors.push(errorInfo);
        this.logError(errorInfo);

        if (errorInfo.userImpact) {
            this.notifyUser(errorInfo);
        }

        // Notificar a los manejadores registrados
        this.errorHandlers.forEach(handler => {
            try {
                handler(errorInfo);
            } catch (e) {
                console.error('Error in error handler:', e);
            }
        });

        return errorInfo;
    },

    logError(errorInfo) {
        if (CONFIG.DEBUG) {
            console.error(
                `[${errorInfo.severity.toUpperCase()}] ${errorInfo.context}:`,
                errorInfo.error,
                errorInfo.metadata
            );
        }

        // Guardar en localStorage para análisis posterior
        try {
            const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            logs.push({
                message: errorInfo.error.message,
                context: errorInfo.context,
                timestamp: errorInfo.timestamp,
                severity: errorInfo.severity
            });
            
            // Mantener solo los últimos 50 errores
            if (logs.length > 50) logs.shift();
            
            localStorage.setItem('errorLogs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Error saving to localStorage:', error);
        }
    },

    notifyUser(errorInfo) {
        const messages = {
            high: 'Ha ocurrido un error crítico. Por favor, recarga la página.',
            medium: 'Ha ocurrido un problema. Estamos trabajando para solucionarlo.',
            low: 'Ha ocurrido un error menor. Puedes continuar usando la aplicación.'
        };

        const message = messages[errorInfo.severity] || messages.medium;
        
        // Crear y mostrar notificación
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <p>${message}</p>
                ${errorInfo.severity === 'high' ? '<button onclick="location.reload()">Recargar página</button>' : ''}
                <button class="close-error">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animación de entrada
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Auto-cerrar después de 5 segundos para errores no críticos
        if (errorInfo.severity !== 'high') {
            setTimeout(() => {
                this.removeNotification(notification);
            }, 5000);
        }

        // Manejar cierre manual
        notification.querySelector('.close-error').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    },

    removeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    },

    registerHandler(name, handler) {
        this.errorHandlers.set(name, handler);
    },

    unregisterHandler(name) {
        this.errorHandlers.delete(name);
    },

    getLastError() {
        return this.errors[this.errors.length - 1];
    },

    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('errorLogs');
        } catch (error) {
            console.warn('Error clearing localStorage:', error);
        }
    }
};
