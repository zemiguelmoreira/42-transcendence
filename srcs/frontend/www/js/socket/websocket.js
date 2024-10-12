// import { refreshAccessToken } from "../utils/fetchWithToken.js";
// import { navigateTo } from "../app.js";

// class WebSocketService {
// 	static instance = null;
// 	static getInstance() {
// 		if (!WebSocketService.instance) {
// 			WebSocketService.instance = new WebSocketService();
// 		}
// 		return WebSocketService.instance;
// 	}
// 	constructor() {
// 		this.socketRef = null;
// 	}

// 	async connect() {
// 		if (this.socketRef && (this.socketRef.readyState === WebSocket.OPEN || this.socketRef.readyState === WebSocket.CONNECTING)) {
// 			return;
// 		}

// 		let token = localStorage.getItem("access_token");
// 		const refreshToken = localStorage.getItem("refresh_token");

// 		if (!refreshToken || !this.testToken(refreshToken)) {
// 			navigateTo('/signIn');
// 			return;
// 		}
// 		if (!token || !this.testToken(token)) {
// 			console.log('No access token found or access token invalid, websocket');
// 			const refreshed = await refreshAccessToken(); // testar esta parte
// 			console.log('refresh token: ', refreshed);
// 			if (refreshed) {
// 				// token = localStorage.getItem('access_token'); // se fizer o refresh tem que ir buscar outra vez o token
// 				token = localStorage.getItem('access_token') ? localStorage.getItem('access_token') : sessionStorage.getItem('access_token');

// 				if (!localStorage.getItem('access_token'))
// 				  localStorage.setItem('access_token', token);

// 				console.log('token aqui: ', token);
// 			} else {

// 				console.log(' error with refresh token in socket');
// 				navigateTo('/signIn');
// 				return;
// 			}

// 		}

// 		const path = `wss://${window.location.host}/api/ws/user_status/?token=${token}`;
// 		this.socketRef = new WebSocket(path);
// 		this.socketRef.onopen = () => { console.log('ligado'); };
// 		this.socketRef.onmessage = (e) => { };
// 		this.socketRef.onerror = (e) => { };
// 		this.socketRef.onclose = () => { console.log('desligado'); };
// 	}
// 	close() {
// 		if (this.socketRef && this.socketRef.readyState === WebSocket.OPEN) {
// 			this.socketRef.close();
// 		}
// 	}
// 	parseJwt(token) {
// 		const base64Url = token.split(".")[1];
// 		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
// 		const jsonPayload = decodeURIComponent(
// 			atob(base64)
// 				.split("")
// 				.map(function (c) {
// 					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
// 				})
// 				.join("")
// 		);

// 		return JSON.parse(jsonPayload);
// 	}
// 	testToken(token) {
// 		let payload;
// 		if (token) {
// 			payload = this.parseJwt(token);
// 			const currentTimestamp = Math.floor(Date.now() / 1000);
// 			if (payload.exp < currentTimestamp) {
// 				return false;
// 			} else {
// 				return true;
// 			}
// 		} else {
// 			return false;
// 		}
// 	}
// 	state() {
// 		return this.socketRef ? this.socketRef.readyState : null;
// 	}
// }

// const WebSocketInstance = WebSocketService.getInstance();

// export default WebSocketInstance;
