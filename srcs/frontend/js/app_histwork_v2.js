
import { viewToken } from "./login/session.js";
import { home, homeLogin } from "./html/home.js";
import { handleSignIn } from "./login/login.js";
import { register } from "./login/register.js";

const baseURL = "http://127.0.0.1:8000";
const gameScript = `<script id="game" src="./js/game/pong.js"></script>`;

// let data;

function makeGame(gamelink) {
	gamelink.addEventListener('click', newpage);
}

//Verificar se o data-value não é zero

function deactivateLinks(links) {
	console.log('desativar links', viewToken());
	if (!viewToken()) {
		for (let link of links) {
			if (link.dataset.value) {
				link.style.pointerEvents = 'none';
				link.style.cursor = 'default';
			}
		}
	}
}


document.addEventListener('DOMContentLoaded', function () {

	window.addEventListener('popstate', (event) => {
	  console.log(event.state);
	//   console.log(event.state.page);

	  if (event.state) 
	  {
		const page = pages[event.state.page];
		// if(event.state.page === '/')
		// 	history.replaceState({ page: '/' }, '', '/');
		if (page)
		  page.loadContent();
	  } 
	  else 
	  {
		console.log('aqui');
		history.replaceState( null, '', '/'); //posso ter de retirar no teste geral
		return;
	  }
	});

	navigateTo('/');
	
});

const pages = {
	'/': {
		loadContent: home
	},
	'/signIn': {
		loadContent: function() {
			console.log('Loading signIn page content');
			handleSignIn();
			// Lógica para carregar o conteúdo da página de signIn
		}
	},
	'/register': {
		loadContent: function() {
			console.log('Loading register page content');
			register();
			// Lógica para carregar o conteúdo da página de signIn
		}
	},
	'/login': {
		loadContent: function() {
			console.log('Loading user login page content');
			homeLogin();
			// Lógica para carregar o conteúdo da página de signIn
		}
	},
	// Outras páginas...
};

function navigateTo(url) {
	if (pages[url]) 
	{
		console.log('navigate url: ', url);

		history.pushState({ page: url }, '', url);
		// if (url !== '/')
		// 	history.pushState({ page: url }, '', url);
		// else if (url === '/')
		// 	history.replaceState({ page: '/' }, '', '/');

		pages[url].loadContent();

	} else {
		console.error('Page not found: ' + url);
	}
}


export { baseURL, navigateTo }
