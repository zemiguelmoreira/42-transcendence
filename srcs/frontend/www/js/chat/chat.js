import { selectedUser } from "./utils_chat.js";
import chatSocketInstance from "./chat_socket.js";

function initializeChat(username) {
	const chatMessageInput = document.getElementById("chat-message-input");
	const chatMessageSubmit = document.getElementById("chat-message-submit");
	chatSocketInstance.connect(username);
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
			chatSocketInstance.sendWithToken(messageData);
			chatMessageInput.value = '';
		}
	};
	chatMessageInput.addEventListener('keypress', function (event) {
		if (event.key === 'Enter') {
			chatMessageSubmit.click();
			event.preventDefault();
		}
	});
}

export { initializeChat }