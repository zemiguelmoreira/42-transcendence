// const canvas = document.getElementById('pongCanvas');
// const context = canvas.getContext('2d');

// const socket = new WebSocket('wss://localhost/game/ws/pong/');
// // const socket = new WebSocket('wss://vintagebytes.zapto.org/game/ws/pong/');

// let paddlePositions = [[10, 250], [780, 250]];
// let ballPosition = [400, 300];
// let predictedBallPosition = [...ballPosition];
// let playerIndex = null;
// let lastUpdateTime = Date.now();
// let ballVelocity = [300, 300]; // Velocidade da bola (pixels por segundo)
// let paddleDirection = 'idle';

// socket.onmessage = function(event) {
//     const data = JSON.parse(event.data);
//     if (data.action === 'assign_index') {
//         playerIndex = data.player_index;
//         ballPosition = data.ball_position;
//         paddlePositions = data.paddle_positions;
//     } else {
//         ballPosition = data.ball_position;
//         paddlePositions = data.paddle_positions;
//     }
//     lastUpdateTime = Date.now();
// };

// socket.onopen = function(event) {
//     socket.send(JSON.stringify({ action: 'join' }));
// };

// socket.onclose = function(event) {
//     console.log('WebSocket connection closed:', event);
// };

// function sendMoveCommand(direction) {
//     socket.send(JSON.stringify({
//         action: 'move',
//         player_index: playerIndex,
//         direction: direction
//     }));
// }

// function drawGame(ball, paddles) {
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     context.fillStyle = 'white';
//     context.beginPath();
//     context.arc(ball[0], ball[1], 10, 0, Math.PI * 2);
//     context.fill();

//     context.fillRect(paddles[0][0], paddles[0][1], 10, 100);
//     context.fillRect(paddles[1][0], paddles[1][1], 10, 100);
// }

// document.addEventListener('keydown', function(event) {
//     if (playerIndex === null) return;
//     switch (event.key) {
//         case 'ArrowUp':
//             paddleDirection = 'up';
//             sendMoveCommand('up');
//             break;
//         case 'ArrowDown':
//             paddleDirection = 'down';
//             sendMoveCommand('down');
//             break;
//     }
// });

// document.addEventListener('keyup', function(event) {
//     if (playerIndex === null) return;
//     switch (event.key) {
//         case 'ArrowUp':
//         case 'ArrowDown':
//             paddleDirection = 'idle';
//             sendMoveCommand('idle');
//             break;
//     }
// });

// function interpolate() {
//     const currentTime = Date.now();
//     const timeDelta = (currentTime - lastUpdateTime) / 1000; // Convert to seconds

//     // Predicting ball position with simple linear interpolation
//     predictedBallPosition[0] = ballPosition[0] + (ballVelocity[0] * timeDelta);
//     predictedBallPosition[1] = ballPosition[1] + (ballVelocity[1] * timeDelta);

//     // Ensure the ball doesn't go out of bounds during interpolation
//     if (predictedBallPosition[0] < 0 || predictedBallPosition[0] > canvas.width) {
//         predictedBallPosition[0] = Math.max(0, Math.min(predictedBallPosition[0], canvas.width));
//     }
//     if (predictedBallPosition[1] < 0 || predictedBallPosition[1] > canvas.height) {
//         predictedBallPosition[1] = Math.max(0, Math.min(predictedBallPosition[1], canvas.height));
//     }
// }

// function gameLoop() {
//     interpolate();
//     drawGame(predictedBallPosition, paddlePositions);
//     requestAnimationFrame(gameLoop);
// }

// requestAnimationFrame(gameLoop);

const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const socket = new WebSocket('wss://localhost/game/ws/pong/');
// const socket = new WebSocket('wss://vintagebytes.zapto.org/game/ws/pong/');

let paddlePositions = [[10, 250], [780, 250]];
let ballPosition = [400, 300];
let playerIndex = null;
let paddleDirection = 'idle';

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
};

socket.onopen = function(event) {
    socket.send(JSON.stringify({ action: 'join' }));
};

socket.onclose = function(event) {
    console.log('WebSocket connection closed:', event);
};

function sendMoveCommand(direction) {
    socket.send(JSON.stringify({
        action: 'move',
        player_index: playerIndex,
        direction: direction
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
            paddleDirection = 'up';
            sendMoveCommand('up');
            break;
        case 'ArrowDown':
            paddleDirection = 'down';
            sendMoveCommand('down');
            break;
    }
});

document.addEventListener('keyup', function(event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            paddleDirection = 'idle';
            sendMoveCommand('idle');
            break;
    }
});

function gameLoop() {
    drawGame(ballPosition, paddlePositions);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

