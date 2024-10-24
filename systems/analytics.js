// systems/analytics.js
import CONFIG from '../config/config.js';

export const AnalyticsSystem = {
    events: [],
    initialized: false,

    init() {
        this.initialized = true;
        this.trackPageView();

        // Trackear eventos de navegación
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });

        // Trackear clics en elementos importantes
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track]');
            if (target) {
                const eventName = target.dataset.track;
                const category = target.dataset.category || 'interaction';
                this.trackEvent(category, eventName);
            }
        });
    },

    trackEvent(category, action, label = '', value = null) {
        const event = {
            category,
            action,
            label,
            value,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            sessionId: this.getSessionId()
        };

        this.events.push(event);
        this.saveEvent(event);

        if (CONFIG.DEBUG) {
            console.log(`[Analytics] ${category}: ${action} - ${label}`);
        }

        // Enviar a servicio de analytics si existe
        if (window.gtag) {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
    },

    trackPageView(path = window.location.pathname) {
        const pageView = {
            type: 'pageview',
            path,
            title: document.title,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        this.events.push(pageView);
        this.saveEvent(pageView);

        if (window.gtag) {
            gtag('config', CONFIG.GA_ID, {
                page_path: path
            });
        }
    },

    getSessionId() {
        let sessionId = sessionStorage.getItem('analyticsSessionId');
        if (!sessionId) {
            sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('analyticsSessionId', sessionId);
        }
        return sessionId;
    },

    saveEvent(event) {
        try {
            const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
            events.push(event);
            
            // Mantener solo los últimos 100 eventos
            if (events.length > 100) events.shift();
            
            localStorage.setItem('analyticsEvents', JSON.stringify(events));
        } catch (error) {
            console.warn('Error saving analytics event:', error);
        }
    },

    getEvents(filter = {}) {
        return this.events.filter(event => {
            for (const [key, value] of Object.entries(filter)) {
                if (event[key] !== value) return false;
            }
            return true;
        });
    },

    clearEvents() {
        this.events = [];
        try {
            localStorage.removeItem('analyticsEvents');
        } catch (error) {
            console.warn('Error clearing analytics events:', error);
        }
    }
};
