// utils/dom.js
export const DOMUtils = {
    getElement(id) {
        const element = document.getElementById(id);
        if (!element && CONFIG.DEBUG) {
            console.warn(`Element with id "${id}" not found`);
        }
        return element;
    },

    createElement(tag, attributes = {}, children = []) {
        try {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                }
            });

            return element;
        } catch (error) {
            console.error('Error creating element:', error);
            return null;
        }
    },

    removeElement(element) {
        if (element && element.parentNode) {
            try {
                element.parentNode.removeChild(element);
                return true;
            } catch (error) {
                console.error('Error removing element:', error);
                return false;
            }
        }
        return false;
    },

    clearContainer(container) {
        if (!container) return false;
        
        try {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            return true;
        } catch (error) {
            console.error('Error clearing container:', error);
            return false;
        }
    },

    setVisible(element, visible, displayType = 'block') {
        if (!element) return;
        element.style.display = visible ? displayType : 'none';
    },

    addClass(element, ...classNames) {
        try {
            element?.classList.add(...classNames);
            return true;
        } catch (error) {
            console.error('Error adding class:', error);
            return false;
        }
    },

    removeClass(element, ...classNames) {
        try {
            element?.classList.remove(...classNames);
            return true;
        } catch (error) {
            console.error('Error removing class:', error);
            return false;
        }
    },

    toggleClass(element, className, force) {
        try {
            return element?.classList.toggle(className, force);
        } catch (error) {
            console.error('Error toggling class:', error);
            return false;
        }
    }
};

// utils/events.js
export const EventUtils = {
    eventListeners: new Map(),

    add(element, event, handler, options = false) {
        if (!element) {
            console.error('Cannot add event listener to null element');
            return;
        }

        try {
            element.addEventListener(event, handler, options);
            const key = `${element.id || 'anonymous'}-${event}`;
            this.eventListeners.set(key, { element, event, handler });
        } catch (error) {
            console.error('Error adding event listener:', error);
        }
    },

    remove(element, event) {
        try {
            const key = `${element.id || 'anonymous'}-${event}`;
            const listener = this.eventListeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                this.eventListeners.delete(key);
            }
        } catch (error) {
            console.error('Error removing event listener:', error);
        }
    },

    removeAll() {
        try {
            this.eventListeners.forEach(listener => {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            this.eventListeners.clear();
        } catch (error) {
            console.error('Error removing all event listeners:', error);
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

// utils/common.js
export const CommonUtils = {
    debounce(func, wait = CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit = CONFIG.PERFORMANCE.THROTTLE_DELAY) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    },

    formatPrice(price, locale = 'es-MX', currency = 'MXN') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(price);
        } catch (error) {
            console.error('Error formatting price:', error);
            return `${currency} ${price}`;
        }
    },

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    generateUniqueId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
