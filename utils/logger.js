// utils/logger.js
import CONFIG from '../config/config.js';

export const Logger = {
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    currentLevel: 0, // DEBUG por defecto

    log(level, message, data = null) {
        if (level >= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level: this.getLevelName(level),
                message,
                data
            };

            if (CONFIG.DEBUG) {
                console.log(JSON.stringify(logEntry, null, 2));
            }

            // Almacenar logs importantes
            if (level >= this.levels.WARN) {
                this.storelog(logEntry);
            }
        }
    },

    getLevelName(level) {
        return Object.keys(this.levels).find(key => this.levels[key] === level) || 'UNKNOWN';
    },

    storelog(logEntry) {
        const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        logs.push(logEntry);
        // Mantener solo los últimos 100 logs
        if (logs.length > 100) logs.shift();
        localStorage.setItem('appLogs', JSON.stringify(logs));
    },

    debug(message, data = null) {
        this.log(this.levels.DEBUG, message, data);
    },

    info(message, data = null) {
        this.log(this.levels.INFO, message, data);
    },

    warn(message, data = null) {
        this.log(this.levels.WARN, message, data);
    },

    error(message, data = null) {
        this.log(this.levels.ERROR, message, data);
    },

    clearLogs() {
        localStorage.removeItem('appLogs');
    },

    getLogs() {
        return JSON.parse(localStorage.getItem('appLogs') || '[]');
    }
};
