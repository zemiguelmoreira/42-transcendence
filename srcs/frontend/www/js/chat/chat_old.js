import { displaySlidingMessage } from "../utils/utils1.js";
import { viewUserProfile } from "../search/search_user.js";


export function initializeChat(username) {

	// console.log('Loading chat page content');

	let selectedUser = null;

	const chatLog = document.getElementById("chat-log");
	const chatMessageInput = document.getElementById("chat-message-input");
	const chatMessageSubmit = document.getElementById("chat-message-submit");
	const onlineUsersList = document.getElementById("online-users-list");

	const token = localStorage.getItem('access_token');
	const chatSocket = new WebSocket(`wss://${window.location.host}/chat/ws/?token=${token}`);

	chatSocket.onopen = function () {
		console.log('Chat page loaded. WebSocket connection established');
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

		if (data.message) {
			const messageElement = document.createElement("div");

			if (data.private) {
				messageElement.classList.add('message-private');
			} else if (data.system) {
				messageElement.classList.add('message-system');
			} else if (data.selfdm) {
				messageElement.classList.add('message-selfdm');
			} else if (data.error) {
				messageElement.classList.add('message-error');
			} else {
				messageElement.classList.add('message-default');
			}

			const senderElement = document.createElement("span");
			senderElement.classList.add('message-sender');
			senderElement.textContent = `${data.sender}: `;

			const contentElement = document.createElement("div");
			contentElement.classList.add('message-content');
			contentElement.innerHTML = data.message.replace(/\n/g, '<br>');

			messageElement.appendChild(senderElement);
			messageElement.appendChild(contentElement);

			chatLog.appendChild(messageElement);
			chatLog.scrollTop = chatLog.scrollHeight;

			if (data.selfdm)
				displaySlidingMessage(messageElement.textContent);

		} else if (data.invite) {

			const sender = data.sender;
			const game = data.game;
			const inviteMessage = `${sender} has invited you to play a game of ${game}! `;
			const inviteElement = document.createElement("div");
			inviteElement.classList.add('message-invite');
			inviteElement.style.color = "coralpink";

			// Create text container
			const messageText = document.createElement("span");
			messageText.textContent = inviteMessage;

			// Create button container
			const buttonContainer = document.createElement("div");
			buttonContainer.classList.add('button-container');

			// Create accept button
			const acceptButton = document.createElement("button");
			acceptButton.textContent = "Accept";
			acceptButton.classList.add('accept-button');
			acceptButton.onclick = function () {
				const inviteAccepted = {
					"accepted": true,
					"inviter": sender,
					"type": "invite_response",
				};
				chatSocket.send(JSON.stringify(inviteAccepted));
				acceptButton.disabled = true;
				rejectButton.disabled = true;
			};

			// Create reject button
			const rejectButton = document.createElement("button");
			rejectButton.textContent = "Reject";
			rejectButton.classList.add('reject-button');
			rejectButton.onclick = function () {
				const inviteRejected = {
					"accepted": false,
					"inviter": sender,
					"type": "invite_response",
				};
				chatSocket.send(JSON.stringify(inviteRejected));
				acceptButton.disabled = true;
				rejectButton.disabled = true;
			};

			// Add buttons to button container
			buttonContainer.appendChild(acceptButton);
			buttonContainer.appendChild(rejectButton);

			// Add text and button container to invite element
			inviteElement.appendChild(messageText);
			inviteElement.appendChild(buttonContainer);

			// Add invite element to chat log
			chatLog.appendChild(inviteElement);
			chatLog.scrollTop = chatLog.scrollHeight;

			displaySlidingMessage(inviteMessage);

		} else if (data.invite_response) {

			const invitee = data.invitee;
			const accepted = data.accepted;
			let responseMessage;

			if (accepted) {
				responseMessage = `${invitee} has accepted your invite!`;
				// Handle game start
			} else {
				responseMessage = `${invitee} has declined your invite!`;
			}

			const inviteResponseElement = document.createElement("div");
			inviteResponseElement.style.color = "coralpink";
			inviteResponseElement.innerHTML = responseMessage;
			chatLog.appendChild(inviteResponseElement);
			chatLog.scrollTop = chatLog.scrollHeight;

		} else if (data.online_users) {
			
			onlineUsersList.innerHTML = '';
			data.online_users.forEach(function (user) {

				// Cria o botão principal (lado esquerdo do split)
				const userButton = document.createElement("button");
				userButton.textContent = user;
				userButton.classList.add("btn", "btn-secondary", "btn-sm", "btn-left");
				userButton.setAttribute('type', 'button');
				userButton.addEventListener('click', () => {
					if (userButton.classList.contains('active')) {
						userButton.classList.remove('active');
						selectedUser = null;
						// console.log(`Usuário ${user} foi desmarcado.`);
					} else {
						const activeButtons = document.querySelectorAll('#online-users-list .active');
						activeButtons.forEach((btn) => btn.classList.remove('active'));

						userButton.classList.add('active');
						selectedUser = user;
						// console.log(`Usuário ${user} clicado e selecionado.`);
					}
				});

				// Cria o botão dropdown (lado direito do split)
				const dropdownToggle = document.createElement("button");
				dropdownToggle.classList.add("btn", "btn-sm", "btn-secondary", "dropdown-toggle", "dropdown-toggle-split", "btn-right");
				dropdownToggle.setAttribute('type', 'button');
				dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
				dropdownToggle.setAttribute('aria-haspopup', 'true');
				dropdownToggle.setAttribute('aria-expanded', 'false');

				// Cria o menu dropdown
				const dropdownMenu = document.createElement("div");
				dropdownMenu.classList.add("dropdown-menu");

				// Adiciona o evento de clique ao botão de adicionar amigo
				const action1 = document.createElement("a");
				action1.classList.add("dropdown-item");
				action1.href = "#";
				action1.textContent = "Add Friend";

				// Adiciona o evento de clique ao botão de visualizar perfil
				const action2 = document.createElement("a");
				action2.classList.add("dropdown-item");
				action2.href = "#";
				action2.textContent = "View Profile";
				action2.addEventListener('click', async (e) => {
					// console.log('viewProfile clicked');
					e.preventDefault();
					await viewUserProfile(username, user);
				});

				// Adiciona uma linha divisória
				const action3 = document.createElement("hr");
				action3.classList.add("dropdown-divider");

				// Adiciona o botão de convite para jogar Pong
				const action4 = document.createElement("a");
				action4.classList.add("dropdown-item"); // Define um ID único baseado no nome do usuário, talvez seja necessário para iniciar a partida dos jogos
				action4.id = `inviteButtonPong-${user}`;
				action4.href = "#";
				action4.textContent = "Invite to play Pong";
				action4.addEventListener('click', () => {
					const inviteMessage = {
						"type": "invite",
						"recipient": user,  // Usa o nome do usuário como identificador
						"game": "Pong"
					};
					chatSocket.send(JSON.stringify(inviteMessage));
					console.log('Invite sent to', user);
				});

				// Adiciona o botão de convite para jogar Snake
				const action5 = document.createElement("a");
				action5.classList.add("dropdown-item");
				action5.id = `inviteButtonSnake-${user}`;
				action5.href = "#";
				action5.textContent = "Invite to play Snake";
				action5.addEventListener('click', () => {
					const inviteMessage = {
						"type": "invite",
						"recipient": user,  // Usa o nome do usuário como identificador
						"game": "Snake"
					};
					chatSocket.send(JSON.stringify(inviteMessage));
					console.log('Invite sent to', user);
				});

				// Adiciona os botões ao menu dropdown
				dropdownMenu.appendChild(action1);
				dropdownMenu.appendChild(action2);
				dropdownMenu.appendChild(action3);
				dropdownMenu.appendChild(action4);
				dropdownMenu.appendChild(action5);

				// Cria um container para os botões e o dropdown
				const btnGroup = document.createElement("div");
				btnGroup.classList.add("btn-group");
				btnGroup.appendChild(userButton);
				btnGroup.appendChild(dropdownToggle);
				btnGroup.appendChild(dropdownMenu);

				// Adiciona o grupo de botões à lista de usuários online
				onlineUsersList.appendChild(btnGroup);
			});
			// console.log('Online users:', data.online_users);
		}
	};

	chatSocket.onclose = function (e) {
		console.log('WebSocket connection closed:', e);
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