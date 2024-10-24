// utils/performance.js
import { Logger } from './logger.js';

export const PerformanceMonitor = {
    metrics: new Map(),
    marks: new Map(),
    
    startMeasure(name) {
        this.marks.set(name, performance.now());
        if (window.performance && performance.mark) {
            performance.mark(`${name}-start`);
        }
    },

    endMeasure(name) {
        const startTime = this.marks.get(name);
        if (!startTime) return null;

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        if (window.performance && performance.mark) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }

        this.recordMetric(name, duration);
        return duration;
    },

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                count: 0,
                total: 0,
                min: value,
                max: value,
                avg: value
            });
        }

        const metric = this.metrics.get(name);
        metric.count++;
        metric.total += value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.avg = metric.total / metric.count;
    },

    getMetrics() {
        return Array.from(this.metrics.entries()).map(([name, metric]) => ({
            name,
            ...metric
        }));
    },

    logPerformance(name, duration) {
        Logger.info(`Performance ${name}: ${duration.toFixed(2)}ms`);
    },

    clearMetrics() {
        this.metrics.clear();
        this.marks.clear();
        if (window.performance && performance.clearMarks) {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }
};
