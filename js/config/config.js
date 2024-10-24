const CONFIG = {
    BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",
    CAROUSEL_IMAGE_BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/",
    DEFAULT_ERROR_IMAGE: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",
    WHATSAPP_NUMBER: "5215640020305",
    ANIMATION_DURATION: 300,
    CACHE_DURATION: 3600000, // 1 hora
    DEBUG: true,
    BREAKPOINTS: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
    },
    PERFORMANCE: {
        DEBOUNCE_DELAY: 250,
        THROTTLE_DELAY: 100,
        INTERSECTION_MARGIN: '50px',
        MIN_SWIPE_DISTANCE: 50
    }
};

export default CONFIG;

// config/dependencies.js
export const DEPENDENCIES = {
    GSAP: typeof gsap !== 'undefined',
    ScrollTrigger: typeof ScrollTrigger !== 'undefined',
    ResizeObserver: typeof ResizeObserver !== 'undefined',
    IntersectionObserver: typeof IntersectionObserver !== 'undefined',
    PointerEvents: typeof PointerEvent !== 'undefined',
    TouchEvents: 'ontouchstart' in window
};
