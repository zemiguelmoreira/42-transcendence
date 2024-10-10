import { refreshAccessToken } from "../utils/fetchWithToken.js";
import { displayChatMessage } from "./utils_chat.js";
import { displayGameInvite } from "./utils_chat.js";
import { handleInviteResponse } from "./utils_chat.js";
import { updateOnlineUsersList } from "./utils_chat.js";
import { handleInviteCanceled} from "./utils_chat.js"
import { getRoomCode } from "./utils_chat.js";
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
		this.chatLog = null;
	}
	async connect(username) {
		if (this.socketRef) {
			this.socketRef.close();
			this.socketRef = null;
		}
		let token = localStorage.getItem('access_token');
		const refreshToken = localStorage.getItem('refresh_token');
		if (!refreshToken || !this.testToken(refreshToken)) {
			return;
		}
		if (!token || !this.testToken(token)) {
			const refreshed = await refreshAccessToken();
			if (refreshed) {
				token = localStorage.getItem('access_token');
			} else {
				navigateTo('/');
				return;
			}
		}
		const path = `wss://${window.location.host}/chat/ws/?token=${token}`;
		this.socketRef = new WebSocket(path);
		this.chatLog = document.getElementById("chat-log");
		this.setupSocketHandlers(username);
	}
	setupSocketHandlers(username) {
		this.socketRef.onopen = () => {
			// console.log('WebSocket connection established');
		};
		this.socketRef.onmessage = e => {
			let data;
			try {
				data = JSON.parse(e.data);
			} catch (error) {
				return;
			}
			if (data.message) {
				displayChatMessage(data, this.chatLog);
			} else if (data.invite) {
				displayGameInvite(data, this.chatLog, username);
			} else if (data.invite_response) {
				handleInviteResponse(username, data, this.chatLog);
			} else if (data.online_users) {
				updateOnlineUsersList(username, data.online_users);
			} else if (data.room) {
				getRoomCode(username, data);
			} else if (data.invite_canceled)
				handleInviteCanceled(username, data, this.chatLog);
		};
		this.socketRef.onerror = error => {
			console.error('WebSocket error:', error);
		};
		this.socketRef.onclose = e => {
			// console.log('WebSocket connection closed:', e);
		};
	}
	close() {
		if (this.socketRef && this.socketRef.readyState === WebSocket.OPEN) {
			this.socketRef.close();
		}
	}
	send(data) {
		if (this.socketRef && this.socketRef.readyState === WebSocket.OPEN) {
			this.socketRef.send(JSON.stringify(data));
		} else {
			console.error('WebSocket is not open. Ready state is:', this.socketRef.readyState);
		}
	}
	async sendWithToken(data) {
        let token  = localStorage.getItem('access_token');
        if (!token || !this.testToken(token)) {
            console.log('No access token found or access token invalid, websocket');
            const refreshed = await refreshAccessToken(); // testar esta parte
            console.log('refresh token: ', refreshed);
            if (refreshed) {
                this.send(data);
                // chatMessageInput.value = '';
            } else {
                navigateTo('/');
            }
        } else {
            this.send(data);
            // chatMessageInput.value = '';
        }
  	}
	parseJwt(token) {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
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

const chatSocketInstance = WebSocketService.getInstance();

export default chatSocketInstance;
