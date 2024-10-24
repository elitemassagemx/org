// systems/responsive.js
import CONFIG from '../config/config.js';
import { EventUtils } from '../utils/events.js';

export const ResponsiveSystem = {
    state: {
        currentBreakpoint: null,
        orientation: null,
        lastWidth: window.innerWidth,
        resizeTimeout: null
    },

    init() {
        this.checkBreakpoint();
        this.setupEventListeners();
        this.setupResizeObserver();
        return true;
    },

    setupEventListeners() {
        // Usar debounce para el resize
        EventUtils.add(window, 'resize', () => {
            clearTimeout(this.state.resizeTimeout);
            this.state.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, CONFIG.PERFORMANCE.DEBOUNCE_DELAY);
        });

        // Cambios de orientación
        if ('orientation' in window) {
            EventUtils.add(window, 'orientationchange', () => {
                this.handleOrientationChange();
            });
        }

        // Cambios de media queries
        this.setupMediaQueryListeners();
    },

    setupResizeObserver() {
        if (!window.ResizeObserver) return;

        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const element = entry.target;
                const event = new CustomEvent('elementResize', {
                    detail: {
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    }
                });
                element.dispatchEvent(event);
            });
        });

        // Observar elementos que necesiten ajustarse al resize
        document.querySelectorAll('[data-observe-resize]').forEach(element => {
            observer.observe(element);
        });
    },

    setupMediaQueryListeners() {
        const breakpoints = CONFIG.BREAKPOINTS;
        
        Object.entries(breakpoints).forEach(([name, width]) => {
            const query = window.matchMedia(`(min-width: ${width}px)`);
            
            const handler = (e) => {
                if (e.matches) {
                    this.handleBreakpointChange(name);
                }
            };

            // Usar el método correcto según el navegador
            if (query.addEventListener) {
                query.addEventListener('change', handler);
            } else {
                query.addListener(handler);
            }
        });
    },

    handleResize() {
        const currentWidth = window.innerWidth;
        const widthChanged = currentWidth !== this.state.lastWidth;

        if (widthChanged) {
            this.checkBreakpoint();
            this.updateLayoutForSize();
            this.state.lastWidth = currentWidth;
        }

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('appResize', {
            detail: {
                width: currentWidth,
                breakpoint: this.state.currentBreakpoint,
                widthChanged
            }
        }));
    },

    handleOrientationChange() {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        if (orientation !== this.state.orientation) {
            this.state.orientation = orientation;
            
            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('orientationChange', {
                detail: { orientation }
            }));
            
            this.updateLayoutForOrientation();
        }
    },

    checkBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint = 'mobile';

        if (width >= CONFIG.BREAKPOINTS.desktop) {
            newBreakpoint = 'desktop';
        } else if (width >= CONFIG.BREAKPOINTS.tablet) {
            newBreakpoint = 'tablet';
        }

        if (newBreakpoint !== this.state.currentBreakpoint) {
            this.handleBreakpointChange(newBreakpoint);
        }
    },

    handleBreakpointChange(newBreakpoint) {
        const oldBreakpoint = this.state.currentBreakpoint;
        this.state.currentBreakpoint = newBreakpoint;

        // Actualizar clases en el body
        document.body.classList.remove('mobile', 'tablet', 'desktop');
        document.body.classList.add(newBreakpoint);

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('breakpointChange', {
            detail: {
                previous: oldBreakpoint
                  // systems/responsive.js (continuación)
                new: newBreakpoint
            }
        }));
    },

    updateLayoutForSize() {
        const breakpoint = this.state.currentBreakpoint;

        // Ajustar grids
        const grids = {
            mobile: '1fr',
            tablet: 'repeat(2, 1fr)',
            desktop: 'repeat(3, 1fr)'
        };

        document.querySelectorAll('.services-grid, .gallery-grid').forEach(grid => {
            grid.style.gridTemplateColumns = grids[breakpoint];
        });

        // Ajustar navegación
        const benefitsNav = document.querySelector('.benefits-nav');
        if (benefitsNav) {
            benefitsNav.style.justifyContent = breakpoint === 'mobile' ? 'flex-start' : 'center';
        }

        // Ajustar imágenes y contenido
        document.querySelectorAll('.responsive-image').forEach(img => {
            const srcset = img.dataset[`${breakpoint}Src`];
            if (srcset) {
                img.src = srcset;
            }
        });

        // Ajustar textos
        document.querySelectorAll('.responsive-text').forEach(element => {
            const text = element.dataset[`${breakpoint}Text`];
            if (text) {
                element.textContent = text;
            }
        });
    },

    updateLayoutForOrientation() {
        const orientation = this.state.orientation;
        document.body.classList.remove('portrait', 'landscape');
        document.body.classList.add(orientation);

        // Ajustar elementos específicos por orientación
        document.querySelectorAll('[data-orientation-style]').forEach(element => {
            const styles = JSON.parse(element.dataset.orientationStyle);
            Object.assign(element.style, styles[orientation] || {});
        });
    },

    getCurrentBreakpoint() {
        return this.state.currentBreakpoint;
    },

    getCurrentOrientation() {
        return this.state.orientation;
    },

    isBreakpoint(breakpoint) {
        return this.state.currentBreakpoint === breakpoint;
    },

    isMobile() {
        return this.isBreakpoint('mobile');
    },

    isTablet() {
        return this.isBreakpoint('tablet');
    },

    isDesktop() {
        return this.isBreakpoint('desktop');
    }
};
