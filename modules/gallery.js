// modules/gallery.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';

export const GalleryModule = {
    state: {
        images: [
            {
                src: 'QUESOSAHM.webp',
                title: 'Tabla Gourmet',
                description: 'Después de tu masaje en pareja saborea una exquisita selección de jamón curado, quesos gourmet, fresas cubiertas de chocolate y copas de vino.'
            },
            {
                src: 'choco2.webp',
                title: 'Chocolate Deluxe',
                description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate'
            },
            {
                src: 'SILLAS.webp',
                title: 'Área de Relajación',
                description: 'Disfruta de nuestro acogedor espacio de relajación antes o después de tu masaje'
            }
        ],
        currentIndex: 0,
        isModalOpen: false
    },

    initialize() {
        try {
            this.setupGallery();
            this.setupModal();
            this.setupIntersectionObserver();
            return true;
        } catch (error) {
            console.error('Error initializing gallery:', error);
            return false;
        }
    },

    setupGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Crear elementos de galería
        const fragment = document.createDocumentFragment();
        this.state.images.forEach((image, index) => {
            const galleryItem = this.createGalleryItem(image, index);
            fragment.appendChild(galleryItem);
        });

        galleryGrid.appendChild(fragment);

        // Configurar botón "Ver más"
        const verMasButton = DOMUtils.getElement('ver-mas-galeria');
        if (verMasButton) {
            EventUtils.add(verMasButton, 'click', () => {
                window.location.href = 'galeria.html';
            });
        }
    },

    createGalleryItem(image, index) {
        const item = DOMUtils.createElement('div', {
            className: 'gallery-item animate-entry',
            'data-index': index
        });

        item.innerHTML = `
            <img src="${CONFIG.BASE_URL}${image.src}" 
                 alt="${image.title}"
                 loading="lazy">
            <div class="image-overlay">
                <h3 class="image-title">${image.title}</h3>
                <p class="image-description">${image.description}</p>
            </div>
        `;

        EventUtils.add(item, 'click', () => {
            this.showImageDetails(index);
        });

        return item;
    },

    setupModal() {
        // Crear modal si no existe
        if (!DOMUtils.getElement('imageModal')) {
            const modal = DOMUtils.createElement('div', {
                id: 'imageModal',
                className: 'modal'
            });

            modal.innerHTML = `
                <button class="close">&times;</button>
                <img id="modalImage" class="modal-content" alt="">
                <div id="modalDescription" class="modal-description"></div>
                <button class="modal-nav prev" aria-label="Anterior">&#10094;</button>
                <button class="modal-nav next" aria-label="Siguiente">&#10095;</button>
            `;

            document.body.appendChild(modal);
        }

        // Configurar eventos del modal
        const modal = DOMUtils.getElement('imageModal');
        
        EventUtils.add(modal.querySelector('.close'), 'click', () => {
            this.hideModal();
        });

        EventUtils.add(modal, 'click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        EventUtils.add(modal.querySelector('.prev'), 'click', () => {
            this.navigateGallery(-1);
        });

        EventUtils.add(modal.querySelector('.next'), 'click', () => {
            this.navigateGallery(1);
        });

        // Navegación con teclado
        EventUtils.add(window, 'keydown', (e) => {
            if (!this.state.isModalOpen) return;

            switch(e.key) {
                case 'Escape':
                    this.hideModal();
                    break;
                case 'ArrowLeft':
                    this.navigateGallery(-1);
                    break;
                case 'ArrowRight':
                    this.navigateGallery(1);
                    break;
            }
        });

        // Gestos táctiles
        let touchStartX = 0;
        let touchEndX = 0;

        EventUtils.add(modal, 'touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        EventUtils.add(modal, 'touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const difference = touchEndX - touchStartX;

            if (Math.abs(difference) > CONFIG.PERFORMANCE.MIN_SWIPE_DISTANCE) {
                this.navigateGallery(difference > 0 ? -1 : 1);
            }
        }, { passive: true });
    },

    showImageDetails(index) {
        const modal = DOMUtils.getElement('imageModal');
        const modalImg = DOMUtils.getElement('modalImage');
        const modalDesc = DOMUtils.getElement('modalDescription');
        
        this.state.currentIndex = index;
        this.state.isModalOpen = true;

        const image = this.state.images[index];
        
        // Mostrar loading en la imagen
        modalImg.classList.add('loading');
        
        // Cargar imagen
        modalImg.src = `${CONFIG.BASE_URL}${image.src}`;
        modalImg.alt = image.title;

        modalDesc.innerHTML = `
            <h3>${image.title}</h3>
            <p>${image.description}</p>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Quitar loading cuando la imagen cargue
        modalImg.onload = () => {
            modalImg.classList.remove('loading');
        };
    },

    hideModal() {
        const modal = DOMUtils.getElement('imageModal');
        modal.style.display = 'none';
        this.state.isModalOpen = false;
        document.body.style.overflow = '';
    },

    navigateGallery(direction) {
        const newIndex = (this.state.currentIndex + direction + this.state.images.length) % this.state.images.length;
        this.showImageDetails(newIndex);
    },

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    if (window.gsap) {
                        gsap.from(entry.target, {
                            opacity: 0,
                            y: 30,
                            duration: 0.6,
                            ease: "power2.out"
                        });
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        document.querySelectorAll('.gallery-item').forEach(item => {
            observer.observe(item);
        });
    }
};
