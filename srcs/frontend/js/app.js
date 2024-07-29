import { viewToken, viewTokenRefresh, testToken, verifyToken } from "./utils/tokens.js";
import { getNamebyId } from "./profile/myprofile.js";
import { pages } from "./routes/path.js";
import { refreshAccessToken } from "./utils/fetchWithToken.js";
import WebSocketInstance from "./socket/websocket.js";
import Language from "./translations/languages.js";

// const baseURL = "https://localhost/user";
const baseURL = "https://localhost/api";

//Verificar se o data-value não é zero

async function goTo() {
	try {
		const refreshToken = localStorage.getItem('refresh_token');
		if (testToken(refreshToken)) {
			await refreshAccessToken(); // faz o refresh do access token  se o refresh token etiver válido
			const accessToken = localStorage.getItem('access_token');
			const payload = testToken(accessToken);
			console.log(payload);
			// se o token estiver expirado
			if (!payload) {
				navigateTo('/');
				return;
			}
			console.log(payload.user_id);
			let username = await getNamebyId(payload.user_id);
			console.log(username);
			if (username) {
				navigateTo(`/user/${username}`);
				WebSocketInstance.connect();
			}
			else
				navigateTo('/');
		} else {
			navigateTo('/');
		}
	} catch (e) {
		e.status = "400";
		e.message = "home page user! function goTo";
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

document.addEventListener('DOMContentLoaded', function (e) {
	// e.preventDefault();
	window.addEventListener('popstate', (e) => {
		console.log(e.state);
		if (e.state) {
			const matchedRoute = matchRoute(e.state.page);
			console.log('matchedRoute: ', matchedRoute);
			const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
			console.log('init access: ', accessAllowed);
			if (matchedRoute && accessAllowed) {
				matchedRoute.page.loadContent(matchedRoute.params);
			} else
				navigateTo(e.state.page); // se não tivermos acesso à rota através do navigate fazemos o redirect
		} else {
			// console.log('aqui');
			// history.replaceState(null, '', '/');
			// return;
			console.log('aqui');
			// tenho de definir um default state para o event.state quando for null
			const defaultState = { page: '/' };  // page que é default state
			history.replaceState(defaultState, '', '/');
			// Carregue o conteúdo da página padrão
			const matchedRoute = matchRoute(defaultState.page);
			if (matchedRoute) {
				matchedRoute.page.loadContent(matchedRoute.params);
			}
			// 	// initializeState();
		}
	});
	// desativa o F5 e i ctrlKey + r
	document.addEventListener('keydown', function (e) {
		if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
			e.preventDefault();
			alert("A atualização da página foi desabilitada.");
		}
	});
	// verificar periodicamente se o refresh token está válido
	setInterval(verifyToken, 1800000); // 5000 milisegundos = 5s conversão miliseg = minutosx60x1000
	
	if (!viewTokenRefresh()) // mudar colocar not para funcionar corretamente
		navigateTo('/');
	else {
		goTo();
	}
});

// function navigateTo(url) {
//     const matchedRoute = matchRoute(url);
//     if (matchedRoute) {
//         console.log('navigate url: ', url);
//         history.pushState({ page: url }, '', url);
//         matchedRoute.page.loadContent(matchedRoute.params);
//     } else {
//         console.error('Page not found: ' + url);
//     }
// }

// function navigateTo(url, replace=false) {
//     const matchedRoute = matchRoute(url);
// 	console.log('matchedroute: ', matchedRoute);
//     if (matchedRoute) {
//         console.log('navigate url: ', url);
// 		if (replace)
// 			history.replaceState({page: '/'}, '', '/');
// 		else
//         	history.pushState({ page: url }, '', url);
//         matchedRoute.page.loadContent(matchedRoute.params);
//     } else {
//         console.error('Page not found: ' + url);
//     }
// }

// Esta função navigate faz o redirect e permite verificar está acessivel ou nao
// ter em atenção que se existir redirect tenho que ter o replace em true 
// O redirect é feita em principio par a rota home para uma melhor experiência.

function navigateTo(url, replace = false, redirectsCount = 0) {
	const MAX_REDIRECTS = 10; // Limite de redirecionamentos
	console.log('redirects: ', redirectsCount);
	//Protect againts too many redirects only too console
	// a colocar apage de erro para tratar
	if (redirectsCount > MAX_REDIRECTS) {
		console.error('Too many redirects');
		return;
	}
	const matchedRoute = matchRoute(url);
	console.log('matchedroute: ', matchedRoute);
	if (matchedRoute) {
		console.log('navigate url: ', url);
		const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
		console.log(accessAllowed);
		if (!accessAllowed) {
			// history.replaceState({page: matchedRoute.page.redirect}, '', matchedRoute.page.redirect);
			console.log('route1');
			navigateTo(matchedRoute.page.redirect, true, redirectsCount + 1);
			return;
		}
		else {
			if (replace)
				// history.replaceState({page: '/'}, '', '/');
				history.replaceState({ page: url }, '', url);
			else
				history.pushState({ page: url }, '', url);
			console.log('route2');
			matchedRoute.page.loadContent(matchedRoute.params);
			return;
		}
	} else {
		console.error('Page not found: ' + url);
	}
}

function matchRoute(route) {
	for (let path in pages) {
		const paramNames = [];
		const regexPath = path.replace(/:([^\/]+)/g, (full, key) => {
			paramNames.push(key);
			return '([^\\/]+)';
		});
		const regex = new RegExp('^' + regexPath + '$');
		console.log('regex: ', regex);
		const match = route.match(regex);
		console.log('match: ', match);
		if (match) {
			const params = {};
			paramNames.forEach((name, index) => {
				params[name] = match[index + 1];
			});
			return { page: pages[path], params: params };
		}
	}
	return null;
}

export { baseURL, navigateTo, goTo, matchRoute }

// Na página de user ligado, temos de verificar os tokens em todos os links, função a utilizar
// função asincrona fetchWithAuth - profile.js