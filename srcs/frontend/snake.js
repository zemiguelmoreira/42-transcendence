const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

let snake_socket;
let snake1 = [];
let snake2 = [];
let food = {};
let playerIndex = null;
let direction1 = null;
let direction2 = null;
let authorizedUser = "";
let stopFlag = false;

document.getElementById('startSnakeOnlineForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const user2 = document.getElementById('user2-snake').value;
    authorizedUser = user2;
    const roomName = `room_${user2}`;
    joinRoom(roomName);
});

document.getElementById('joinSnakeOnlineForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const roomName = document.getElementById('roomName').value;
    joinRoom(roomName);
});

function joinRoom(roomName) {
    const snake_accessToken = localStorage.getItem('accessToken');

    snake_socket = new WebSocket(`wss://${window.location.host}/game/ws/snake/${roomName}/?token=${snake_accessToken}&authorized_user=${authorizedUser}`);

    snake_socket.onmessage = async function(event) {
        const data = JSON.parse(event.data);
        if (data.action === 'assign_index') {
            playerIndex = data.player_index;
            snake1 = data.snake1 || [];
            snake2 = data.snake2 || [];
            food = data.food || {};
            startGame();
        } else if (data.action === 'start_game') {
            startGame();
        } else if (data.action === 'game_over' && !stopFlag) {
            alert('Game Over!');
            stopFlag = true;
            const winner = data.winner;
            const loser = data.loser;
            const winnerScore = data.winner_score;
            const loserScore = data.loser_score;
            const gameType = 'snake';
            const timestamp = new Date().toISOString();

            const score = JSON.stringify({
                winner: winner,
                loser: loser,
                game_type: gameType,
                user1_score: winnerScore,
                user2_score: loserScore,
                timestamp: timestamp
            });
            console.log(score);

            try {
                const response = await fetch('/api/profile/update_match_history/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: score,
                });

                if (response.ok) {
                    alert('Match data sent successfully!');
                } else {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to send match data');
                }
                snake_socket.close();
            } catch (error) {
                console.error('Error:', error.message);
                alert('Failed to send match data. Please try again.');
            }
        } else {
            snake1 = data.snake1 || [];
            snake2 = data.snake2 || [];
            food = data.food || {};
        }

        drawGame();
    };

    snake_socket.onopen = function(event) {
        snake_socket.send(JSON.stringify({ action: 'join' }));
    };

    snake_socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
    };
}

function sendMoveCommand(direction) {
    if (playerIndex !== null) {
        snake_socket.send(JSON.stringify({
            action: 'move',
            player_index: playerIndex,
            direction: direction
        }));
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (snake1 && snake1.length) drawSnake(snake1, 'red');
    if (snake2 && snake2.length) drawSnake(snake2, 'blue');
    if (food) drawFood(food);
}

function drawSnake(snake, color) {
    snake.forEach((position, index) => {
        const alpha = 0.5 + (index / snake.length) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(position.x, position.y, 20, 20);
    });
    ctx.globalAlpha = 1;
}

function drawFood(food) {
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = food.color;
    ctx.fillRect(food.x, food.y, 20, 20);
    ctx.shadowBlur = 0;
}

document.addEventListener('keydown', function(event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'ArrowRight':
            if (direction2 !== 'left') direction2 = 'right';
            sendMoveCommand('right');
            break;
        case 'ArrowLeft':
            if (direction2 !== 'right') direction2 = 'left';
            sendMoveCommand('left');
            break;
        case 'ArrowDown':
            if (direction2 !== 'up') direction2 = 'down';
            sendMoveCommand('down');
            break;
        case 'ArrowUp':
            if (direction2 !== 'down') direction2 = 'up';
            sendMoveCommand('up');
            break;
        case 'd':
            if (direction1 !== 'left') direction1 = 'right';
            sendMoveCommand('right');
            break;
        case 'a':
            if (direction1 !== 'right') direction1 = 'left';
            sendMoveCommand('left');
            break;
        case 's':
            if (direction1 !== 'up') direction1 = 'down';
            sendMoveCommand('down');
            break;
        case 'w':
            if (direction1 !== 'down') direction1 = 'up';
            sendMoveCommand('up');
            break;
    }
});

function gameLoop() {
    drawGame();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameLoop();
}
