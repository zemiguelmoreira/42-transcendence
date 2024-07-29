let selectedUser = null;

document.addEventListener("DOMContentLoaded", function () {
    const chatLog = document.getElementById("chat-log");
    const chatMessageInput = document.getElementById("chat-message-input");
    const chatMessageSubmit = document.getElementById("chat-message-submit");
    const onlineUsersList = document.getElementById("online-users-list");

document.getElementById('inviteButton').addEventListener('click', function() {
        const inviteMessage = {
            invite: true,
            recipient: selectedUser
        };
        chatSocket.send(JSON.stringify(inviteMessage));
        console.log('Invite sent to', selectedUser);
});


    const token = localStorage.getItem('accessToken');

    const chatSocket = new WebSocket(
        `wss://${window.location.host}/chat/ws/?token=${token}`
    );

    chatSocket.onopen = function() {
        // console.log('WebSocket connection established');
    };

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);

        if (data.message) {
            const message = data.message ? data.message.replace(/\n/g, '<br>') : '';
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
            const invite_message = sender + ' has invited you to play a game of pong! ';
            const inviteElement = document.createElement("div");
            inviteElement.style.color = "coralpink";
            inviteElement.innerHTML = invite_message;
            const inviteButton = document.createElement("button");
            inviteButton.textContent = "Accept Invite";
            inviteButton.onclick = function() {
                // Handle invite acceptance
                console.log('Invite accepted');
                // You can add more logic here to handle the invite acceptance
            };
            inviteElement.appendChild(inviteButton);
            chatLog.appendChild(inviteElement);
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
            // console.log('Online users:', data.online_users);
        }
    };

    chatSocket.onclose = function(e) {
        // console.log('WebSocket connection closed');
    };

    chatSocket.onerror = function(error) {
        // console.error('WebSocket error:', error);
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
        // console.log('Message sent:', message);
    };

    chatMessageInput.addEventListener("keyup", function(e) {
        if (e.key === "Enter") {
            chatMessageSubmit.click();
        }
    });
});

