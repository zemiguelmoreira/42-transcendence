let pong_socket;
let paddlePositions = [];
let ballPosition = [0, 0];
let playerIndex = null;
let stopFlag = false;
const paddleWidth = 10;
const paddleHeight = 90;
const ballSize = 10;

let canvas, ctx, backgroundCanvas, backgroundCtx, canvasWidth, canvasHeight;
let player1Score = 0;
let player2Score = 0;
let ballX = 0;
let ballY = 0;
let leftPaddleY = 0;
let rightPaddleY = 0;
let player1Name = "";
let player2Name = "";

function setupPong() {
    backgroundCanvas = document.getElementById("pongBackgroundCanvas");
    backgroundCtx = backgroundCanvas.getContext("2d");
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

async function createRoom(authorizedUser) {
    const pong_accessToken = localStorage.getItem('access_token');
    let data;

    try {
        const response = await fetch('/game/create-room/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pong_accessToken}`
            },
            body: JSON.stringify({ authorized_user: authorizedUser }),
        });
        data = await response.json();
        console.log("CreateRoom: ", data);
        if (!response.ok) {
            console.error('error:', data);
        }
    } catch (error) {
        console.error('Error creating room:', error);
    }

    return data.code;
}

function joinRoom(roomCode) {
    const pong_accessToken = localStorage.getItem('access_token');

    try {
        document.getElementById('invitePending').innerHTML = `
            <div class="pong-content">
                <div class="pong-box">
                    <canvas id="pongBackgroundCanvas" width="960" height="560"></canvas>
                    <canvas id="pongCanvas" width="960" height="560"></canvas>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }

    setupPong();

    pong_socket = new WebSocket(`wss://${window.location.host}/game/ws/pong/${roomCode}/?token=${pong_accessToken}`);

    pong_socket.onmessage = async function (event) {
        const data = JSON.parse(event.data);
        if (data.action === 'unauthorized') {
            // Tratamento para usuários não autorizados
        } else if (data.action === 'assign_index') {
            playerIndex = data.player_index;
            ballPosition = data.ball_position;
            paddlePositions = data.paddle_positions;
        } else if (data.action === 'start_game') {
			player1Name = data.players[0];
			player2Name = data.players[1];
            startGame();
        } else if (data.action === 'game_over' && !stopFlag) {
            try {
                document.getElementById('invitePending').innerHTML = `
                    <button id='cancelButton' class="btn btn-danger">Game Over</button>
                `;
                document.getElementById('cancelButton').addEventListener('click', () => {
                    document.getElementById('invitePending').remove();
                });
            } catch (error) {
                console.error('Erro ao carregar o conteúdo:', error);
            }

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
        } else {
            console.log('data: ', data);
            player1Score = data.score[0];
            player2Score = data.score[1];
            ballX = data.ball_position[0];
            ballY = data.ball_position[1];
            leftPaddleY = data.paddle_positions[0][1];
            rightPaddleY = data.paddle_positions[1][1];
        }
    };

    pong_socket.onopen = function () {
        pong_socket.send(JSON.stringify({ action: 'join' }));
    };

    pong_socket.onclose = function () {
        // console.log('WebSocket connection closed');
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

function drawPlayerNames() {
    backgroundCtx.font = "30px PongFont";
    backgroundCtx.fillStyle = "gray";
    const centerLineX = canvasWidth / 2;
    const player1NameWidth = backgroundCtx.measureText(player1Name).width;
    const player1X = centerLineX - player1NameWidth - 20;
    backgroundCtx.textAlign = "left";
    const player2X = centerLineX + 20;
    const nameY = 170;
    backgroundCtx.fillText(player1Name, player1X, nameY);
    backgroundCtx.fillText(player2Name, player2X, nameY);
}

function drawDigit(ctx, n, x, y) {
    const segmentSize = 20;
    const segmentMargin = 0;
    const digits = [
        [[1, 1, 1], [1, 0, 1], [1, 0, 1], [1, 0, 1], [1, 1, 1]], // 0
        [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]], // 1
        [[1, 1, 1], [0, 0, 1], [1, 1, 1], [1, 0, 0], [1, 1, 1]], // 2
        [[1, 1, 1], [0, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]], // 3
        [[1, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]], // 4
        [[1, 1, 1], [1, 0, 0], [1, 1, 1], [0, 0, 1], [1, 1, 1]], // 5
        [[1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1], [1, 1, 1]], // 6
        [[1, 1, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]], // 7
        [[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1]], // 8
        [[1, 1, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]]  // 9
    ];
    ctx.fillStyle = "white";
    const digitMatrix = digits[n];
    digitMatrix.forEach((row, i) => {
        row.forEach((value, j) => {
            if (value === 1) {
                ctx.fillRect(
                    x + j * (segmentSize + segmentMargin),
                    y + i * (segmentSize + segmentMargin),
                    segmentSize,
                    segmentSize
                );
            }
        });
    });
}

function drawPONG(letterSpacing = -5) {
    ctx.font = "100px PongFont";
    ctx.fillStyle = "#69696950";
    const text = "PONG";
    const totalTextWidth = ctx.measureText(text).width + (text.length - 1) * letterSpacing - 15;
    let xPosition = (canvasWidth - totalTextWidth) / 2;
    const yPosition = canvasHeight - 20;
    for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], xPosition, yPosition);
        xPosition += ctx.measureText(text[i]).width + letterSpacing;
    }
}

function drawDashedLine() {
    backgroundCtx.beginPath();
    backgroundCtx.setLineDash([20, 20]);
    backgroundCtx.moveTo(canvasWidth / 2, 0);
    backgroundCtx.lineTo(canvasWidth / 2, canvasHeight);
    backgroundCtx.strokeStyle = "#fff";
    backgroundCtx.lineWidth = 10;
    backgroundCtx.stroke();
    backgroundCtx.setLineDash([]);
}

function drawScores() {
    backgroundCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawDashedLine();
    const digitWidth = 3 * (20 + 0);
    const digitHeight = 5 * (20 + 0);
    const scoreSpacing = 10;
    const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
    const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);
    drawDigit(backgroundCtx, player1Score, player1X, 30);
    drawDigit(backgroundCtx, player2Score, player2X, 30);
}

function drawRect(x, y, width, height, color, ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall() {
    drawRect(ballX, ballY, ballSize, ballSize, "#fff", ctx);
}

function drawPaddles() {
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
    drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawScores();
    drawPONG();
    drawPlayerNames();
    drawPaddles();
    drawBall();
}

document.addEventListener('keydown', function (event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'w':
            sendMoveCommand('up');
            break;
        case 's':
            sendMoveCommand('down');
            break;
    }
});

document.addEventListener('keyup', function (event) {
    if (playerIndex === null) return;
    switch (event.key) {
        case 'w':
        case 's':
            sendMoveCommand('idle');
            break;
    }
});

function gameLoop() {
    drawGame();
    requestAnimationFrame(gameLoop);
}

function countdown(callback) {
    let count = 3;

    function drawCountdown() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(count, canvas.width / 2, canvas.height / 2);
    }

    function updateCountdown() {
        if (count > 0) {
            drawCountdown();
            count--;
            setTimeout(updateCountdown, 1000);
        } else {
            callback();
        }
    }

    updateCountdown();
}

function startGame() {
    countdown(gameLoop);
}

export { createRoom, joinRoom };
