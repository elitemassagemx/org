// config/dependencies.js
export const DEPENDENCIES = {
    GSAP: typeof gsap !== 'undefined',
    ScrollTrigger: typeof ScrollTrigger !== 'undefined',
    ResizeObserver: typeof ResizeObserver !== 'undefined',
    IntersectionObserver: typeof IntersectionObserver !== 'undefined',
    PointerEvents: typeof PointerEvent !== 'undefined',
    TouchEvents: 'ontouchstart' in window
};
