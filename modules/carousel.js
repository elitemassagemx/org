// modules/carousel.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';

export const CarouselModule = {
    state: {
        currentIndex: 0,
        isAnimating: false,
        autoplayInterval: null,
        itemWidth: 0,
        itemsCount: 0
    },

    async initialize() {
        try {
            await Promise.all([
                this.loadCarouselContent(),
                this.loadPaqcarrContent()
            ]);

            this.initCarousel();
            this.setupEventListeners();
            this.setupAutoplay();
            return true;
        } catch (error) {
            console.error('Error initializing carousel:', error);
            return false;
        }
    },

    async loadCarouselContent() {
        try {
            const response = await fetch('data/carousel.json');
            const data = await response.json();
            this.renderCarousel(data);
        } catch (error) {
            console.error('Error loading carousel:', error);
            this.handleCarouselError();
        }
    },

    renderCarousel(data) {
        const container = DOMUtils.getElement('carrusel-container');
        if (!container) return;

        const carouselHTML = `
            <div class="carousel">
                ${data.items.map((item, index) => `
                    <div class="carousel-item${index === 0 ? ' active' : ''}">
                        <img src="${CONFIG.CAROUSEL_IMAGE_BASE_URL}${item.image}" 
                             alt="${item.title}"
                             loading="${index === 0 ? 'eager' : 'lazy'}">
                        <div class="carousel-caption">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="carousel-controls">
                <button class="carousel-control prev" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-control next" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="carousel-indicators">
                ${data.items.map((_, index) => `
                    <button class="carousel-indicator${index === 0 ? ' active' : ''}" 
                            data-index="${index}"
                            aria-label="Ir a slide ${index + 1}"></button>
                `).join('')}
            </div>
        `;

        container.innerHTML = carouselHTML;
        this.state.itemsCount = data.items.length;
        this.state.itemWidth = container.offsetWidth;
    },

    setupEventListeners() {
        const container = DOMUtils.getElement('carrusel-container');
        if (!container) return;

        // Controles de navegación
        EventUtils.delegate(container, '.carousel-control', 'click', (_, button) => {
            const direction = button.classList.contains('prev') ? -1 : 1;
            this.navigate(direction);
        });

        // Indicadores
        EventUtils.delegate(container, '.carousel-indicator', 'click', (_, button) => {
            const index = parseInt(button.dataset.index);
            this.showSlide(index);
        });

        // Touch/Swipe
        if (window.TouchEvent) {
            let touchStartX = 0;
            let touchEndX = 0;

            container.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                this.pauseAutoplay();
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                const difference = touchEndX - touchStartX;
                
                if (Math.abs(difference) > CONFIG.PERFORMANCE.MIN_SWIPE_DISTANCE) {
                    this.navigate(difference > 0 ? -1 : 1);
                }
                this.resumeAutoplay();
            }, { passive: true });
        }

        // Pausa en hover
        container.addEventListener('mouseenter', () => this.pauseAutoplay());
        container.addEventListener('mouseleave', () => this.resumeAutoplay());
    },

    showSlide(index) {
        if (this.state.isAnimating) return;

        const carousel = DOMUtils.getElement('carrusel-container').querySelector('.carousel');
        const items = carousel.querySelectorAll('.carousel-item');
        const indicators = document.querySelectorAll('.carousel-indicator');

        this.state.isAnimating = true;
        this.state.currentIndex = index;

        // Actualizar clases activas
        items.forEach(item => item.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        items[index].classList.add('active');
        indicators[index].classList.add('active');

        // Animar transición
        if (window.gsap) {
            gsap.to(carousel, {
                x: -index * this.state.itemWidth,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    this.state.isAnimating = false;
                }
            });
        } else {
            carousel.style.transform = `translateX(-${index * this.state.itemWidth}px)`;
            setTimeout(() => {
                this.state.isAnimating = false;
            }, 500);
        }
    },

    navigate(direction) {
        const newIndex = (this.state.currentIndex + direction + this.state.itemsCount) % this.state.itemsCount;
        this.showSlide(newIndex);
    },

    setupAutoplay(interval = 5000) {
        this.state.autoplayInterval = setInterval(() => {
            this.navigate(1);
        }, interval);
    },

    pauseAutoplay() {
        if (this.state.autoplayInterval) {
            clearInterval(this.state.autoplayInterval);
            this.state.autoplayInterval = null;
        }
    },

    resumeAutoplay() {
        this.setupAutoplay();
    },

    handleCarouselError() {
        const container = DOMUtils.getElement('carrusel-container');
        if (container) {
            container.innerHTML = '<p class="error-message">Error al cargar el carrusel</p>';
        }
    }
};
