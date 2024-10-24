// modules/services.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';

export const ServicesModule = {
    state: {
        services: [],
        currentCategory: 'masajes',
        activeBenefit: 'all'
    },

    async initialize() {
        try {
            await this.loadServices();
            this.setupEventListeners();
            this.renderServices(this.state.currentCategory);
            return true;
        } catch (error) {
            console.error('Error initializing services:', error);
            return false;
        }
    },

    async loadServices() {
        try {
            const response = await fetch('data/services.json');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.state.services = data.services;
            
            // Precargar imágenes
            this.preloadServiceImages();
            
            return true;
        } catch (error) {
            console.error('Error loading services:', error);
            this.handleServiceLoadError();
            return false;
        }
    },

    preloadServiceImages() {
        Object.values(this.state.services).forEach(categoryServices => {
            categoryServices.forEach(service => {
                if (service.backgroundImage) {
                    const img = new Image();
                    img.src = `${CONFIG.BASE_URL}${service.backgroundImage}`;
                }
            });
        });
    },

    setupEventListeners() {
        // Filtros de categoría
        const categoryToggles = document.querySelectorAll('.service-category-toggle input');
        categoryToggles.forEach(input => {
            EventUtils.add(input, 'change', () => {
                this.changeCategory(input.value);
            });
        });

        // Delegación para botones "Saber más"
        EventUtils.delegate(
            document.body,
            '.saber-mas-button',
            'click',
            (event, button) => {
                const serviceElement = button.closest('.service-item');
                if (!serviceElement) return;

                const index = Array.from(serviceElement.parentNode.children)
                    .indexOf(serviceElement);
                const service = this.state.services[this.state.currentCategory][index];
                PopupModule.showPopup(service, index);
            }
        );
    },

    renderServices(category) {
        const servicesList = DOMUtils.getElement('services-grid');
        if (!servicesList) return;

        DOMUtils.clearContainer(servicesList);
        const services = this.state.services[category];

        if (!Array.isArray(services)) {
            console.error(`Invalid services data for category: ${category}`);
            servicesList.innerHTML = '<p>Error al cargar los servicios.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        services.forEach((service, index) => {
            const serviceElement = this.createServiceElement(service, index);
            fragment.appendChild(serviceElement);
        });

        servicesList.appendChild(fragment);

        if (this.state.activeBenefit !== 'all') {
            this.filterServicesByBenefit(this.state.activeBenefit);
        }
    },

    createServiceElement(service) {
        const element = DOMUtils.createElement('div', {
            className: `service-item ${this.getBenefitClasses(service)}`
        });

        element.innerHTML = `
            <div class="service-image">
                <img src="${CONFIG.BASE_URL}${service.backgroundImage}" 
                     alt="${service.title}"
                     loading="lazy">
            </div>
            <div class="service-content">
                <div class="service-header">
                    <img class="service-icon" 
                         src="${CONFIG.BASE_URL}${service.icon}" 
                         alt="${service.title}">
                    <h3 class="service-title">${service.title}</h3>
                </div>
                <p class="service-description">${service.description}</p>
                ${this.renderBenefits(service)}
                <div class="service-duration">
                    <img src="${CONFIG.BASE_URL}duration-icon.webp" 
                         alt="" 
                         class="duration-icon">
                    <span>${service.duration}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `;

        return element;
    },

    getBenefitClasses(service) {
        return service.benefits ? 
            service.benefits.map(b => b.toLowerCase().replace(/\s+/g, '-')).join(' ') : '';
    },

    renderBenefits(service) {
        if (!Array.isArray(service.benefits) || !Array.isArray(service.benefitsIcons)) {
            return '';
        }

        return `
            <div class="service-benefits">
                ${service.benefits.map((benefit, index) => `
                    <div class="benefit-item">
                        <img src="${CONFIG.BASE_URL}${service.benefitsIcons[index]}" 
                             alt="${benefit}" 
                             class="benefit-icon"
                             loading="lazy">
                        <span>${benefit}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    filterServicesByBenefit(benefit) {
        const services = document.querySelectorAll('.service-item');
        services.forEach(service => {
            if (benefit === 'all') {
                DOMUtils.setVisible(service, true);
            } else {
                const hasFilter = service.classList.contains(benefit);
                DOMUtils.setVisible(service, hasFilter);
            }
        });
    },

    changeCategory(category) {
        this.state.currentCategory = category;
        this.renderServices(category);
    },

    handleServiceLoadError() {
        const errorMessage = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
        
        ['services-list', 'package-list'].forEach(id => {
            const element = DOMUtils.getElement(id);
            if (element) {
                element.innerHTML = errorMessage;
            }
        });
    }
};
