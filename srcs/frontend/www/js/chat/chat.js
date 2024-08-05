import { displaySlidingMessage } from "../utils/utils1.js";

export function initializeChat() {

	console.log('Loading chat page content');

	let selectedUser = null;

	const chatLog = document.getElementById("chat-log");
	const chatMessageInput = document.getElementById("chat-message-input");
	const chatMessageSubmit = document.getElementById("chat-message-submit");
	const onlineUsersList = document.getElementById("online-users-list");

	const token = localStorage.getItem('access_token');
	const chatSocket = new WebSocket(`wss://${window.location.host}/chat/ws/?token=${token}`);

	chatSocket.onopen = function () {
		console.log('WebSocket connection established');
	};

	chatSocket.onmessage = function (e) {
		let data;
		try {
			data = JSON.parse(e.data);
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

			displaySlidingMessage(messageElement.textContent);

			console.log('Received message:', data);

		} else if (data.invite) {

			const sender = data.sender;
			const inviteMessage = `${sender} has invited you to play a game of pong! `;
			const inviteElement = document.createElement("div");
			inviteElement.classList.add('message-default');
			inviteElement.style.color = "coralpink";
			
			// Cria o contêiner de texto
			const messageText = document.createElement("span");
			messageText.textContent = inviteMessage;
			
			// Cria o contêiner para os botões
			const buttonContainer = document.createElement("div");
			buttonContainer.classList.add('button-container');
			
			// Cria o botão de aceitar
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
			
			// Cria o botão de rejeitar
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
			
			// Adiciona os botões ao contêiner de botões
			buttonContainer.appendChild(acceptButton);
			buttonContainer.appendChild(rejectButton);
			
			// Adiciona o texto e o contêiner de botões ao elemento de convite
			inviteElement.appendChild(messageText);
			inviteElement.appendChild(buttonContainer);
			
			// Adiciona o elemento de convite ao log de chat
			chatLog.appendChild(inviteElement);
			chatLog.scrollTop = chatLog.scrollHeight;
			
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
						console.log(`Usuário ${user} foi desmarcado.`);
					} else {
						const activeButtons = document.querySelectorAll('#online-users-list .active');
						activeButtons.forEach((btn) => btn.classList.remove('active'));
				
						userButton.classList.add('active');
						selectedUser = user;
						console.log(`Usuário ${user} clicado e selecionado.`);
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

				// Adiciona itens ao menu dropdown
				const action1 = document.createElement("a");
				action1.classList.add("dropdown-item");
				action1.href = "#";
				action1.textContent = "Add Friend";

				const action2 = document.createElement("a");
				action2.classList.add("dropdown-item");
				action2.href = "#";
				action2.textContent = "View Profile";

				const action3 = document.createElement("hr");
				action3.classList.add("dropdown-divider");

				const action4 = document.createElement("a");
				action4.classList.add("dropdown-item");
				action4.id = `inviteButton-${user}`;  // Define um ID único baseado no nome do usuário
				action4.href = "#";
				action4.textContent = "Invite to play Pong";

				// Adiciona o evento de clique ao botão de convite
				action4.addEventListener('click', () => {
					const inviteMessage = {
						"type": "invite",
						"recipient": user  // Usa o nome do usuário como identificador
					};
					chatSocket.send(JSON.stringify(inviteMessage));
					console.log('Invite sent to', user);
				});

				const action5 = document.createElement("a");
				action5.classList.add("dropdown-item");
				action5.id = `inviteButton-${user}`;  // Define um ID único baseado no nome do usuário
				action5.href = "#";
				action5.textContent = "Invite to play Snake";

				// Adiciona o evento de clique ao botão de convite
				action5.addEventListener('click', () => {
					const inviteMessage = {
						"type": "invite",
						"recipient": user  // Usa o nome do usuário como identificador
					};
					chatSocket.send(JSON.stringify(inviteMessage));
					console.log('Invite sent to', user);
				});

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
			console.log('Online users:', data.online_users);
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
			}
			chatSocket.send(JSON.stringify(messageData));
			chatMessageInput.value = "";
		}
		console.log('Message sent:', message);
	};

	chatMessageInput.addEventListener("keyup", function (e) {
		if (e.key === "Enter") {
			chatMessageSubmit.click();
		}
	});
}
