import { viewTokenRefresh, testToken, verifyToken } from "./utils/tokens.js";
import { getNamebyId } from "./profile/myprofile.js";
import { pages } from "./routes/path.js";
import { refreshAccessToken } from "./utils/fetchWithToken.js";
import WebSocketInstance from "./socket/websocket.js";
import { getParams } from "./login/login42.js";
import { changeChatLoaded } from "./home/home.js";

const baseURL = "https://localhost/api";

async function goTo() {
	try {
		const refreshToken = localStorage.getItem('refresh_token');
		if (testToken(refreshToken)) {
			await refreshAccessToken();
			const accessToken = localStorage.getItem('access_token');
			const payload = testToken(accessToken);
			if (!payload) {
				navigateTo('/');
				return;
			}
			let username = await getNamebyId(payload.user_id);
			if (username) {
				navigateTo(`/user/${username}`);
				await WebSocketInstance.connect();
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

function navigateTo(url, replace = false, redirectsCount = 0) {
	const MAX_REDIRECTS = 10;
	if (redirectsCount > MAX_REDIRECTS) {
		console.error('Too many redirects');
		return;
	}
	const matchedRoute = matchRoute(url);
	// console.log('matchedRoute',matchedRoute);
	if (matchedRoute) {
		const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
		if (!accessAllowed) {
			navigateTo(matchedRoute.page.redirect, true, redirectsCount + 1);
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

document.addEventListener('DOMContentLoaded', function (e) {
	window.addEventListener('popstate', (e) => {
		if (e.state) {
			const matchedRoute = matchRoute(e.state.page);
			const accessAllowed = typeof matchedRoute.page.access === 'function' ? matchedRoute.page.access() : matchedRoute.page.access;
			if (accessAllowed && e.state.page === "/signIn") {
				if (!localStorage.getItem('access_token')) {
					matchedRoute.page.loadContent(matchedRoute.params);
				}
				else {
					const defaultState = { page: '/' }
					history.replaceState(defaultState, '', "/");
					const matchedRoute = matchRoute(defaultState.page);
					changeChatLoaded(); // alterar o valor do chatLoaded quando chega ao home através do histórico
					if (matchedRoute) {
						matchedRoute.page.loadContent(matchedRoute.params);
					}
				}
				return;
			}
			if (e.state.page === "/")
				changeChatLoaded(); // alterar o valor do chatLoaded quando chega ao home através do histórico
			if (matchedRoute && accessAllowed) {
				matchedRoute.page.loadContent(matchedRoute.params);
			} else
				navigateTo(e.state.page);
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
			window.opener.postMessage(params, 'https://localhost/');
		}
		window.close();
	}
	if (!viewTokenRefresh()) {
		navigateTo(window.location.pathname);
	}
	else {
		if (window.location.pathname && window.location.pathname === "/signIn") {
			localStorage.removeItem('access_token');
			sessionStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			navigateTo(window.location.pathname);
		}
		else {
			goTo();
		}
	}
});

export { baseURL, navigateTo, goTo, matchRoute }