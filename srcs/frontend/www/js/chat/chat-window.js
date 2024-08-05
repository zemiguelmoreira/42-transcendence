import { initializeChat } from './chat.js';

function chatWindow(username) {
    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="chat-container">
                <div class="users-list">
                    <ul id="online-users-list"></ul>
                </div>
                <div class="chat-window">
                    <div class="messages" id="chat-log"></div>
                    <div class="message-input">
                        <input id="chat-message-input" type="text" placeholder="Type a message...">
                        <button id="chat-message-submit">Send</button>
                        <!-- <button id="inviteButton">Invite to play</button> -->
                    </div>
                </div>
            </div>
        `;

		if (window.chatScriptLoaded === undefined) {
			window.chatScriptLoaded = false;
		}
		
		if (!window.chatScriptLoaded) {
			console.log('Carregando o script chat.js');
		
			const scriptElement = document.createElement('script');
			scriptElement.type = 'module';
			scriptElement.src = '../../js/chat/chat.js';
			scriptElement.onload = () => {
				window.chatScriptLoaded = true;
				// Inicializar o chat após o carregamento do script
				initializeChat();
			};
			scriptElement.onerror = () => {
				console.error('Erro ao carregar o script chat.js');
			};
			document.body.appendChild(scriptElement);
		} else {
			console.log('Script chat.js já carregado');
			// Reativar o chat se o script já estiver carregado
			initializeChat();
		}
		
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

export { chatWindow }
