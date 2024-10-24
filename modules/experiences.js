// modules/experiences.js
import CONFIG from '../config/config.js';
import { DOMUtils } from '../utils/dom.js';
import { EventUtils } from '../utils/events.js';
import { ImageUtils } from '../utils/image.js';
import { Logger } from '../utils/logger.js';

export const ExperiencesModule = {
    state: {
        experiences: [],
        currentExperience: null
    },

    async initialize() {
        try {
            await this.loadExperiences();
            this.setupEventListeners();
            this.renderExperiences();
            return true;
        } catch (error) {
            Logger.error('Error initializing experiences module:', error);
            return false;
        }
    },

    async loadExperiences() {
        try {
            const response = await fetch('data/experiences.json');
            const data = await response.json();
            this.state.experiences = data.experiences;
            
            // Precargar imágenes
            this.preloadExperienceImages();
            
            return true;
        } catch (error) {
            Logger.error('Error loading experiences:', error);
            this.handleExperienceLoadError();
            return false;
        }
    },

    preloadExperienceImages() {
        const imagesToPreload = new Set();
        
        this.state.experiences.forEach(exp => {
            if (exp.image) {
                imagesToPreload.add(ImageUtils.buildImageUrl(exp.image));
            }
            if (exp.backgroundImage) {
                imagesToPreload.add(ImageUtils.buildImageUrl(exp.backgroundImage));
            }
        });

        return ImageUtils.preloadImages(Array.from(imagesToPreload));
    },

    setupEventListeners() {
        EventUtils.delegate(
            document.body,
            '.experience-item .saber-mas-button',
            'click',
            (event, button) => {
                const expElement = button.closest('.experience-item');
                if (!expElement) return;

                const index = parseInt(expElement.dataset.index, 10);
                const experience = this.state.experiences[index];
                this.showExperienceDetails(experience, index);
            }
        );
    },

    renderExperiences() {
        const container = document.querySelector('.experiences-grid');
        if (!container) return;

        DOMUtils.clearContainer(container);

        const fragment = document.createDocumentFragment();
        
        this.state.experiences.forEach((exp, index) => {
            const expElement = this.createExperienceElement(exp, index);
            fragment.appendChild(expElement);
        });

        container.appendChild(fragment);
    },

    createExperienceElement(experience, index) {
        const element = DOMUtils.createElement('div', {
            className: 'experience-item',
            'data-index': index
        });

        element.innerHTML = `
            <div class="experience-image">
                <img src="${ImageUtils.buildImageUrl(experience.image)}" 
                     alt="${experience.title}"
                     loading="lazy">
            </div>
            <div class="experience-content">
                <h3 class="experience-title">${experience.title}</h3>
                <p class="experience-description">${experience.description}</p>
                <div class="experience-highlights">
                    ${this.renderHighlights(experience)}
                </div>
                <div class="experience-duration">
                    <img src="${CONFIG.BASE_URL}duration-icon.webp" 
                         alt="Duración" 
                         class="duration-icon">
                    <span>${experience.duration}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `;

        return element;
    },

    renderHighlights(experience) {
        if (!Array.isArray(experience.highlights)) return '';

        return experience.highlights.map(highlight => `
            <div class="experience-highlight">
                <img src="${CONFIG.BASE_URL}highlight-icon.webp" 
                     alt="${highlight}"
                     loading="lazy">
                <span>${highlight}</span>
            </div>
        `).join('');
    },

    showExperienceDetails(experience, index) {
        this.state.currentExperience = experience;
        
        // Usar el PopupModule para mostrar los detalles
        if (window.PopupModule) {
            window.PopupModule.showPopup(experience, index);
        }
    },

    handleExperienceLoadError() {
        const container = document.querySelector('.experiences-grid');
        if (container) {
            container.innerHTML = '<p class="error-message">Error al cargar las experiencias. Por favor, intente más tarde.</p>';
        }
    }
};
