// modules/animation.js
import { DEPENDENCIES } from '../config/dependencies.js';

export const AnimationModule = {
    initialize() {
        if (!DEPENDENCIES.GSAP) {
            console.warn('GSAP not available, animations will be limited');
            return false;
        }

        this.setupGlobalAnimations();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        return true;
    },

    setupGlobalAnimations() {
        gsap.config({
            nullTargetWarn: false
        });

        if (DEPENDENCIES.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Animación inicial de elementos
        gsap.from('.fade-in', {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.1
        });
    },

    setupScrollAnimations() {
        if (!DEPENDENCIES.ScrollTrigger) return;

        // Animaciones de secciones
        gsap.utils.toArray('section').forEach(section => {
            gsap.from(section, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                },
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: "power2.out"
            });
        });

        // Animaciones de servicios
        gsap.utils.toArray('.service-item').forEach(item => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse"
                },
                opacity: 0,
                y: 50,
                duration: 0.6,
                ease: "power2.out"
            });
        });

        // Animaciones de beneficios
        gsap.utils.toArray('.benefit-btn').forEach((btn, index) => {
            gsap.from(btn, {
                scrollTrigger: {
                    trigger: btn,
                    start: "top bottom-=50"
                },
                opacity: 0,
                y: 20,
                duration: 0.4,
                delay: index * 0.1,
                ease: "power2.out"
            });
        });
    },

    setupHoverAnimations() {
        // Animaciones de hover para botones
        const buttons = document.querySelectorAll('.benefit-btn, .package-btn, .saber-mas-button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    y: -2,
                    scale: 1.05,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    y: 0,
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.in"
                });
            });
        });

        // Animaciones de hover para items de servicio
        const serviceItems = document.querySelectorAll('.service-item');
        
        serviceItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                gsap.to(item, {
                    y: -5,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(item, {
                    y: 0,
                    boxShadow: "0 5px 10px rgba(0,0,0,0.1)",
                    duration: 0.3,
                    ease: "power2.in"
                });
            });
        });
    },

    // Utilidades de animación
    fadeIn(element, duration = 0.3) {
        return gsap.fromTo(element,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration, ease: "power2.out" }
        );
    },

    fadeOut(element, duration = 0.3) {
        return gsap.to(element, {
            opacity: 0,
            y: -20,
            duration,
            ease: "power2.in"
        });
    },

    shake(element, intensity = 5) {
        return gsap.to(element, {
            x: intensity,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: "power2.inOut"
        });
    }
};
