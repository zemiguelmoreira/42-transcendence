const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

let pong_socket;
let paddlePositions = [[10, 250], [780, 250]];
let ballPosition = [400, 300];
let playerIndex = null;
let stopFlag = false;

async function createRoom() {
    const pong_accessToken = localStorage.getItem('accessToken');
    const authorizedUser = document.getElementById('authorizedUser').value;
    console.log(authorizedUser);
    
    try {
        const response = await fetch('/game/create-room/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pong_accessToken}`
            },
            body: JSON.stringify({
                authorized_user: authorizedUser
            }),
        });
        const data = await response.json();
        console.log(data);
        if (!response.ok) {
            console.error('error:', data);
        }
        document.getElementById('roomCodeDisplay').textContent = `Room Code: ${data.code}`;
    } catch (error) {
        console.error('Error creating room:', error);
    }
}

function joinRoom() {
    const pong_accessToken = localStorage.getItem('accessToken');
    const roomCode = document.getElementById('roomCodeInput').value;
    console.log(roomCode);

        pong_socket = new WebSocket(`wss://${window.location.host}/game/ws/pong/${roomCode}/?token=${pong_accessToken}`);

    pong_socket.onmessage = async function(event) {
        const data = JSON.parse(event.data);
        // console.log('Received message:', data);
        if (data.action === 'unauthorized') {
            console.log('not authorized');
        } else if (data.action === 'assign_index') {
            playerIndex = data.player_index;
            ballPosition = data.ball_position;
            paddlePositions = data.paddle_positions;
            startGame(); // Inicia o jogo assim que o índice do jogador é atribuído, talvez aqui entrar numa waiting page 
        } else if (data.action === 'start_game') {
            startGame(); // Inicia o jogo ao receber a mensagem 'start_game'
        } else if (data.action === 'game_over' && !stopFlag) {
            alert('Game Over!');
            stopFlag = true;
            const winner = data.winner;
            const loser = data.loser;
            const winnerScore = data.winner_score;
            const loserScore = data.loser_score;
            const gameType = 'pong';
            const timestamp = new Date().toISOString();

            const score = JSON.stringify({
                winner: winner,
                loser: loser,
                game_type: gameType,
                winner_score: winnerScore,
                loser_score: loserScore,
                timestamp: timestamp
            });
            console.log(score);
            // Enviar dados do jogo para a API, nao esta funcionando.
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
                pong_socket.close();
            } catch (error) {
                console.error('Error:', error.message);
                alert('Failed to send match data. Please try again.');
            }
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


document.getElementById('createRoomButton').addEventListener('click', createRoom);
document.getElementById('joinRoomButton').addEventListener('click', joinRoom);