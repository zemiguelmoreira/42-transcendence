let selectedUser = null;

document.addEventListener("DOMContentLoaded", function () {
    const chatLog = document.getElementById("chat-log");
    const chatMessageInput = document.getElementById("chat-message-input");
    const chatMessageSubmit = document.getElementById("chat-message-submit");
    const onlineUsersList = document.getElementById("online-users-list");

    document.getElementById('inviteButton').addEventListener('click', function() {
        // if (selectedUser) {
            const inviteMessage = {
                "type": "invite",
                "recipient": selectedUser
            };
            chatSocket.send(JSON.stringify(inviteMessage));
            console.log('Invite sent to', selectedUser);
        // } else {
        //     console.log('No user selected for invite.');
        // }
    });

    const token = localStorage.getItem('accessToken');
    const chatSocket = new WebSocket(
        `wss://${window.location.host}/chat/ws/?token=${token}`
    );

    chatSocket.onopen = function() {
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
            const message = data.message.replace(/\n/g, '<br>');
            const sender = data.sender;
            const messageElement = document.createElement("div");

            if (data.private) {
                messageElement.style.color = "lightpink";
            } else if (data.system) {
                messageElement.style.color = "lightblue";
            } else if (data.selfdm) {
                messageElement.style.color = "lightgreen";
            } else if (data.error) {
                messageElement.style.color = "red";
            }

            messageElement.innerHTML = `${sender}: ${message}`;
            chatLog.appendChild(messageElement);
            chatLog.scrollTop = chatLog.scrollHeight;

            console.log('Received message:', data);
        } else if (data.invite) {
            const sender = data.sender;
            const inviteMessage = `${sender} has invited you to play a game of pong! `;
            const inviteElement = document.createElement("div");
            inviteElement.style.color = "coralpink";
            inviteElement.innerHTML = inviteMessage;

            const acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";
            acceptButton.onclick = function() {
                const inviteAccepted = {
                    "accepted": true,
                    "inviter": sender,
                    "type": "invite_response",
                };
                chatSocket.send(JSON.stringify(inviteAccepted));
                // console.log('Invite accepted');
                acceptButton.disabled = true;
                rejectButton.disabled = true;
                // Handle start game
                //
                //
                //
            };

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.onclick = function() {
                const inviteRejected = {
                    "accepted": false,
                    "inviter": sender,
                    "type": "invite_response",
                };
                chatSocket.send(JSON.stringify(inviteRejected));
                console.log('Invite rejected');
                acceptButton.disabled = true;
                rejectButton.disabled = true;
            };

            inviteElement.appendChild(acceptButton);
            inviteElement.appendChild(rejectButton);
            chatLog.appendChild(inviteElement);
            chatLog.scrollTop = chatLog.scrollHeight;
        } else if (data.invite_response) {
            const invitee = data.invitee;
            const accepted = data.accepted;
            let responseMessage;
            
            if (accepted) {
                responseMessage = `${invitee} has accepted your invite!`;
                // Handle game start
                // 
                //
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
            data.online_users.forEach(function(user) {
                const userElement = document.createElement("div");
                userElement.textContent = user;
                userElement.classList.add("user-item");
                userElement.onclick = function() {
                    if (selectedUser === user) {
                        selectedUser = null;
                        userElement.classList.remove("selected");
                    } else {
                        selectedUser = user;
                        document.querySelectorAll(".user-item").forEach(el => el.classList.remove("selected"));
                        userElement.classList.add("selected");
                    }
                };
                onlineUsersList.appendChild(userElement);
            });
            console.log('Online users:', data.online_users);
        }
    };

    chatSocket.onclose = function(e) {
        console.log('WebSocket connection closed:', e);
    };

    chatSocket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    chatMessageSubmit.onclick = function() {
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

    chatMessageInput.addEventListener("keyup", function(e) {
        if (e.key === "Enter") {
            chatMessageSubmit.click();
        }
    });
});