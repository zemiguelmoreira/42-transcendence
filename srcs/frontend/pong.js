const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const socket = new WebSocket('wss://vintagebytes.zapto.org/game/ws/pong/');

let paddlePositions = [[10, 250], [780, 250]];
let ballPosition = [400, 300];
let playerIndex = null;

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.action === 'assign_index') {
        playerIndex = data.player_index;
        ballPosition = data.ball_position;
        paddlePositions = data.paddle_positions;
    } else {
        ballPosition = data.ball_position;
        paddlePositions = data.paddle_positions;
    }
    drawGame(ballPosition, paddlePositions);
};

socket.onopen = function(event) {
    // Solicitar o índice do jogador ao servidor
    socket.send(JSON.stringify({ action: 'join' }));
};

socket.onclose = function(event) {
    console.log('WebSocket connection closed:', event);
};

function sendGameState() {
    socket.send(JSON.stringify({
        action: 'update',
        paddle_positions: paddlePositions
    }));
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
        case 'ArrowUp':
            paddlePositions[playerIndex][1] = Math.max(paddlePositions[playerIndex][1] - 10, 0);
            break;
        case 'ArrowDown':
            paddlePositions[playerIndex][1] = Math.min(paddlePositions[playerIndex][1] + 10, canvas.height - 100);
            break;
    }
    sendGameState();
});

function gameLoop() {
    drawGame(ballPosition, paddlePositions);
    requestAnimationFrame(gameLoop);
}

gameLoop();
