// pong/static/pong/pong.js

const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const socket = new WebSocket('ws://localhost:8000/ws/pong/');

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    drawGame(data.ball_position, data.paddle_positions);
};

socket.onopen = function(event) {
    // Enviar dados iniciais ao backend se necessário
    const initialState = {
        ball_position: [400, 300],
        paddle_positions: [[10, 250], [780, 250]]
    };
    socket.send(JSON.stringify(initialState));
};

function sendGameState(gameState) {
    socket.send(JSON.stringify(gameState));
}

function drawGame(ball, paddles) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar bola
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(ball[0], ball[1], 10, 0, Math.PI * 2);
    context.fill();

    // Desenhar raquetes
    context.fillRect(paddles[0][0], paddles[0][1], 10, 100);
    context.fillRect(paddles[1][0], paddles[1][1], 10, 100);
}

function gameLoop() {
    // Capturar estado do jogo e enviar ao backend
    const gameState = {
        ball_position: [/* posição atual da bola */],
        paddle_positions: [/* posições atuais das raquetes */]
    };
    sendGameState(gameState);
    requestAnimationFrame(gameLoop);
}

gameLoop();
