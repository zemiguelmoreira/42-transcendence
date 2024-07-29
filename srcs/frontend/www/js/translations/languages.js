import { words_pt } from "./i18n/pt.js";
import { words_en } from "./i18n/en.js";

class Languages {


	static instance = null;
	
	defaultLanguage = 'en';
	translations = {};
    
	
	static getInstance() {
		if (!Languages.instance) {
			Languages.instance = new Languages();
		}
		return Languages.instance;
	}
    
    
	constructor() {
		this.currentLanguage = this.defaultLanguage;
		this.init();
	}
    
    
	init() {
		const browserLanguage = this.getBrowserLanguage();
		this.setLanguage(browserLanguage);
	  }
	
	
	getBrowserLanguage() {
		const language = navigator.language || navigator.userLanguage || 'en';
		console.log('language: ', language.split('-')[0]);
		return language.split('-')[0]; // para ter em conta o seguinte (ver browser), 'en-US' -> 'en'
	}

	
	loadTranslations(language) {

		console.log('language to fetch: ', language);
		let response;

		if (language === 'pt')
			response = words_pt;
        else
            response = words_en;

		this.translations[language] = response
		console.log(this.translations[language]);
	}

	
	setLanguage(language) {
		if (!this.translations[language]) {
		  this.loadTranslations(language);
		}
		this.currentLanguage = language;
		console.log('current in set: ', this.currentLanguage);
		// this.applyTranslations();
	}


	// colocar o atributo data-i18n no elemento html
	applyTranslations(page) {
		console.log('teste languages');
		const elements = document.querySelectorAll('[data-i18n]');
		console.log(elements);
		console.log('current: ', this.currentLanguage);
		elements.forEach(element => {
		  const key = element.getAttribute('data-i18n');
		  if (this.translations[this.currentLanguage][page][key]) {
			element.textContent = this.translations[this.currentLanguage][page][key];
		  }
		});
	  }

	changeLanguage(language) {
		this.setLanguage(language);
	}


}

const Language = Languages.getInstance();

export default Language;