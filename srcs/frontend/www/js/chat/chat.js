import { displayChatMessage } from "./utils_chat.js";
import { displayGameInvite } from "./utils_chat.js";
import { handleInviteResponse } from "./utils_chat.js";
import { updateOnlineUsersList } from "./utils_chat.js";
import { selectedUser } from "./utils_chat.js";


function initializeChat(username) {

	// console.log('Loading chat page content');


	const chatLog = document.getElementById("chat-log");
	const chatMessageInput = document.getElementById("chat-message-input");
	const chatMessageSubmit = document.getElementById("chat-message-submit");
	// const onlineUsersList = document.getElementById("online-users-list");

	const token = localStorage.getItem('access_token');
	const chatSocket = new WebSocket(`wss://${window.location.host}/chat/ws/?token=${token}`);

	chatSocket.onopen = function () {
		// console.log('Chat page loaded. WebSocket connection established');
	};

    chatSocket.onmessage = function (e) {

		let data;

		try {
			data = JSON.parse(e.data);
			console.log('Para consulta data do chat: ', data);
		} catch (error) {
			console.error('Error parsing WebSocket message:', error);
			return;
		}


        // trata a message data
        if (data.message) {
            displayChatMessage(data, chatLog);
        }

        // trata game invite
        else if (data.invite) {
            displayGameInvite(data, chatLog);
        }

        // trata invite response
        else if (data.invite_response) {
            handleInviteResponse(data, chatLog);
        }

        // trata online users list
        else if (data.online_users) {
            updateOnlineUsersList(username, data.online_users);
        }

    }

	
	chatSocket.onclose = function (e) {
		// console.log('WebSocket connection closed:', e);
	};


	chatSocket.onerror = function (error) {
		console.error('WebSocket error:', error);
	};


	chatMessageSubmit.onclick = function () {
		const message = chatMessageInput.value;
		if (message) {
			const messageData = {
				"message": message
			};
			if (selectedUser) {
				messageData.recipient = selectedUser;
				messageData.type = "private";
			}
			chatSocket.send(JSON.stringify(messageData));
			chatMessageInput.value = '';
		}
	};

	// Listen for 'Enter' key press in the message input field
	chatMessageInput.addEventListener('keypress', function (event) {
		if (event.key === 'Enter') {
			chatMessageSubmit.click();
			event.preventDefault(); // Prevent the default action
		}
	});


}



export { initializeChat }