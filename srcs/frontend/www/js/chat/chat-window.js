import { initializeChat } from './chat.js';
import { chatWindowHtml } from './chat_html.js';
// import chatSocketInstance from './chat_socket.js';


function doChat(username) {
    // chatWindowHtml;
    document.getElementById('mainContent').innerHTML = '';
    document.getElementById('mainContent').innerHTML = chatWindowHtml;
    initializeChat(username);
}


export { doChat }
