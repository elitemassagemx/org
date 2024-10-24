// modules/packages.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';
import { ImageUtils } from '../utils/image.js';
import { Logger } from '../utils/logger.js';

export const PackagesModule = {
    state: {
        packages: [],
        currentFilter: 'all'
    },

    async initialize() {
        try {
            await this.loadPackages();
            this.setupEventListeners();
            this.renderPackages();
            return true;
        } catch (error) {
            Logger.error('Error initializing packages module:', error);
            return false;
        }
    },

    async loadPackages() {
        try {
            const response = await fetch('data/packages.json');
            const data = await response.json();
            this.state.packages = data.packages;
            
            // Precargar imágenes
            this.preloadPackageImages();
            
            return true;
        } catch (error) {
            Logger.error('Error loading packages:', error);
            this.handlePackageLoadError();
            return false;
        }
    },

    preloadPackageImages() {
        const imagesToPreload = new Set();
        
        this.state.packages.forEach(pack => {
            if (pack.image) {
                imagesToPreload.add(ImageUtils.buildImageUrl(pack.image));
            }
            if (Array.isArray(pack.includes)) {
                pack.includes.forEach(item => {
                    if (item.icon) {
                        imagesToPreload.add(ImageUtils.buildImageUrl(item.icon));
                    }
                });
            }
        });

        return ImageUtils.preloadImages(Array.from(imagesToPreload));
    },

    setupEventListeners() {
        const packageNav = document.querySelector('.package-nav');
        if (packageNav) {
            EventUtils.delegate(packageNav, 'button', 'click', (_, button) => {
                const filter = button.getAttribute('data-filter');
                this.filterPackages(filter);
            });
        }

        // Delegación para botones "Saber más"
        EventUtils.delegate(
            document.body,
            '.package-item .saber-mas-button',
            'click',
            (event, button) => {
                const packageElement = button.closest('.package-item');
                if (!packageElement) return;

                const index = Array.from(packageElement.parentNode.children)
                    .indexOf(packageElement);
                const packageData = this.state.packages[index];
                this.showPackageDetails(packageData, index);
            }
        );
    },

    renderPackages() {
        const packageList = DOMUtils.getElement('package-list');
        if (!packageList) return;

        DOMUtils.clearContainer(packageList);

        const fragment = document.createDocumentFragment();
        
        this.state.packages.forEach((packageData, index) => {
            const packageElement = this.createPackageElement(packageData, index);
            fragment.appendChild(packageElement);
        });

        packageList.appendChild(fragment);
    },

    createPackageElement(packageData, index) {
        const element = DOMUtils.createElement('div', {
            className: `package-item ${this.getPackageClasses(packageData)}`,
            'data-index': index
        });

        element.innerHTML = `
            <div class="package-image">
                <img src="${ImageUtils.buildImageUrl(packageData.image)}" 
                     alt="${packageData.title}"
                     loading="lazy">
            </div>
            <div class="package-content">
                <h3 class="package-title">${packageData.title}</h3>
                <p class="package-description">${packageData.description}</p>
                <div class="package-includes">
                    ${this.renderPackageIncludes(packageData)}
                </div>
                <div class="package-duration">
                    <img src="${CONFIG.BASE_URL}duration-icon.webp" 
                         alt="Duración" 
                         class="duration-icon">
                    <span>${packageData.duration}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `;

        return element;
    },

    getPackageClasses(packageData) {
        return packageData.categories ? 
            packageData.categories.map(cat => cat.toLowerCase().replace(/\s+/g, '-')).join(' ') : '';
    },

    renderPackageIncludes(packageData) {
        if (!Array.isArray(packageData.includes)) return '';

        return packageData.includes.map(item => `
            <div class="package-includes-item">
                <img src="${CONFIG.BASE_URL}check-icon.webp" 
                     alt="Incluido"
                     loading="lazy">
                <span>${item}</span>
            </div>
        `).join('');
    },

    filterPackages(filter) {
        this.state.currentFilter = filter;
        const packages = document.querySelectorAll('.package-item');

        packages.forEach(packageItem => {
            const display = filter === 'all' || packageItem.classList.contains(filter);
            DOMUtils.setVisible(packageItem, display);
        });

        // Actualizar estado de los botones de filtro
        const filterButtons = document.querySelectorAll('.package-nav button');
        filterButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-filter') === filter);
        });
    },

    showPackageDetails(packageData, index) {
        // Usar el PopupModule para mostrar los detalles
        if (window.PopupModule) {
            window.PopupModule.showPopup(packageData, index, true);
        }
    },

    handlePackageLoadError() {
        const packageList = DOMUtils.getElement('package-list');
        if (packageList) {
            packageList.innerHTML = '<p class="error-message">Error al cargar los paquetes. Por favor, intente más tarde.</p>';
        }
    }
};
