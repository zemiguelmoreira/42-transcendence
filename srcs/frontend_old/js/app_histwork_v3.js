
import { viewToken } from "./login/session.js";
import { home, homeLogin } from "./html/home.js";
import { signIn } from "./login/login.js";
import { register } from "./login/register.js";
import { displayPageError } from "./html/error_page.js";
import { testToken } from "./profile/profile.js";
import { getNamebyId, userDataPage, userData, editPageBtns } from "./profile/myprofile.js";
import { dataUserSearch, userSearchPage, noResults } from "./profile/search_user.js";

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


async function goTo() {
 
	try {
		const accessToken = localStorage.getItem('access_token');
		const payload = testToken(accessToken);
		console.log(payload);
		console.log(payload.user_id);
		let username = await getNamebyId(payload.user_id);
		console.log(username);
		navigateTo(`/user/${username}`);

	} catch(e) {
		e.status = "400";
		e.message = "home page user!";
		navigateTo(`/error/${e.status}/${e.message}`);
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


// function goodbye(e) {
//     if (!e) e = window.e; // Para compatibilidade com IE
//     e.cancelBubble = true;    // IE: impede a propagação do evento
//     e.returnValue = 'Você tem certeza que deseja sair/recarregar esta página?'; // Mensagem de confirmação para IE

//     if (e.stopPropagation) {
//         e.stopPropagation();  // Impede a propagação do evento em navegadores modernos
//         e.preventDefault();   // Cancela a ação padrão (recarregar/sair da página)
//     }
// }


document.addEventListener('DOMContentLoaded', function () {

    window.addEventListener('popstate', (event) => {
        console.log(event.state);
        if (event.state) {
            const matchedRoute = matchRoute(event.state.page);
            if (matchedRoute) {
                matchedRoute.page.loadContent(matchedRoute.params);
            }
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
		}	
    });

	// saveCurrentState();
	// função para o botão de refresh

	//teste
	window.addEventListener('beforeunload', (e) => {
		// saveCurrentState();
		// e.preventDefault();
		console.log('teste reload');
		const defaultState = { page: '/signIn' };  // page que é default state
            history.replaceState(defaultState, '', '/signIn');
		const matchedRoute = matchRoute(defaultState.page);
            if (matchedRoute) {
                matchedRoute.page.loadContent(matchedRoute.params);
			}
	});

	if (!viewToken()) // mudar colocar not para funcionar corretamente
    	navigateTo('/');
	else {
		goTo();
	}



	// const savedState = loadSavedState();
	// console.log(savedState);
	// if (savedState) {
    //     history.replaceState(savedState, '', savedState.page);
    //     const matchedRoute = matchRoute(savedState.page);
    //     if (matchedRoute) {
    //         matchedRoute.page.loadContent(matchedRoute.params);
    //     }
    // } else {
    //     // Verifica o token e navega conforme necessário
    //     if (!viewToken()) {
    //         navigateTo('/');
    //     } else {
    //         goTo();
    //     }
    // }



	// const savedState = loadSavedState();
    // if (savedState) {
    //     history.replaceState(savedState, '', savedState.page);
    // } else {
    //     const initialState = { page: '/' };
    //     history.replaceState(initialState, '', initialState.page);
    // }

    // const currentState = history.state;
    // console.log('Initial state:', currentState);
    // saveCurrentState();

    // if (currentState.page === '/') {
    //     if (!viewToken()) {
    //         navigateTo('/');
    //     } else {
    //         goTo();
    //     }
    // } else {
    //     const matchedRoute = matchRoute(currentState.page);
    //     if (matchedRoute) {
    //         matchedRoute.page.loadContent(matchedRoute.params);
    //     }
    // }

});



const pages = {
    '/': {
        loadContent: home
    },
    '/signIn': {
        loadContent: function() {
            console.log('Loading signIn page content');
            signIn();
        }
    },
    '/register': {
        loadContent: function() {
            console.log('Loading register page content');
            register();
        }
    },
    '/user/:username': {
        loadContent: function(params) {
            console.log('Loading user login page content for', params.username);
			if (viewToken())
            	homeLogin(params.username);
			else
				navigateTo('/signIn');
        }
    },
    '/error/:status/:message': {
        loadContent: function(params) {
            console.log('Loading user error page content for', params.status, params.message);
            const makeError = displayPageError(params.status, params.message);
			document.getElementById('root').innerHTML = '';
			document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', (e) => {
				e. preventDefault();
				navigateTo('/');
			})
        }
    },
	'/user/:username/profile': {
        loadContent: function(params) {
            console.log('Loading user profile page content for', params.username);
			// aantes da entrar na rota verificar na função fetchuserprofile se o token é válido se nãp for vai paar o sigIn
			userDataPage(userData, params.username);

        }
    },
	'/user/:username/profile/edit': {
        loadContent: function(params) {
            console.log('Loading user profile edit page content for', params.username);
			// aantes da entrar na rota verificar na função fetchuserprofile se o token é válido se nãp for vai paar o sigIn
			editPageBtns(userData, params.username);
        }
    },
	'/user/:username/profile/search/:user': {
        loadContent: function(params) {
            console.log('Loading user profile search user page content for', params.username);
			// aantes da entrar na rota verificar na função fetchuserprofile se o token é válido se nãp for vai paar o sigIn
			userSearchPage(dataUserSearch, params.username);
        }
    },
	'/user/:username/profile/search/noresults/:query': {
        loadContent: function(params) {
            console.log('Loading user profile search user page-no results content for', params.username);
			// antes da entrar na rota verificar na função fetchuserprofile se o token é válido se nãp for vai paar o sigIn
			noResults(params.username, params.query);
        }
    },
    // Outras páginas...
};



function navigateTo(url) {
    const matchedRoute = matchRoute(url);
    if (matchedRoute) {
        console.log('navigate url: ', url);
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


export { baseURL, navigateTo }


// Na página de user ligado, temos de verificar os tokens em todos os links, função a utilizar
// função asincrona fetchWithAuth - profile.js