import { displaySlidingMessage } from "../utils/utils1.js";
import { viewUserProfile } from "../search/search_user.js";
import { addFriend, removeFriend, blockUser, unblockUser } from "../utils/manageUsers.js";
import { navigateTo } from "../app.js";
import { createRoom, joinRoom } from "../games/pong-heitor.js";
import chatSocketInstance from "./chat_socket.js";

let selectedUser = null;
let roomCode = null;

// função para mostrar a msn de chat
function displayChatMessage(data, chatLog) {

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
}

// função para mostrar o convite to play game - (utiliza - createInviteElement() e createInviteResponseButton())
function displayGameInvite(data, chatLog, chatSocket) {
	console.log('displayGameInvite: ', data);

	const inviteMessage = `${data.sender} has invited you to play a game of ${data.game}! `;

	const inviteElement = createInviteElement(inviteMessage, data.sender, chatSocket, data.roomCode);

	chatLog.appendChild(inviteElement);
	chatLog.scrollTop = chatLog.scrollHeight;

	displaySlidingMessage(inviteMessage);
}

// cria o convite
function createInviteElement(inviteMessage, sender, chatSocket, roomCode) {
	const inviteElement = document.createElement("div");
	inviteElement.classList.add('message-invite');
	inviteElement.style.color = "coralpink";

	const messageText = document.createElement("span");
	messageText.textContent = inviteMessage;

	const buttonContainer = document.createElement("div");
	buttonContainer.classList.add('button-container');


	const acceptButton = createInviteResponseButton("Accept", true, sender, chatSocket, roomCode);
	const rejectButton = createInviteResponseButton("Reject", false, sender, chatSocket, roomCode);

	buttonContainer.appendChild(acceptButton);
	buttonContainer.appendChild(rejectButton);

	inviteElement.appendChild(messageText);
	inviteElement.appendChild(buttonContainer);

	return inviteElement;
}

// Cria os buttons de acordo com os argumentos
function createInviteResponseButton(text, accepted, sender, chatSocket, roomCode) {

	// console.log('chatSocket_1: ', chatSocketInstance.socketRef);

	const button = document.createElement("button");
	button.textContent = text;
	button.classList.add(`${text.toLowerCase()}-button`);
	button.onclick = function () {
		const response = {
			"accepted": accepted,
			"inviter": sender,
			"type": "invite_response",
		};
		chatSocket.send(response);
		// button.disabled = true;
		// button.nextElementSibling.disabled = true;
		document.querySelector('.accept-button').disabled = true;
		document.querySelector('.reject-button').disabled = true;
		joinRoom(roomCode);
	};
	return button;

}

// Função que trata a resposta ao convite
function handleInviteResponse(username, data, chatLog) {
	console.log('data: ', data);
	console.log('username: ', username);

	const invitee = data.invitee;
	const accepted = data.accepted;
	let responseMessage;
	const inviteResponseElement = document.createElement("div");

	if (accepted) {
		responseMessage = `${invitee} has accepted your invite!`;
		inviteResponseElement.style.color = "lightgreen";
		// Handle game start
	} else {
		responseMessage = `${invitee} has declined your invite!`;
		inviteResponseElement.style.color = "pink";
	}

	inviteResponseElement.innerHTML = responseMessage;
	chatLog.appendChild(inviteResponseElement);
	chatLog.scrollTop = chatLog.scrollHeight;
	displaySlidingMessage(responseMessage);
}

function updateOnlineUsersList(username, onlineUsers, chatSocket) {
	console.log('Socket: updateOnlineUsersList: ', chatSocket);

	const onlineUsersList = document.getElementById("online-users-list");
	onlineUsersList.innerHTML = '';
	onlineUsers.forEach(user => {
		const btnGroup = createUserButtonGroup(username, user, chatSocket);
		onlineUsersList.appendChild(btnGroup);
	});
}

// Cria o botão para cada user
function createUserButtonGroup(username, user, chatSocket) {
	console.log('username: ', username, 'user: ', user);
	console.log('Socket: createUserButtonGroup: ', chatSocket);

	const userButton = document.createElement("button");
	userButton.textContent = user;
	userButton.classList.add("btn", "btn-secondary", "btn-sm", "btn-left");
	userButton.type = 'button';
	userButton.addEventListener('click', () => toggleUserSelection(userButton, user));

	const dropdownToggle = createDropdownToggle();
	const dropdownMenu = createDropdownMenu(username, user, chatSocket);

	const btnGroup = document.createElement("div");
	btnGroup.classList.add("btn-group");
	btnGroup.appendChild(userButton);
	btnGroup.appendChild(dropdownToggle);
	btnGroup.appendChild(dropdownMenu);

	return btnGroup;
}

// Selecção do botão
function toggleUserSelection(button, user) {
	if (button.classList.contains('active')) {
		button.classList.remove('active');
		selectedUser = null;
	} else {
		document.querySelectorAll('#online-users-list .active').forEach(btn => btn.classList.remove('active'));
		button.classList.add('active');
		selectedUser = user;
	}
}

// Cria o botão dropdown (lado direito do split)
function createDropdownToggle() {
	const dropdownToggle = document.createElement("button");
	dropdownToggle.classList.add("btn", "btn-sm", "btn-secondary", "dropdown-toggle", "dropdown-toggle-split", "btn-right");
	dropdownToggle.type = 'button';
	dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
	dropdownToggle.setAttribute('aria-haspopup', 'true');
	dropdownToggle.setAttribute('aria-expanded', 'false');
	return dropdownToggle;
}

// Cria o menu dropdown
function createDropdownMenu(username, user, chatSocket) {
	console.log('Socket: createDropdownMenu: ', chatSocket);

	const dropdownMenu = document.createElement("div");
	dropdownMenu.classList.add("dropdown-menu");

	// Verifica se o username é igual ao user
	if (username === user) {
		// Retorna um menu desativado ou vazio
		const disabledItem = document.createElement("span");
		disabledItem.classList.add("dropdown-item", "disabled");
		disabledItem.textContent = "Hi " + username + "!";
		dropdownMenu.appendChild(disabledItem);
		return dropdownMenu;
	}

	// Caso contrário, cria o menu dropdown com as ações normais
	const action0 = createDropdownItem("Block User", "#", async (e) => {
		e.preventDefault();
		await blockUser(user, displaySlidingMessage);
	});

	const action1 = createDropdownItem("Add Friend", "#", async (e) => {
		e.preventDefault();
		await addFriend(user, displaySlidingMessage);
	});

	const action2 = createDropdownItem("View Profile", "#", async function () {
		await viewUserProfile(username, user);
	});

	const action3 = document.createElement("hr");
	action3.classList.add("dropdown-divider");

	const action4 = createDropdownItem("Invite to play Pong", "#", () => sendGameInvite(username, user, "Pong", chatSocket));
	const action5 = createDropdownItem("Invite to play Snake", "#", () => sendGameInvite(username, user, "Snake", chatSocket));

	// Adiciona as ações ao menu dropdown
	dropdownMenu.appendChild(action1);
	dropdownMenu.appendChild(action0);
	dropdownMenu.appendChild(action2);
	dropdownMenu.appendChild(action3);
	dropdownMenu.appendChild(action4);
	dropdownMenu.appendChild(action5);

	return dropdownMenu;
}

// Cria o item do dropdown menu
function createDropdownItem(text, href, onClick) {
	const item = document.createElement("a");
	item.classList.add("dropdown-item");
	item.href = href;
	item.textContent = text;
	// if (onClick) item.addEventListener('click', onClick);
	if (onClick) {
		item.addEventListener('click', function (e) {
			e.preventDefault();
			onClick(); // Chama onClick sem passar o objeto event
		});
	}
	return item;
}

// Envia o convite para jogar
async function sendGameInvite(username, user, game, chatSocket) {
	console.log('user: ', user);
	console.log('Socket: sendGameInvite: ', chatSocket);

	roomCode = await createRoom(user);

	console.log('Invite: roomCode: ', roomCode);

	const inviteMessage = {
		"type": "invite",
		"recipient": user,
		"game": game,
		"roomCode": roomCode
	};

	console.log('Invite sent to', user);
	console.log('InviteMessage: ', inviteMessage);

	chatSocket.send(inviteMessage);

	joinRoom(roomCode);

	// navigateTo(`/user/${username}/pong-game-local`);
}

export { selectedUser, displayChatMessage, displayGameInvite, handleInviteResponse, updateOnlineUsersList }
