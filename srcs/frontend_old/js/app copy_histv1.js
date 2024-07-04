
import { navbar1, navbar2 } from "./html/navbar.js";
import { viewToken } from "./login/session.js";
import { home } from "./html/home.js";
import { handleSignIn } from "./login/login.js"

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


// if (location.pathname !== '/' && location.pathname !== '/index.html') {
// 	history.replaceState(null, '', '/');
// }


document.addEventListener('DOMContentLoaded', function () {

	// history.pushState({ page: '/' }, '', '/');
	// if (!history.state) {
    //     history.replaceState({ page: '/' }, '', '/');
    // }
	// navigateTo('/');
  
	window.addEventListener('popstate', (event) => {
	  console.log(event.state);
	//   console.log(event.state.page);

	  if (event.state) 
	  {
		const page = pages[event.state.page];
		if(event.state.page === '/')
			history.replaceState({ page: '/' }, '', '/');
		if (page)
		  page.loadContent();
	  } 
	  else 
	  {
		console.log('aqui');
		history.replaceState( null, '', '/');
		return;
		const page = pages['/'];
		// if (page) {
		//   page.loadContent();
		//   history.replaceState({ page: '/' }, '', '/');
		// }
	  }
	});

	// history.replaceState({ page: '/' }, '', '/');

	navigateTo('/');

	
	// window.addEventListener('popstate', (event) => {
	// 	console.log(event.state);
	// 	if (event.state) {
	// 		history.replaceState({ url: event.state.url }, '', event.state.url);
	// 		const page = pages[event.state.url];
	// 		if (!page)
	// 			return;
	// 		page.loadContent();
	// 	}
	// 	else {
	// 		history.replaceState({ url: '/' }, '', '/');
	// 		const page = pages[event.state.url];
	// 		if (!page)
	// 			return;
	// 		page.loadContent();
	// 	}
	// });
	
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
	// Outras páginas...
};

function navigateTo(url) {
	if (pages[url]) {
		if (url !== '/')
			history.pushState({ page: url }, '', url);
		else if (url === '/')
			history.replaceState({ page: '/' }, '', '/');

		pages[url].loadContent();
	} else {
		console.error('Page not found: ' + url);
	}
}


export { baseURL, navigateTo }
