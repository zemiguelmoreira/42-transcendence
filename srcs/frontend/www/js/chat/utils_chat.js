import { displaySlidingMessage } from "../utils/utils1.js";
import { viewUserProfile } from "../search/search_user.js";
import { addFriend, removeFriend, blockUser, unblockUser } from "../utils/manageUsers.js";
import { createRoom, joinRoom } from "../games/pong-heitor.js";
import chatSocketInstance from "./chat_socket.js";
import { closeSlidingWindow } from "../home/home.js";

let selectedUser = null;
let roomCode = null;

// Function to display a chat message in the chat log
function displayChatMessage(data, chatLog) {
	// Create message element and assign class based on message type
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
		console.log('message-invite-response: ', data);
		messageElement.classList.add('message-invite-response');
	} else {
		console.log('message-default: ', data);
		messageElement.classList.add('message-default');
	}

	// Create sender and content elements
	const senderElement = document.createElement("span");
	senderElement.classList.add('message-sender');
	senderElement.textContent = `${data.sender}: `;

	const contentElement = document.createElement("div");
	contentElement.classList.add('message-content');
	contentElement.innerHTML = data.message.replace(/\n/g, '<br>');

	// Append sender and content to message element, then add to chat log
	messageElement.appendChild(senderElement);
	messageElement.appendChild(contentElement);
	chatLog.appendChild(messageElement);

	// Scroll chat log to show the latest message
	chatLog.scrollTop = chatLog.scrollHeight;

	// Optionally display a sliding message animation
	displaySlidingMessage(messageElement.textContent);
}


// Function to display a game invite in the chat log
function displayGameInvite(data, chatLog, chatSocket) {
	console.log('displayGameInvite: ', data);

	// Create the invite message and element
	const inviteMessage = `${data.sender} has invited you to play a game of ${data.game}! `;
	const inviteElement = createInviteElement(inviteMessage, data.sender, chatSocket, data.roomCode);

	// Append the invite element to the chat log
	chatLog.appendChild(inviteElement);

	// Scroll chat log to show the latest invite
	chatLog.scrollTop = chatLog.scrollHeight;

	// Optionally display a sliding message animation
	displaySlidingMessage(inviteMessage);
}


// Function to create the game invite element
function createInviteElement(inviteMessage, sender, chatSocket, roomCode) {
	// Create the main invite element and style it
	const inviteElement = document.createElement("div");
	inviteElement.classList.add('message-invite');
	inviteElement.style.color = "coralpink";

	// Create the message text element for the invite message
	const messageText = document.createElement("span");
	messageText.textContent = inviteMessage;

	// Create the container for the response buttons (Accept/Reject)
	const buttonContainer = document.createElement("div");
	buttonContainer.classList.add('button-container');

	// Create the Accept and Reject buttons
	const acceptButton = createInviteResponseButton("Accept", true, sender, roomCode);
	const rejectButton = createInviteResponseButton("Reject", false, sender, roomCode);

	// Add the buttons to the container
	buttonContainer.appendChild(acceptButton);
	buttonContainer.appendChild(rejectButton);

	// Append the message and button container to the main invite element
	inviteElement.appendChild(messageText);
	inviteElement.appendChild(buttonContainer);

	// Return the complete invite element
	return inviteElement;
}


// Function to create the response buttons for the game invite
function createInviteResponseButton(text, accepted, sender, roomCode) {
	// Create the button element and set its text and class
	const button = document.createElement("button");
	button.textContent = text;
	button.classList.add(`${text.toLowerCase()}-button`);

	// Define the button's click behavior
	button.onclick = function () {
		// Create the response object to send back via the socket
		const response = {
			"accepted": accepted,
			"inviter": sender,
			"type": "invite_response",
		};
		chatSocketInstance.send(response);  // Send the response through the socket

		// Disable both Accept and Reject buttons after one is clicked
		document.querySelector('.accept-button').disabled = true;
		document.querySelector('.reject-button').disabled = true;

		// Create a div to show that the game invite is pending
		const gameDiv = document.createElement('div');
		gameDiv.classList.add('invite-pending');
		gameDiv.id = 'invitePending';
		document.getElementById('root').appendChild(gameDiv);

		// If the invite is accepted, join the room
		if (accepted) {
			joinRoom(roomCode);
		}
		else {
			// Remove the pending invite indicator
			document.getElementById('invitePending').remove();
			displaySlidingMessage(`Invite from ${sender} has been declined.`);
		}
	};

	// Return the created button
	return button;
}

// Function to handle the response to the game invite
function handleInviteResponse(username, data, chatLog) {
	console.log('data: ', data);
	console.log('username: ', username);

	// Extract the invitee's name and whether the invite was accepted
	const invitee = data.invitee;
	const accepted = data.accepted;
	let responseMessage;

	// Create a new div element to display the response message
	const inviteResponseElement = document.createElement("div");

	// Determine the message and style based on whether the invite was accepted or declined
	if (accepted) {
		responseMessage = `${invitee} has accepted your invite!`;
		inviteResponseElement.style.color = "lightgreen";
		// Start the game by joining the room
		joinRoom(roomCode);
	} else {
		responseMessage = `${invitee} has declined your invite!`;
		inviteResponseElement.classList.add('message-error');
		// Remove the pending invite indicator
		document.getElementById('invitePending').remove();
	}

	// Set the message and append the response element to the chat log
	inviteResponseElement.innerHTML = responseMessage;
	chatLog.appendChild(inviteResponseElement);

	// Scroll chat log to show the latest response
	chatLog.scrollTop = chatLog.scrollHeight;

	// Optionally display a sliding message animation
	displaySlidingMessage(responseMessage);
}

// Function to update the list of online users
function updateOnlineUsersList(username, onlineUsers, chatSocket) {
	// Get the online users list element and clear its current contents
	const onlineUsersList = document.getElementById("online-users-list");
	onlineUsersList.innerHTML = '';

	// Iterate over the list of online users
	onlineUsers.forEach(user => {
		// Create a button group for each user (e.g., for chat, invite options)
		const btnGroup = createUserButtonGroup(username, user, chatSocket);

		// Append the button group to the online users list
		onlineUsersList.appendChild(btnGroup);
	});
}

// Function to create a button group for each user
function createUserButtonGroup(username, user, chatSocket) {
	console.log('username: ', username, 'user: ', user);

	// Create the main button for the user
	const userButton = document.createElement("button");
	userButton.textContent = user;
	userButton.classList.add("btn", "btn-secondary", "btn-sm", "btn-left");
	userButton.type = 'button';

	// Add click event listener to toggle user selection
	userButton.addEventListener('click', () => toggleUserSelection(userButton, user));

	// Create the dropdown toggle button (e.g., for additional actions)
	const dropdownToggle = createDropdownToggle();

	// Create the dropdown menu with additional options (e.g., invite, message)
	const dropdownMenu = createDropdownMenu(username, user, chatSocket);

	// Group the user button, dropdown toggle, and dropdown menu into a button group
	const btnGroup = document.createElement("div");
	btnGroup.classList.add("btn-group");
	btnGroup.appendChild(userButton);
	btnGroup.appendChild(dropdownToggle);
	btnGroup.appendChild(dropdownMenu);

	// Return the complete button group
	return btnGroup;
}

// Function to toggle the selection state of a user button
function toggleUserSelection(button, user) {
	// Check if the button is currently active (selected)
	if (button.classList.contains('active')) {
		// If active, remove the active class and deselect the user
		button.classList.remove('active');
		selectedUser = null;
	} else {
		// If not active, deactivate any other active buttons in the list
		document.querySelectorAll('#online-users-list .active').forEach(btn => btn.classList.remove('active'));

		// Activate the clicked button and set the selected user
		button.classList.add('active');
		selectedUser = user;
	}
}

// Function to create the dropdown toggle button (right side of the split)
function createDropdownToggle() {
	// Create the dropdown toggle button element
	const dropdownToggle = document.createElement("button");

	// Add necessary classes for styling and behavior
	dropdownToggle.classList.add("btn", "btn-sm", "btn-secondary", "dropdown-toggle", "dropdown-toggle-split", "btn-right");
	dropdownToggle.type = 'button';

	// Set attributes for Bootstrap dropdown functionality
	dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
	dropdownToggle.setAttribute('aria-haspopup', 'true');
	dropdownToggle.setAttribute('aria-expanded', 'false');

	// Return the dropdown toggle button
	return dropdownToggle;
}

// Function to create the dropdown menu with actions
function createDropdownMenu(username, user, chatSocket) {
	// Create the dropdown menu container
	const dropdownMenu = document.createElement("div");
	dropdownMenu.classList.add("dropdown-menu");

	// Check if the username is the same as the user (i.e., the user is viewing their own profile)
	if (username === user) {
		// Create a disabled item for the user's own profile
		const disabledItem = document.createElement("span");
		disabledItem.classList.add("dropdown-item", "disabled");
		disabledItem.textContent = "Hi " + username + "!";
		dropdownMenu.appendChild(disabledItem);
		return dropdownMenu;  // Return the menu with the disabled item
	}

	// Create menu items for other actions if the user is different from the username
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
	const action4 = createDropdownItem("Invite to play Pong", "#", () => sendGameInvite(user, "Pong"));
	const action5 = createDropdownItem("Invite to play Snake", "#", () => sendGameInvite(user, "Snake"));

	// Append the actions to the dropdown menu in the specified order
	dropdownMenu.appendChild(action1);
	dropdownMenu.appendChild(action0);
	dropdownMenu.appendChild(action2);
	dropdownMenu.appendChild(action3);
	dropdownMenu.appendChild(action4);
	dropdownMenu.appendChild(action5);

	// Return the completed dropdown menu
	return dropdownMenu;
}

// Function to create an item for the dropdown menu
function createDropdownItem(text, href, onClick) {
	// Create the anchor element for the dropdown item
	const item = document.createElement("a");
	item.classList.add("dropdown-item");
	item.href = href;  // Set the href attribute (though it may not be used if onClick is provided)
	item.textContent = text;  // Set the text content for the item

	// Add a click event listener if an onClick function is provided
	if (onClick) {
		item.addEventListener('click', function (e) {
			e.preventDefault();  // Prevent the default anchor behavior
			onClick();  // Call the onClick function without passing the event object
		});
	}

	// Return the created dropdown item
	return item;
}


function handleCancelInvite(recipient, roomCode) {
	const cancelMessage = {
		"type": "cancel_invite",
		"recipient": recipient,
		"roomCode": roomCode
	};
	console.log('Cancel invite sent to', recipient);
	chatSocketInstance.send(cancelMessage);
	// Atualize a interface do usuário após o cancelamento
	// document.getElementById('root').innerHTML = '';
	displaySlidingMessage(`Invite to ${recipient} has been canceled.`);
}

// Function to send a game invite to a user
async function sendGameInvite(user, game) {
	console.log('Send Game Invite to User: ', user);

	// Create a new room and get the room code
	roomCode = await createRoom(user);
	console.log('Invite: roomCode: ', roomCode);

	// Construct the invite message
	const inviteMessage = {
		"type": "invite",
		"recipient": user,
		"game": game,
		"roomCode": roomCode
	};
	console.log('Invite sent to', user);
	console.log('InviteMessage: ', inviteMessage);

	// Send the invite message through the chat socket
	chatSocketInstance.send(inviteMessage);

	// Create and display a pending invite indicator with a cancel button
	const invitePendingDiv = document.createElement('div');
	invitePendingDiv.classList.add('invite-pending');
	invitePendingDiv.id = 'invitePending';

	// Create and configure the cancel button
	const cancelButton = document.createElement('button');
	cancelButton.id = 'cancelButton';
	cancelButton.classList.add('btn', 'btn-danger');
	cancelButton.textContent = 'Cancel';
	cancelButton.addEventListener('click', () => {
		handleCancelInvite(user, roomCode);  // Handle the cancellation of the invite
		invitePendingDiv.remove();  // Remove the invite pending indicator
	});

	// Append the cancel button to the invite pending indicator and add it to the DOM
	invitePendingDiv.appendChild(cancelButton);
	document.getElementById('root').appendChild(invitePendingDiv);
}

export { selectedUser, displayChatMessage, displayGameInvite, handleInviteResponse, updateOnlineUsersList }