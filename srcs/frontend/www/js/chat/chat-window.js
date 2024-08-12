import { initializeChat } from './chat.js';
import { chatWindowHtml } from './chat_html.js';



function doChat(username) {
    chatWindowHtml;
    document.getElementById('mainContent').innerHTML = '';
    document.getElementById('mainContent').innerHTML = chatWindowHtml;
    console.log('função doChat');
    initializeChat(username);
}


export { doChat }
