// document.addEventListener('DOMContentLoaded', function() {
//     const liveChat = document.getElementById('live-chat');
//     const messageInput = document.getElementById('message-input');
//     const sendButton = document.getElementById('send-button');
//     const userSelect = document.getElementById('user-select');

//     let chatSocket;
//     let selectedUser = null;

//     // Initialize WebSocket connection
//     function initChatSocket() {
//         if (chatSocket) {
//             chatSocket.close();
//         }

//         const chatAccessToken = localStorage.getItem('accessToken');
//         chatSocket = new WebSocket(
//             'wss://' + window.location.host + '/wss/chat/?token=' + chatAccessToken
//         );

//         chatSocket.onmessage = function(e) {

//         };

//         chatSocket.onclose = function(e) {
//             console.error('Chat socket closed unexpectedly');
//         };
//     }

//     // Load users online
//     function loadUsers() {
//         fetch

//         users.forEach(user => {
//             const userElement = document.createElement('div');
//             userElement.innerText = user;
//             userElement.className = 'user';
//             userElement.onclick = () => selectUser(user);
//             userSelect.appendChild(userElement);
//         });
//     }

//     // Handle user selection
//     // function selectUser(user) {
//     //     selectedUser = user;
//     //     const users = document.getElementsByClassName('user');
//     //     for (let i = 0; i < users.length; i++) {
//     //         users[i].classList.remove('selected');
//     //     }
//     //     document.querySelector(`div.user:contains("${user}")`).classList.add('selected');
//     // }

//     // Handle sending messages
//     // sendButton.onclick = function() {
//     //     if (!selectedUser) {
//     //         alert('Please select a user to send a message.');
//     //         return;
//     //     }

//     //     const message = messageInput.value;

//     //     chatSocket.send(JSON.stringify({
//     //         'message': message,
//     //         'recipient': selectedUser
//     //     }));
//     //     messageInput.value = '';
//     // };

//     // Initialize
//     loadUsers();
//     initChatSocket();
// });
document.addEventListener("DOMContentLoaded", () => {
    const userList = document.getElementById("user-list");
    const messages = document.getElementById("messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    let selectedUser = null;
    let socket = null;

    function connectToChat() {
        const chatAccessToken = localStorage.getItem('accessToken');
        socket = new WebSocket(
            'wss://' + window.location.host + '/chat/ws/?token=' + chatAccessToken);

        socket.onopen = () => {
            console.log("Connected to chat server");
            // Fetch online users once connected
            fetchOnlineUsers();
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const messageElement = document.createElement("div");
                messageElement.textContent = `${data.from}: ${data.message}`;
                messages.appendChild(messageElement);
                messages.scrollTop = messages.scrollHeight;
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        socket.onclose = () => {
            console.log("Disconnected from chat server");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    async function fetchOnlineUsers() {
        try {
            const response = await fetch('/chat/online-users/');
            if (!response.ok) throw new Error('Failed to fetch online users');
            const users = await response.json();
            console.log('Fetched users:', users);
            updateOnlineUsers(users);
        } catch (error) {
            console.error('Error fetching online users:', error);
        }
    }

    function updateOnlineUsers(users) {
        console.log('Updating online users:', users);
        userList.innerHTML = "";
        users.forEach(user => {
            const userElement = document.createElement("li");
            userElement.textContent = user;
            userElement.addEventListener("click", () => {
                console.log(`User ${user} clicked`);
                connectToPrivateChat(user);
            });
            userList.appendChild(userElement);
        });
    }

    function connectToPrivateChat(user) {
        console.log('Connecting to chat with user:', user);
        if (socket) {
            // Optionally close previous private chat if needed
            socket.send(JSON.stringify({ action: 'disconnect', user: selectedUser }));
        }

        selectedUser = user;
        const token = localStorage.getItem('accessToken');
        const wsUrl = `wss://localhost:8000/chat/ws/?token=${encodeURIComponent(token)}&other_user=${encodeURIComponent(user)}`;

        console.log('Connecting to WebSocket for private chat:', wsUrl);
        const privateSocket = new WebSocket(wsUrl);

        privateSocket.onopen = () => {
            console.log(`Connected to private chat with ${user}`);
        };

        privateSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const messageElement = document.createElement("div");
                messageElement.textContent = `${data.from}: ${data.message}`;
                messages.appendChild(messageElement);
                messages.scrollTop = messages.scrollHeight;
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        privateSocket.onclose = () => {
            console.log(`Disconnected from private chat with ${user}`);
        };

        privateSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    function sendMessage() {
        if (socket && selectedUser) {
            const message = messageInput.value;
            if (message.trim()) {
                socket.send(JSON.stringify({
                    message: message,
                    to: selectedUser
                }));
                messageInput.value = "";
            }
        } else {
            console.warn("No active WebSocket connection or user selected");
        }
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Connect to chat server on page load
    connectToChat();
});
