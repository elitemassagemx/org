// utils/events.js
import { Logger } from './logger.js';

export const EventUtils = {
    eventListeners: new Map(),

    add(element, event, handler, options = false) {
        if (!element) {
            Logger.error('Cannot add event listener to null element');
            return;
        }

        try {
            element.addEventListener(event, handler, options);
            const key = `${element.id || 'anonymous'}-${event}`;
            this.eventListeners.set(key, { element, event, handler });
            
            Logger.debug(`Event listener added: ${key}`);
        } catch (error) {
            Logger.error('Error adding event listener:', error);
        }
    },

    remove(element, event) {
        try {
            const key = `${element.id || 'anonymous'}-${event}`;
            const listener = this.eventListeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                this.eventListeners.delete(key);
                Logger.debug(`Event listener removed: ${key}`);
            }
        } catch (error) {
            Logger.error('Error removing event listener:', error);
        }
    },

    removeAll() {
        try {
            this.eventListeners.forEach(listener => {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            this.eventListeners.clear();
            Logger.info('All event listeners removed');
        } catch (error) {
            Logger.error('Error removing all event listeners:', error);
        }
    },

    delegate(parentElement, childSelector, eventType, handler) {
        this.add(parentElement, eventType, (event) => {
            const targetElement = event.target.closest(childSelector);
            if (targetElement && parentElement.contains(targetElement)) {
                handler(event, targetElement);
            }
        });
    }
};
