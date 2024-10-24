import { viewTokenRefresh, testToken, verifyToken } from "./utils/tokens.js";
import { getNamebyId } from "./profile/myprofile.js";
import { pages } from "./routes/path.js";
import { refreshAccessToken } from "./utils/fetchWithToken.js";
import { getParams } from "./login/login42.js";
import { changeChatLoaded } from "./home/home.js";
import { homeLogin } from "./home/home.js";
import { matchmakingSocketPong } from "./games/pong-pages.js";
import { matchmakingSocketSnake } from "./games/snake-pages.js";
import { invitedUser } from "./chat/utils_chat.js";
import chatSocketInstance from "./chat/chat_socket.js";

const baseURL = `https://${window.location.host}/api`;

async function goTo() {
	try {
		const refreshToken = localStorage.getItem('refresh_token');
		if (testToken(refreshToken)) {
			await refreshAccessToken();
			const accessToken = localStorage.getItem('access_token');
			const payload = testToken(accessToken);
			if (!payload) {
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				sessionStorage.removeItem('access_token');
				navigateTo('/');
				return;
			}
			let username = await getNamebyId(payload.user_id);
			if (username) {
				console.log('teste goto');
				changeChatLoaded();
				navigateTo(`/user/${username}`);
			}
			else {
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				sessionStorage.removeItem('access_token');
				navigateTo('/');
			}
		} else {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			sessionStorage.removeItem('access_token');
			navigateTo('/');
		}
		return;
	} catch (e) {
		e.status = "400";
		e.message = "home page user! function goTo";
		navigateTo(`/error/${e.status}/${e.message}`);
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		sessionStorage.removeItem('access_token');
		return;
	}
}

function navigateTo(url, replace = false, redirectsCount = 0) {
	const MAX_REDIRECTS = 10;
	if (redirectsCount > MAX_REDIRECTS) {
		console.error('Too many redirects');
		return;
	}
	const matchedRoute = matchRoute(url);
	console.log('matchedRoute',matchedRoute);

	if (matchedRoute && (url !== `/user/${matchedRoute.params.username}/chat-playing`)) {
		if (invitedUser) {
			const cancelMessage = {
				"type": "cancel_invite",
				"recipient": invitedUser,
			};
			chatSocketInstance.send(cancelMessage);
			const removeDivInvite = document.getElementById('invitePending');
			console.log('elemento a remover: '. removeDivInvite);
			if (removeDivInvite)
				removeDivInvite.remove();
		}
	}

	if (matchedRoute && (url !== `/user/${matchedRoute.params.username}/pong-game-remote`)) {
		console.log('desligar socket matchmaking pong - navigate, por rota errada');
		if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
			matchmakingSocketPong.close();
		}
	}

	if (matchedRoute && (url !== `/user/${matchedRoute.params.username}/snake-game-remote`)) {
		console.log('desligar socket matchmaking snake - navigate, por rota errada');
		if (matchmakingSocketSnake && matchmakingSocketSnake.readyState !== WebSocket.CLOSED) {
			matchmakingSocketSnake.close();
		}

	}

	if (matchedRoute) {
		const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
		if (!accessAllowed) {
			navigateTo(matchedRoute.page.redirect, true, redirectsCount + 1);
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			sessionStorage.removeItem('access_token');
			return;
		}
		else {

			if (replace)
				history.replaceState({ page: url }, '', url);
			else
				history.pushState({ page: url }, '', url);

			matchedRoute.page.loadContent(matchedRoute.params);
			return;
		}
	} else {
		console.error('Page not found: ' + url);
		const status = 404;
		const message = "Page not found.";
		navigateTo(`/error/${status}/${message}`);
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
		const match = route.match(regex);
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

document.addEventListener('DOMContentLoaded', async function (e) {
	window.addEventListener('popstate', async (e) => {
		console.log('state: ', e.state);
		if (e.state) {
			const matchedRoute = matchRoute(e.state.page);
			console.log('state: ', e.state);
			console.log('matchedroute history: ', matchedRoute);

			if (matchedRoute && (e.state.page !== `/user/${matchedRoute.params.username}/chat-playing`)) {
				if (invitedUser) {
					console.log('invitedUser dtected: ', invitedUser);
					const cancelMessage = {
						"type": "cancel_invite",
						"recipient": invitedUser,
					};
					chatSocketInstance.send(cancelMessage);
					const removeDivInvite = document.getElementById('invitePending');
					console.log('elemento a remover: '. removeDivInvite);
					if (removeDivInvite) {
						console.log('existe o removeDivInvite: ', removeDivInvite);
						removeDivInvite.remove();
					}
				}
			}

			if (matchedRoute && (e.state.page !== `/user/${matchedRoute.params.username}/pong-game-remote`)) {
				console.log('desligar socket matchmaking pong - history, por rota errada');
				if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
					matchmakingSocketPong.close();
				}
			}

			if (matchedRoute && (e.state.page !== `/user/${matchedRoute.params.username}/snake-game-remote`)) {
				console.log('desligar socket matchmaking snake - history, por rota errada');
				if (matchmakingSocketSnake && matchmakingSocketSnake.readyState !== WebSocket.CLOSED) {
					matchmakingSocketSnake.close();
				}
			}

			const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
			if (accessAllowed && (e.state.page === "/signIn" || e.state.page === "/")){
				if (!localStorage.getItem('access_token')) {
					matchedRoute.page.loadContent(matchedRoute.params);
				} else {

					if (window.location.pathname === "/signIn" || window.location.pathname === "/") {

						console.log(' location no history vindo do user: ', window.location.pathname);
						localStorage.removeItem('access_token');
						localStorage.removeItem('refresh_token');
						sessionStorage.removeItem('access_token');
						matchedRoute.page.loadContent(matchedRoute.params);
						return;
					}

					const refreshToken = localStorage.getItem('refresh_token');
					if (testToken(refreshToken)) {
						await refreshAccessToken();
						const accessToken = localStorage.getItem('access_token');
						const payload = testToken(accessToken);
						if (!payload) {
							navigateTo('/', true);
							return;
						}
						let username = await getNamebyId(payload.user_id);
						if (username) {
							console.log('teste refresh');
							console.log('page to replace: ', window.location.pathname);

							changeChatLoaded();
							navigateTo(`/user/${username}`);
						}
						else {
							navigateTo('/');
							localStorage.removeItem('access_token');
							localStorage.removeItem('refresh_token');
							sessionStorage.removeItem('access_token');
						}
					} else {
						navigateTo('/');
						localStorage.removeItem('access_token');
						localStorage.removeItem('refresh_token');
						sessionStorage.removeItem('access_token');
					}
				}
				return;
			}
			if (e.state.page === "/") {
				changeChatLoaded();
				return;
			}
			if (matchedRoute && accessAllowed) {
				if (e.state.page === `/user/${matchedRoute.params.username}/chat-playing`) {
					const newState = { page: `/user/${matchedRoute.params.username}` };
					history.replaceState(newState, '', `/user/${matchedRoute.params.username}`);
					homeLogin(matchedRoute.params.username);
					return;
				}
				console.log('teste history not navigate');
				matchedRoute.page.loadContent(matchedRoute.params);
			} else {
				console.log('teste history navigate');
				navigateTo(e.state.page);
			}
		} else {

				console.log('pathname state null: ', window.location.pathname);
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				sessionStorage.removeItem('access_token');
				navigateTo('/', true);
		}
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
			e.preventDefault();
			alert("A atualização da página foi desabilitada.");
		}
	});
	setInterval(verifyToken, 1800000);
	window.addEventListener('message', (e) => {
		const info = e.data;
		getParams(info.code);
	});
	if (window.location.pathname && window.location.pathname === "/callback") {
		let code;
		let state;
		if (window.location.search) {
			const params = new URLSearchParams(window.location.search);
			code = params.get('code');
			state = params.get('state');
		}
		if (code) {
			const params = {
				code: code,
				state: state
			}
			window.opener.postMessage(params, `https://${window.location.host}`);
		}
		window.close();
	}

	console.log('pathname: ', window.location.pathname);
	console.log('matchroute: ', matchRoute(window.location.pathname));

	const currentPath = window.location.pathname;
	const matchedRoute = matchRoute(currentPath);

	if (matchedRoute && (window.location.pathname !== `/user/${matchedRoute.params.username}/pong-game-remote`)) {
		console.log('desligar socket matchmaking pong - refresh, por rota errada');
		if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
			matchmakingSocketPong.close();
		}

	}

	if (matchedRoute && (window.location.pathname !== `/user/${matchedRoute.params.username}/snake-game-remote`)) {
		console.log('desligar socket matchmaking snake - refresh, por rota errada');
		if (matchmakingSocketSnake && matchmakingSocketSnake.readyState !== WebSocket.CLOSED) {
			matchmakingSocketSnake.close();
		}

	}

	if (matchedRoute) {

		if (!viewTokenRefresh()) {
			console.log('teste');
			localStorage.removeItem('access_token');
			sessionStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			navigateTo(window.location.pathname);

		} else if (window.location.pathname && window.location.pathname === "/signIn") {

			console.log('teste1');
			localStorage.removeItem('access_token');
			sessionStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			navigateTo(window.location.pathname);

		} else if (window.location.pathname && window.location.pathname !== "/") {

			const refreshToken = localStorage.getItem('refresh_token');
			if (testToken(refreshToken)) {
				await refreshAccessToken();
				const accessToken = localStorage.getItem('access_token');
				const payload = testToken(accessToken);
				if (!payload) {
					navigateTo('/', true);
					localStorage.removeItem('access_token');
					localStorage.removeItem('refresh_token');
					sessionStorage.removeItem('access_token');
					return;
				}
				let username = await getNamebyId(payload.user_id);
				if (username !== matchedRoute.params.username) {
					const status = 404;
					const message = "Page not found.";
					navigateTo(`/error/${status}/${message}`);
					return;
				}
				if (username) {
					console.log('teste refresh');
					console.log('page to replace: ', window.location.pathname);

					if (matchedRoute && (window.location.pathname !== `/user/${matchedRoute.params.username}/chat-playing`)) {
						if (invitedUser) {
							const cancelMessage = {
								"type": "cancel_invite",
								"recipient": invitedUser,
							};
							chatSocketInstance.send(cancelMessage);
							const removeDivInvite = document.getElementById('invitePending');
							console.log('elemento a remover: '. removeDivInvite);
							if (removeDivInvite) {
								console.log('existe o removeDivInvite: ', removeDivInvite);
								removeDivInvite.remove();
							}
						}
					}
					if (matchedRoute && (window.location.pathname === `/user/${matchedRoute.params.username}/chat-playing`)) {
						changeChatLoaded();
						navigateTo(`/user/${matchedRoute.params.username}`);
						return;
					}
					const pathState = { 'page': window.location.pathname};
					history.replaceState(pathState, '', window.location.pathname);
					changeChatLoaded();
					const test = await homeLogin(username);
					console.log('slidingMessage: ', document.getElementById('slidingMessage'));
					console.log('teste: ', test);

					navigateTo(window.location.pathname, true);
				}
				else {
					navigateTo('/');
					localStorage.removeItem('access_token');
					localStorage.removeItem('refresh_token');
					sessionStorage.removeItem('access_token');
				}
			} else {
				navigateTo('/');
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				sessionStorage.removeItem('access_token');
			}

		} else {

			console.log('teste3');
			goTo();

		}

	  } else {

		if (invitedUser) {
			const cancelMessage = {
				"type": "cancel_invite",
				"recipient": invitedUser,
			};
			chatSocketInstance.send(cancelMessage);
			const removeDivInvite = document.getElementById('invitePending');
			console.log('elemento a remover: '. removeDivInvite);
			if (removeDivInvite) {
				console.log('existe o removeDivInvite: ', removeDivInvite);
				removeDivInvite.remove();
			}
		}

		const status = 404;
		const message = "Page not found.";
		navigateTo(`/error/${status}/${message}`, true);
	}

});

export { baseURL, navigateTo, goTo, matchRoute }
