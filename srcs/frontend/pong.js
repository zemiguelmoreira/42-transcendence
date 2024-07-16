const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

let pong_socket;
let paddlePositions = [[10, 250], [780, 250]];
let ballPosition = [400, 300];
let playerIndex = null;
let paddleDirection = 'idle';
let authorizedUser = "";

document.getElementById('startPongOnlineForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const user2 = document.getElementById('user2-pong').value;
    authorizedUser = user2;
    const roomName = `room_${user2}`;
    joinRoom(roomName);
});

document.getElementById('joinPongOnlineForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const roomName = document.getElementById('roomName').value;
    joinRoom(roomName);
});

function joinRoom(roomName) {
    const pong_accessToken = localStorage.getItem('accessToken');
    console.log('pong access token: ' + pong_accessToken);
    console.log('room name: ' + roomName);

    pong_socket = new WebSocket(`wss://localhost/game/ws/pong/${roomName}/?token=${pong_accessToken}&authorized_user=${authorizedUser}`);

    pong_socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        if (data.action === 'assign_index') {
            playerIndex = data.player_index;
            ballPosition = data.ball_position;
            paddlePositions = data.paddle_positions;
            startGame(); // Inicia o jogo assim que o índice do jogador é atribuído
        } else if (data.action === 'start_game') {
            startGame(); // Inicia o jogo ao receber a mensagem 'start_game'
        } else if (data.action === 'game_over') {
            alert(`Game Over! Scores: ${data.scores}`);
            // Handle game over
        } else {
            ballPosition = data.ball_position;
            paddlePositions = data.paddle_positions;
        }

        // Chama a função para redesenhar o jogo após receber os dados
        drawGame(ballPosition, paddlePositions);
    };

    pong_socket.onopen = function(event) {
        pong_socket.send(JSON.stringify({ action: 'join' }));
    };

    pong_socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
    };
}

function sendMoveCommand(direction) {
    if (playerIndex !== null) {
        pong_socket.send(JSON.stringify({
            action: 'move',
            player_index: playerIndex,
            direction: direction
        }));
    }
}

function drawGame(ball, paddles) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.beginPath();
    context.arc(ball[0], ball[1], 10, 0, Math.PI * 2);
    context.fill();

    context.fillRect(paddles[0][0], paddles[0][1], 10, 100);
    context.fillRect(paddles[1][0], paddles[1][1], 10, 100);
}

document.addEventListener('keydown', function(event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'w':
            paddleDirection = 'up';
            sendMoveCommand('up');
            break;
        case 's':
            paddleDirection = 'down';
            sendMoveCommand('down');
            break;
    }
});

document.addEventListener('keyup', function(event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'w':
        case 's':
            paddleDirection = 'idle';
            sendMoveCommand('idle');
            break;
    }
});

function gameLoop() {
    drawGame(ballPosition, paddlePositions);
    requestAnimationFrame(gameLoop);
}

function startGame() {
    console.log('Entered start game');
    gameLoop(); // Inicia o loop de renderização do jogo
}
