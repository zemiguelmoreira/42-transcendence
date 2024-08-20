import { refreshAccessToken } from "../utils/fetchWithToken.js";
import { displayChatMessage } from "./utils_chat.js";
import { displayGameInvite } from "./utils_chat.js";
import { handleInviteResponse } from "./utils_chat.js";
import { updateOnlineUsersList } from "./utils_chat.js";


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
  
      if (this.socketRef && (this.socketRef.readyState === WebSocket.OPEN || this.socketRef.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket already connected or connecting.');
        return;
      }
  
      let token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
  
      if (!refreshToken || !this.testToken(refreshToken)) {
        console.log('No refresh token found or token invalid, cannot connect WebSocket');
        return;
      }
  
      if (!token || !this.testToken(token)) {
        console.log('No access token found or access token invalid, websocket');
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          token = localStorage.getItem('access_token');
        } else {
          console.log('Error with refresh token in socket');
          navigateTo('/');
          return;
        }
      }
  
      const path = `wss://${window.location.host}/chat/ws/?token=${token}`;
      this.socketRef = new WebSocket(path);
      this.chatLog = document.getElementById("chat-log");
      console.log('chatlog: ', this.chatLog);
      this.socketRef.onopen = () => {
        console.log('WebSocket connection established');
      };
  
      this.socketRef.onmessage = e => {
        let data;
        try {
          data = JSON.parse(e.data);
          console.log('Para consulta data do chat: ', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          return;
        }
  
        if (data.message) {
            displayChatMessage(data, this.chatLog);
        } else if (data.invite) {
            displayGameInvite(data, this.chatLog);
        } else if (data.invite_response) {
            handleInviteResponse(data, this.chatLog);
        } else if (data.online_users) {
            updateOnlineUsersList(username, data.online_users);
        }
      };
  
      this.socketRef.onerror = error => {
        console.error('WebSocket error:', error);
      };
  
      this.socketRef.onclose = e => {
        console.log('WebSocket connection closed:', e);
        // this.connect();
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


    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        return JSON.parse(jsonPayload);
      }


    testToken(token) {
        let payload; // neste momento está undefined
        if (token) {
          payload = this.parseJwt(token);
        //   console.log(payload); // Verifique as claims
        
          const currentTimestamp = Math.floor(Date.now() / 1000);
          if (payload.exp < currentTimestamp) {
            // console.log('Token inválido');
            return false;
          } else {
            // console.log('Token válido');
            return true;
          }
        } else {
        //   console.log('Token não encontrado no localStorage');
          return false;
        }
      }
    
    
    state() {
    return this.socketRef ? this.socketRef.readyState : null;
    }
  
}

const chatSocketInstance = WebSocketService.getInstance();
  
export default chatSocketInstance;