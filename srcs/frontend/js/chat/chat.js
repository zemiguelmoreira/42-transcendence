
import { chat_page } from "../html/chat_page";

function chat() {
	const butChat = document.querySelector('#chat');
	// console.log(butChat);
	butChat.addEventListener('click', function (e) {
		e.preventDefault();
		limparDivAll('root');
		// console.log(this.dataset.value);
		document.getElementById('root').insertAdjacentHTML('afterbegin', chat_page);
		chatFunction();
		// console.log(document.getElementById('root'));
		// const registerForm = document.querySelector('#userRegisterForm');
		// console.log(registerForm);
		// removeInputValidation(registerForm);
		home();
	})
};

function chatFunction() {
    const chatSocket = new WebSocket('ws://localhost:8001/ws/chat/');
    
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        console.log('Message received: ', data.message);
        // Update your UI as necessary
    };
    
    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
    };
    
    function sendMessage(message) {
        chatSocket.send(JSON.stringify({
            'message': message
        }));
    }
    
    // Example usage
    document.querySelector('#chat-message-submit').onclick = function(e) {
        const messageInputDom = document.querySelector('#chat-message-input');
        const message = messageInputDom.value;
        sendMessage(message);
        messageInputDom.value = '';
    };
}

export { chatFunction }
