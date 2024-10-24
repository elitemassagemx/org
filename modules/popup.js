// modules/popup.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';

export const PopupModule = {
    state: {
        isOpen: false,
        currentData: null
    },

    initialize() {
        this.popup = DOMUtils.getElement('popup');
        if (!this.popup) return false;

        this.setupEventListeners();
        return true;
    },

    setupEventListeners() {
        // Cerrar popup
        const closeBtn = this.popup.querySelector('.close');
        if (closeBtn) {
            EventUtils.add(closeBtn, 'click', () => this.hide());
        }

        // Cerrar al hacer clic fuera
        EventUtils.add(this.popup, 'click', (e) => {
            if (e.target === this.popup) {
                this.hide();
            }
        });

        // Tecla ESC
        EventUtils.add(window, 'keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.hide();
            }
        });

        // Botón de WhatsApp
        const whatsappBtn = DOMUtils.getElement('whatsapp-button');
        if (whatsappBtn) {
            EventUtils.add(whatsappBtn, 'click', () => {
                this.sendWhatsAppMessage();
            });
        }
    },

    show(data) {
        this.state.currentData = data;
        this.state.isOpen = true;

        // Actualizar contenido
        const elements = {
            image: DOMUtils.getElement('popup-image'),
            title: DOMUtils.getElement('popup-title'),
            description: DOMUtils.getElement('popup-description'),
            benefits: this.popup.querySelector('.popup-benefits'),
            includes: this.popup.querySelector('.popup-includes'),
            duration: DOMUtils.getElement('popup-duration')
        };

        if (elements.image) elements.image.src = `${CONFIG.BASE_URL}${data.popupImage || data.image}`;
        if (elements.title) elements.title.textContent = data.title;
        if (elements.description) elements.description.textContent = data.popupDescription || data.description;
        
        // Renderizar beneficios
        if (elements.benefits) {
            elements.benefits.innerHTML = this.renderBenefits(data);
        }

        // Renderizar inclusiones (si es un paquete)
        if (elements.includes && data.includes) {
            elements.includes.innerHTML = this.renderIncludes(data);
        }

        if (elements.duration) elements.duration.textContent = data.duration;

        // Mostrar popup con animación
        if (window.gsap) {
            this.popup.style.display = 'block';
            gsap.from(this.popup.querySelector('.popup-content'), {
                y: 50,
                opacity: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        } else {
            this.popup.style.display = 'block';
            this.popup.querySelector('.popup-content').classList.add('slide-up');
        }

        // Bloquear scroll del body
        document.body.style.overflow = 'hidden';
    },

    hide() {
        if (window.gsap) {
            gsap.to(this.popup.querySelector('.popup-content'), {
                y: 50,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    this.popup.style.display = 'none';
                    this.state.isOpen = false;
                }
            });
        } else {
            this.popup.style.display = 'none';
            this.state.isOpen = false;
        }

        // Restaurar scroll del body
        document.body.style.overflow = '';
    },

    renderBenefits(data) {
        if (!Array.isArray(data.benefits) || !Array.isArray(data.benefitsIcons)) {
            return '';
        }

        return data.benefits.map((benefit, index) => `
            <div class="popup-benefits-item">
                <img src="${CONFIG.BASE_URL}${data.benefitsIcons[index]}" 
                     alt="${benefit}"
                     loading="lazy">
                <span>${benefit}</span>
            </div>
        `).join('');
    },

    renderIncludes(data) {
        if (!Array.isArray(data.includes)) return '';

        return data.includes.map(item => `
            <div class="popup-includes-item">
                <img src="${CONFIG.BASE_URL}check-icon.webp" 
                     alt="Incluido"
                     loading="lazy">
                <span>${item}</span>
            </div>
        `).join('');
    },

    sendWhatsAppMessage() {
        if (!this.state.currentData) return;

        const message = encodeURIComponent(
            `¡Hola! Me interesa el servicio "${this.state.currentData.title}"`
        );
        
        window.open(
            `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`,
            '_blank'
        );
    }
};
