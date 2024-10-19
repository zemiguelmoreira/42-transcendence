import { displaySlidingMessage } from "../utils/utils1.js";
import { viewUserProfile } from "../search/search_user.js";
import { addFriend, blockUser } from "../utils/manageUsers.js";
import { joinPongRoom } from "../games/pong-remote.js";
import { joinSnakeRoom } from "../games/snake-remote.js";
import chatSocketInstance from "./chat_socket.js";
import { closeSlidingWindow } from "../home/home.js";
import { snakeGameRemotePage } from "../games/snake-pages.js";
import { navigateTo } from "../app.js";

let selectedUser = null, invitedUser = null;

function displayChatMessage(data, chatLog) {
	console.log("Chat data: ", data);
	console.log("chatLog: ", chatLog);

	const messageElement = document.createElement("div");
	if (data.private) {
		messageElement.classList.add('message-private');
	} else if (data.system) {
		messageElement.classList.add('message-system');
	} else if (data.selfdm) {
		messageElement.classList.add('message-selfdm');
	} else if (data.error) {
		messageElement.classList.add('message-error');
	} else if (data.invite_response) {
		messageElement.classList.add('message-invite-response');
	} else if (data.invite_cancelled) {
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
	let slidingWindow = document.querySelector('.sliding-window');
	if (data.system || data.error) {
		displaySlidingMessage(messageElement.textContent);
	} else if (data.received && slidingWindow && slidingWindow.classList.contains('closed')) {
		let slide;
		if (data.private) {
			slide = "New private message from " + data.sender.substring(5);
		} else if (data.public) {
			slide = "New public message from " + data.sender;
		}
		displaySlidingMessage(slide);
	}
}

function displayGameInvite(data, chatLog, username) {
	const inviteMessage = `${data.sender} has invited you to play a game of ${data.game}! `;
	let game;
	game = data.game;
	const inviteElement = createInviteElement(inviteMessage, data.sender, game, username);
	chatLog.appendChild(inviteElement);
	chatLog.scrollTop = chatLog.scrollHeight;
	displaySlidingMessage(inviteMessage);
}

function createInviteElement(inviteMessage, sender, game, username) {
	const inviteElement = document.createElement("div");
	inviteElement.classList.add('message-invite');
	inviteElement.style.color = "coralpink";
	const messageText = document.createElement("span");
	messageText.textContent = inviteMessage;
	const buttonContainer = document.createElement("div");
	buttonContainer.classList.add('button-container');
	const acceptButton = createInviteResponseButton("Accept", true, sender, game, username);
	const rejectButton = createInviteResponseButton("Reject", false, sender, game, username);
	buttonContainer.appendChild(acceptButton);
	buttonContainer.appendChild(rejectButton);
	inviteElement.appendChild(messageText);
	inviteElement.appendChild(buttonContainer);
	return inviteElement;
}

function createInviteResponseButton(text, accepted, sender, game, username) {
	const button = document.createElement("button");
	button.textContent = text;
	button.classList.add(`${text.toLowerCase()}-button`);
	button.onclick = function () {
		const response = {
			"accepted": accepted,
			"inviter": sender,
			"type": "invite_response",
			"game": game,
		};

		chatSocketInstance.send(response);

		const buttonContainer = this.closest('.button-container');
		buttonContainer.querySelector('.accept-button').disabled = true;
		buttonContainer.querySelector('.reject-button').disabled = true;
		navigateTo(`/user/${username}/chat-playing`);
		if (!accepted) {
			displaySlidingMessage(`Invite from ${sender} has been declined.`);
		}
	};
	return button;
}

function handleInviteCancelled(username, data, chatLog) {
	const inviteCancelledElement = document.createElement("div");
	inviteCancelledElement.classList.add('message-error');
	inviteCancelledElement.textContent = `${data.sender} has cancelled the invite.`;
	chatLog.appendChild(inviteCancelledElement);
	chatLog.scrollTop = chatLog.scrollHeight;
	displaySlidingMessage(`${data.sender} has cancelled the invite.`);
}

function getRoomCode(username, data) {
	const roomCode = data.roomCode;
	const game = data.game;
	const invitePending = document.createElement('div');
	invitePending.classList.add('invite-pending');
	invitePending.id = 'invitePending';
	document.getElementById('root').appendChild(invitePending);
	if (game === 'Pong') {
		joinPongRoom(roomCode, username);
	} else {
		const runSnakeRemote = document.getElementById('invitePending');
		runSnakeRemote.innerHTML = snakeGameRemotePage();
		document.getElementById('root').appendChild(runSnakeRemote);
		joinSnakeRoom(roomCode, username);
	}
}

function handleInviteResponse(username, data, chatLog) {
	const roomCode = data.roomCode;
	const invitee = data.invitee;
	const accepted = data.accepted;
	let responseMessage;
	const inviteResponseElement = document.createElement("div");
	if (accepted) {
		if (data.game == 'Pong') {
			joinPongRoom(roomCode, username);
			invitedUser = null;
		} else {
			const runSnakeRemote = document.getElementById('invitePending');
			runSnakeRemote.innerHTML = snakeGameRemotePage();
			document.getElementById('root').appendChild(runSnakeRemote);
			joinSnakeRoom(roomCode, username);
			invitedUser = null;
		}
		responseMessage = `${invitee} has accepted your invite!`;
		inviteResponseElement.classList.add('message-selfdm');
	} else {
		responseMessage = `${invitee} has declined your invite!`;
		inviteResponseElement.classList.add('message-error');
		document.getElementById('invitePending').remove();
		navigateTo(`/user/${username}`);
	}
	inviteResponseElement.innerHTML = responseMessage;
	chatLog.appendChild(inviteResponseElement);
	chatLog.scrollTop = chatLog.scrollHeight;
	displaySlidingMessage(responseMessage);
}

function updateOnlineUsersList(username, onlineUsers, chatSocket) {
	const onlineUsersList = document.getElementById("online-users-list");
	onlineUsersList.innerHTML = '';
	onlineUsers.forEach(user => {
		const btnGroup = createUserButtonGroup(username, user, chatSocket);
		onlineUsersList.appendChild(btnGroup);
	});
}

function createUserButtonGroup(username, user, chatSocket) {
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

function createDropdownToggle() {
	const dropdownToggle = document.createElement("button");
	dropdownToggle.classList.add("btn", "btn-sm", "btn-secondary", "dropdown-toggle", "dropdown-toggle-split", "btn-right");
	dropdownToggle.type = 'button';
	dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
	dropdownToggle.setAttribute('aria-haspopup', 'true');
	dropdownToggle.setAttribute('aria-expanded', 'false');
	return dropdownToggle;
}

function createDropdownMenu(username, user) {
	const dropdownMenu = document.createElement("div");
	dropdownMenu.classList.add("dropdown-menu");
	if (username === user) {
		const disabledItem = document.createElement("span");
		disabledItem.classList.add("dropdown-item", "disabled");
		disabledItem.textContent = "Hi " + username + "!";
		dropdownMenu.appendChild(disabledItem);
		return dropdownMenu;
	}
	const action0 = createDropdownItem("Block User", "#", async (e) => {
		await blockUser(user, displaySlidingMessage);
	});
	const action1 = createDropdownItem("Add Friend", "#", async (e) => {
		await addFriend(user, displaySlidingMessage);
	});
	const action2 = createDropdownItem("View Profile", "#", async function () {
		closeSlidingWindow();
		await viewUserProfile(username, user);
	});
	const action3 = document.createElement("hr");
	action3.classList.add("dropdown-divider");
	const action4 = createDropdownItem("Invite to play Pong", "#", () => sendGameInvite(username, user, "Pong"));
	const action5 = createDropdownItem("Invite to play Snake", "#", () => sendGameInvite(username, user, "Snake"));
	dropdownMenu.appendChild(action1);
	dropdownMenu.appendChild(action0);
	dropdownMenu.appendChild(action2);
	dropdownMenu.appendChild(action3);
	dropdownMenu.appendChild(action4);
	dropdownMenu.appendChild(action5);
	return dropdownMenu;
}

function createDropdownItem(text, href, onClick) {
	const item = document.createElement("a");
	item.classList.add("dropdown-item");
	item.href = href;
	item.textContent = text;
	if (onClick) {
		item.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			onClick();
		});
	}
	return item;
}

function closeAllDropdowns() {
	const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
	openDropdowns.forEach(dropdown => {
		dropdown.classList.remove('show');
	});
}

function handleCancelInvite(recipient) {
	const cancelMessage = {
		"type": "cancel_invite",
		"recipient": recipient,
	};
	chatSocketInstance.send(cancelMessage);
	displaySlidingMessage(`Invite to ${recipient} has been cancelled.`);
}

async function sendGameInvite(username, user, game) {
	const inviteMessage = {
		"type": "invite",
		"recipient": user,
		"game": game,
	};
	invitedUser = user;
	chatSocketInstance.send(inviteMessage);
	const invitePendingDiv = document.createElement('div');
	invitePendingDiv.classList.add('invite-pending');
	invitePendingDiv.id = 'invitePending';
	const cancelButton = document.createElement('button');
	cancelButton.id = 'cancelButton';
	cancelButton.classList.add('btn', 'btn-danger');
	cancelButton.textContent = 'Cancel';
	navigateTo(`/user/${username}/chat-playing`);
	closeAllDropdowns();
	cancelButton.addEventListener('click', (event) => {
		handleCancelInvite(user);
		invitePendingDiv.remove();
		event.preventDefault();
	});
	invitePendingDiv.appendChild(cancelButton);
	document.getElementById('root').appendChild(invitePendingDiv);
}

export { selectedUser, invitedUser, chatSocketInstance, handleCancelInvite, displayChatMessage, displayGameInvite, handleInviteResponse, updateOnlineUsersList, getRoomCode, handleInviteCancelled }
