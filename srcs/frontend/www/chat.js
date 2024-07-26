const chat_accessToken = localStorage.getItem('accessToken');
console.log('chat access token: ' + chat_accessToken);
chat_socket = new WebSocket(`wss://${window.location.host}/chat/ws/?token=${chat_accessToken}`);

// Event listeners for WebSocket events
chat_socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
});

chat_socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
});

chat_socket.addEventListener('close', () => {
    console.log('WebSocket connection closed');
});

chat_socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});
