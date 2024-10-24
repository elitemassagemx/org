// utils/common.js
import CONFIG from '../config/config.js';

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
    },

    validate: {
        isEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        isPhone(phone) {
            const re = /^\+?[\d\s-]{10,}$/;
            return re.test(phone);
        },

        isUrl(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        }
    },

    format: {
        date(date, locale = 'es-MX') {
            try {
                return new Date(date).toLocaleDateString(locale);
            } catch (error) {
                console.error('Error formatting date:', error);
                return date;
            }
        },

        time(date, locale = 'es-MX') {
            try {
                return new Date(date).toLocaleTimeString(locale);
            } catch (error) {
                console.error('Error formatting time:', error);
                return date;
            }
        },

        number(number, locale = 'es-MX') {
            try {
                return new Intl.NumberFormat(locale).format(number);
            } catch (error) {
                console.error('Error formatting number:', error);
                return number.toString();
            }
        }
    }
};
