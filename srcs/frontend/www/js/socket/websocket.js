import { SOCKET_URL_STATUS } from "../utils/settings.js";
import { refreshAccessToken } from "../utils/fetchWithToken.js";
import { navigateTo } from "../app.js";

class WebSocketService {
	static instance = null;
	static getInstance() {
		if (!WebSocketService.instance) {
			WebSocketService.instance = new WebSocketService();
		}
		return WebSocketService.instance;
	}
	constructor() {
		this.socketRef = null;
	}

	async connect() {
		if (
			this.socketRef &&
			(this.socketRef.readyState === WebSocket.OPEN ||
				this.socketRef.readyState === WebSocket.CONNECTING)
		) {
			return;
		}

		const token = localStorage.getItem("access_token");
		const refreshToken = localStorage.getItem("refresh_token");
		if (!refreshToken || !this.testToken(refreshToken)) {
			return;
		}
		if (!token || !this.testToken(token)) {
			const refreshed = await refreshAccessToken();
			if (refreshed) token = localStorage.getItem("access_token");
			else {
				navigateTo("/");
				return;
			}
		}
		const path = `wss://${window.location.host}/api/ws/user_status/?token=${token}`;
		this.socketRef = new WebSocket(path);
		this.socketRef.onopen = () => { };
		this.socketRef.onmessage = (e) => { };
		this.socketRef.onerror = (e) => { };
		this.socketRef.onclose = () => { };
	}
	close() {
		if (this.socketRef && this.socketRef.readyState === WebSocket.OPEN) {
			this.socketRef.close();
		}
	}
	parseJwt(token) {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join("")
		);

		return JSON.parse(jsonPayload);
	}
	testToken(token) {
		let payload;
		if (token) {
			payload = this.parseJwt(token);
			const currentTimestamp = Math.floor(Date.now() / 1000);
			if (payload.exp < currentTimestamp) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}
	state() {
		return this.socketRef ? this.socketRef.readyState : null;
	}
}

const WebSocketInstance = WebSocketService.getInstance();

export default WebSocketInstance;
