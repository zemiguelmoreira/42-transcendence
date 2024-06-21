
import { viewToken } from "./login/session.js";
import { testToken } from "./profile/profile.js";
import { getNamebyId } from "./profile/myprofile.js";
import { pages } from "./utils/path.js";

const baseURL = "https://localhost/api";
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


async function goTo() {
 
	try {
		const accessToken = localStorage.getItem('access_token');
		const payload = testToken(accessToken);
		console.log(payload);
		console.log(payload.user_id);
		let username = await getNamebyId(payload.user_id);
		console.log(username);
		if (username)
			navigateTo(`/user/${username}`);
		else
			navigateTo('/');
	} catch(e) {
		e.status = "400";
		e.message = "home page user!";
		navigateTo(`/error/${e.status}/${e.message}`);
	} 
}


async function userForHistory() {
 
	try {
		const accessToken = localStorage.getItem('access_token');
		const payload = testToken(accessToken);
		console.log(payload);
		console.log(payload.user_id);
		let username = await getNamebyId(payload.user_id);
		console.log(username);
		return username;
	} catch(e) {
		return null;
	} 
}

//um estado inicial diferente e baseado no token - não utilizada
async function initializeState() {

	let defaultState;

	if (viewToken()) {
		try {
			const username = await userForHistory(); // Espera a resolução da Promise
			if (username) {
				defaultState = { page: `/user/${username}` };
				history.replaceState(defaultState, '', `/user/${username}`);
			} else {
				defaultState = { page: '/' }; // page que é default state
				history.replaceState(defaultState, '', '/');
			}
		} catch (error) {
			console.error("Failed to get username:", error);
			defaultState = { page: '/' }; // page que é default state
			history.replaceState(defaultState, '', '/');
		}
	} else {
		defaultState = { page: '/' }; // page que é default state
		history.replaceState(defaultState, '', '/');
	}

	// Carregue o conteúdo da página padrão
	const matchedRoute = matchRoute(defaultState.page);
	if (matchedRoute) {
		matchedRoute.page.loadContent(matchedRoute.params);
	}
}


// não usada
function saveCurrentState() {
	const currentState = history.state;
	console.log(currentState);
	if (currentState) {
		localStorage.setItem('currentState', JSON.stringify(currentState));
	}
}


// não usada
function loadSavedState() {
	const savedState = localStorage.getItem('currentState');
	console.log(savedState);
	if (savedState) {
		return JSON.parse(savedState);
	}
	return null;
}


document.addEventListener('DOMContentLoaded', function (e) {

	// e.preventDefault();

    window.addEventListener('popstate', (e) => {
        console.log(e.state);
        if (e.state) {
            const matchedRoute = matchRoute(e.state.page);
            if (matchedRoute) {
                matchedRoute.page.loadContent(matchedRoute.params);
            }
        } 
		else {
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

			// initializeState();
		}	
    });



	// Detecta a URL atual e carrega o estado apropriado

	// const initialPath = window.location.pathname;
	// console.log(initialPath);
	// const initialRoute = matchRoute(initialPath);
	// console.log(initialRoute);
	// if (initialRoute) {
	// 	history.replaceState({ page: initialPath }, '', initialPath);
	// } else {
	// 	// Se a rota não for encontrada, carregue a página padrão
	// 	navigateTo('/');
	// }



	//teste
	// window.addEventListener('beforeunload', (e) => {
	// 	// saveCurrentState();
	// 	// e.stopPropagation();
	// 	e.preventDefault();
	// 	console.log('teste reload');
	// 	const defaultState = { page: '/' };  // page que é default state
    //         history.replaceState(defaultState, '', '/');
	// 	const matchedRoute = matchRoute(defaultState.page);
    //         if (matchedRoute) {
    //             matchedRoute.page.loadContent(matchedRoute.params);
	// 		}
	// });


	// desativa o F5 e i ctrlKey + r
	document.addEventListener('keydown', function(e) {
		if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
			e.preventDefault();
			alert("A atualização da página foi desabilitada.");
		}
	});

	if (!viewToken()) // mudar colocar not para funcionar corretamente
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


function navigateTo(url, replace=false) {

    const matchedRoute = matchRoute(url);

    if (matchedRoute) {
        console.log('navigate url: ', url);

		if (replace)
			history.replaceState({page: '/'}, '', '/');
		else
        	history.pushState({ page: url }, '', url);

        matchedRoute.page.loadContent(matchedRoute.params);
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