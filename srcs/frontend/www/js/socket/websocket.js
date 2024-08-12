
import { SOCKET_URL_STATUS } from "../utils/settings.js";
import { refreshAccessToken } from "../utils/fetchWithToken.js";
import { navigateTo } from "../app.js";

class WebSocketService {

  static instance = null;
  callbacks = {};


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

    if (this.socketRef && (this.socketRef.readyState === WebSocket.OPEN || this.socketRef.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken || !this.testToken(refreshToken)) {
      console.log('validade do token no connect: ', this.testToken(refreshToken));
      console.log('No refresh token found or token invalid, cannot connect WebSocket');
      return;
    }
    // faz o refresh do access token, mas já foi verificado se existe o access token
    if (!token || !this.testToken(token)) {
      console.log('No access token found or access token invalid, websocket');
      const refreshed = await refreshAccessToken(); // testar esta parte
      if (refreshed)
        token = localStorage.getItem('access_token'); // se fizer o refresh tem que ir buscar outra vez o token
      else {
        console.log(' error with refresh token in socket');
        navigateTo('/');
        return;
      }
    }

    console.log('host no websocket: ', window.location.host);
    const path = `wss://${window.location.host}/api/ws/user_status/?token=${token}`;
    this.socketRef = new WebSocket(path);
    this.socketRef.onopen = () => {
      console.log('WebSocket open');
    };
    this.socketRef.onmessage = e => {
      console.log('Message from server: ', e.data);
    };
    this.socketRef.onerror = e => {
      console.log('Websocket error: ', e.message);
    };
    this.socketRef.onclose = () => {
      console.log("WebSocket closed let's reopen");
      this.connect();
    };
  }

  close() {
    this.socketRef.close();
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
      // console.log(payload); // Verifique as claims
    
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTimestamp) {
        console.log('Token inválido');
        return false;
      } else {
        console.log('Token válido');
        return true;
      }
    } else {
      console.log('Token não encontrado no localStorage');
      return false;
    }
  }


  state() {
    return this.socketRef ? this.socketRef.readyState : null;
  }


}


const WebSocketInstance = WebSocketService.getInstance();

  
export default WebSocketInstance;