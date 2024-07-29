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

async function home_button() {
	try {
		// Lógica para mostrar o autenticador após o login correto
		document.getElementById('mainContent').innerHTML = `
			<div class="card" style="width: 18rem;">
				<img src="../files/minipong.png" class="card-img-top" alt="...">
				<div class="card-body">
					<h5 class="card-title">PONG</h5>
					<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
					<a href="#" class="btn btn-primary card-btn pong-button">Let's Play</a>
				</div>
			</div>

			<div class="card" style="width: 18rem;">
				<img src="../files/mini2snake.png" class="card-img-top" alt="...">
				<div class="card-body">
					<h5 class="card-title">SNAKE</h5>
					<p class="card-text">Game where a "snake" eats food to grow and must avoid walls, enemy and itself.</p>
					<a href="#" class="btn btn-primary card-btn snake-button" >Let's Play</a>
				</div>
			</div>

			<div class="card" style="width: 18rem;">
				<img src="../files/minichat.png" class="card-img-top" alt="...">
				<div class="card-body">
					<h5 class="card-title">CHAT</h5>
					<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
					<a href="#" class="btn btn-primary card-btn">Let's Talk</a>
				</div>
			</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
}

let snakeScriptLoaded = false; // Variável para rastrear se o script foi carregado

async function snakeGame() {
    try {
        const response = await fetch('../snake.html');
        if (response.ok) {
			console.log("FETCH SNAKE HTML OK")
            const content = await response.text();
            document.getElementById('mainContent').innerHTML = content;

            // Verificar se o script já foi carregado
            if (!snakeScriptLoaded) {
                const scriptElement = document.createElement('script');
                scriptElement.src = '../js/snake.js';
                scriptElement.onload = () => {
                    snakeScriptLoaded = true;
                };
                scriptElement.onerror = () => {
                    console.error('Erro ao carregar o script snake.js');
                };
                document.body.appendChild(scriptElement);
            } else {
                // Se o script já foi carregado, executa o código manualmente
                // Se o script não for executado automaticamente após o carregamento,
                // você pode chamar funções específicas diretamente aqui.
                // Por exemplo:
                if (typeof initializeSnakeGame === 'function') {
                    initializeSnakeGame(); // Chame uma função de inicialização definida em snake.js
                }
            }
        } else {
            console.error('Erro ao carregar o arquivo snake.html');
        }
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

async function snakeGameOptions() {
    try {
		document.getElementById('mainContent').innerHTML = `
		<div class="organize">
			<div class="organize-title">SNAKE OPTIONS</div>
			<div class="home-box">
				<div class="card" style="width: 18rem;">
					<img src="../files/local_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">LOCAL DUEL</h5>
						<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
						<a href="#" class="btn btn-primary card-btn" id="snakeGame">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../files/online_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">MULTIPLAYER</h5>
						<p class="card-text">Game where a "snake" eats food to grow and must avoid walls, enemy and itself.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../files/tournment.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">TOURNMENT</h5>
						<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Talk</a>
					</div>
				</div>
			</div>
		</div>
		`;
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

// async function snakeGameOptions() {
//     // Função para adicionar event listeners aos botões
//     function addEventListenersToButtons() {
//         const buttons = document.querySelectorAll('.snake-button');

//         buttons.forEach(button => {
//             button.addEventListener('click', async function (event) {
//                 event.preventDefault();

//                 // Carregar dinamicamente o CSS
//                 const linkElement = document.createElement('link');
//                 linkElement.rel = 'stylesheet';
//                 linkElement.href = './css/snake.css';
//                 document.head.appendChild(linkElement);

//                 // Carregar o conteúdo HTML
//                 try {
//                     const response = await fetch('./snake-options.html');
//                     if (response.ok) {
//                         const content = await response.text();
//                         document.getElementById('mainContent').innerHTML = content;

//                         // Reatribuir event listeners aos novos botões
//                         addEventListenersToButtons();

//                         // Inserir dinamicamente o script do jogo
//                         const scriptElement = document.createElement('script');

//                         document.body.appendChild(scriptElement);
//                     } else {
//                         console.error('Erro ao carregar o arquivo snake-options.html');
//                     }
//                 } catch (error) {
//                     console.error('Erro ao carregar o conteúdo:', error);
//                 }
//             });
//         });
//     }
//     // Adicionar event listeners aos botões na carga inicial da página
//     addEventListenersToButtons();
// }

async function pongGame() {
    try {
        const response = await fetch('./pong.html');
        if (response.ok) {
            const content = await response.text();
            document.getElementById('mainContent').innerHTML = content;

            // Verificar se o script já foi carregado
            if (!snakeScriptLoaded) {
                const scriptElement = document.createElement('script');
                scriptElement.src = './js/pong.js';
                scriptElement.onload = () => {
                    snakeScriptLoaded = true;
                };
                scriptElement.onerror = () => {
                    console.error('Erro ao carregar o script pong.js');
                };
                document.body.appendChild(scriptElement);
            } else {
                // Se o script já foi carregado, executa o código manualmente
                // Se o script não for executado automaticamente após o carregamento,
                // você pode chamar funções específicas diretamente aqui.
                // Por exemplo:
                if (typeof initializeSnakeGame === 'function') {
                    initializeSnakeGame(); // Chame uma função de inicialização definida em snake.js
                }
            }
        } else {
            console.error('Erro ao carregar o arquivo pong.html');
        }
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

async function pongGameOptions() {
    try {
		document.getElementById('mainContent').innerHTML = `
		<div class="organize">
			<div class="organize-title">PONG OPTIONS</div>
			<div class="home-box">
				<div class="card" style="width: 18rem;">
					<img src="../files/local_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">LOCAL DUEL</h5>
						<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
						<a href="#" class="btn btn-primary card-btn" id="pongGame">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../files/online_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">MULTIPLAYER</h5>
						<p class="card-text">Game where a "pong" eats food to grow and must avoid walls, enemy and itself.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../files/tournment.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">TOURNMENT</h5>
						<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Talk</a>
					</div>
				</div>
			</div>
		</div>
		`;
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}snakeGame

async function profile() {

	// Carregar o conteúdo HTML
	try {
		const response = await fetch('./profile.html');
		if (response.ok) {
			const content = await response.text();
			document.getElementById('mainContent').innerHTML = content;

			// Encontrar e executar os scripts dentro do conteúdo carregado
			const scriptTags = document.getElementById('mainContent').getElementsByTagName('script');
			for (const scriptTag of scriptTags) {
				const newScript = document.createElement('script');
				newScript.text = scriptTag.text;
				document.body.appendChild(newScript);
			}
		} else {
			console.error('Erro ao carregar o arquivo profile.html');
		}
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
};

document.addEventListener('DOMContentLoaded', function (e) {
	
	console.log("EVENT LISTENER")

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
	// document.addEventListener('keydown', function (e) {
	// 	if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
	// 		e.preventDefault();
	// 		alert("A atualização da página foi desabilitada.");
	// 	}
	// });

	// verificar periodicamente se o refresh token está válido
	setInterval(verifyToken, 1800000); // 5000 milisegundos = 5s conversão miliseg = minutosx60x1000
	
	if (!viewTokenRefresh()) // mudar colocar not para funcionar corretamente
		navigateTo('/');
	else {
		goTo();
	}



	// Adicionar delegação de eventos ao body para capturar eventos de elementos dinamicamente carregados
	document.body.addEventListener('click', (e) => {

		// Verificar se o elemento clicado tem a classe 'snake-button'
		if (e.target.classList.contains('snake-button')) {
			e.preventDefault();
			snakeGameOptions(); // Chama a função snakeGameOptions quando um botão 'snake-button' é clicado
		}

		// Verificar se o elemento clicado tem o ID 'snakeGame'
		if (e.target.id === 'snakeGame') {
			e.preventDefault();
			snakeGame(); // Chama a função snakeGame quando o botão 'snakeGame' é clicado
		}

		// Verificar se o elemento clicado tem a classe 'snake-button'
		if (e.target.classList.contains('pong-button')) {
			e.preventDefault();
			pongGameOptions(); // Chama a função pongGameOptions quando um botão 'pong-button' é clicado
		}

		// Verificar se o elemento clicado tem o ID 'pongGame'
		if (e.target.id === 'pongGame') {
			e.preventDefault();
			pongGame(); // Chama a função pongGame quando o botão 'pongGame' é clicado
		}

		// Verificar se o elemento clicado tem o ID 'homeButton'
		if (e.target.id === 'homeButton') {
			e.preventDefault();
			home_button(); // Chama a função homepage quando o botão 'homeButton' é clicado
		}

		if (e.target.id === 'viewProfile') {
			e.preventDefault();
			profile(); // Chama a função homepage quando o botão 'homeButton' é clicado
		}

	});
	
});


// document.getElementById('homeButton').addEventListener('click', home_button);

export { baseURL, navigateTo, goTo, matchRoute }

// Na página de user ligado, temos de verificar os tokens em todos os links, função a utilizar
// função asincrona fetchWithAuth - profile.js