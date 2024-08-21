// Get the two canvases and their contexts
const backgroundCanvas = document.getElementById("pongBackgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = document.getElementById("pongCanvas").width;
const canvasHeight = document.getElementById("pongCanvas").height;

const paddleWidth = 20;
const paddleHeight = 100;
const ballSize = 20;

let paddleSpeed = 6;
let ballSpeedX = 4;
let ballSpeedY = 4;

// Paddle positions
let leftPaddleY = canvasHeight / 2 - paddleHeight / 2;
let rightPaddleY = canvasHeight / 2 - paddleHeight / 2;

// Ball position and direction
let ballX = canvasWidth / 2 - ballSize / 2;
let ballY = canvasHeight / 2 - ballSize / 2;
let ballDirX = ballSpeedX;
let ballDirY = ballSpeedY;

// Key states for both players
let wPressed = false;
let sPressed = false;
let upPressed = false;
let downPressed = false;

// Scores
let player1Score = 0;
let player2Score = 0;

function drawDigit(ctx, n, x, y) {
    const segmentSize = 20; // Tamanho de cada segmento (20x20 pixels)
    const segmentMargin = 0; // Espaçamento entre segmentos

    // Define os números de 0 a 9 usando uma matriz 5x3
    const digits = [
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1]
        ], // 0
        [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0]
        ], // 1
        [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1]
        ], // 2
        [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ], // 3
        [
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1]
        ], // 4
        [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ], // 5
        [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ], // 6
        [
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1]
        ], // 7
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ], // 8
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1]
        ]  // 9
    ];

    // Define a cor do segmento
    ctx.fillStyle = "gray"; // Branco

    // Desenha o dígito
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

function drawScores() {
    // Clear the background canvas
    backgroundCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the dashed line
    drawDashedLine();

    // Define a largura e altura dos dígitos
    const digitWidth = 3 * (20 + 0); // 3 segmentos + 0 margens
    const digitHeight = 5 * (20 + 0); // 5 segmentos + 0 margens
    const scoreSpacing = 10; // Espaço entre os dígitos

    // Calcula a posição dos dígitos
    const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
    const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);

    // Desenha os dígitos
    drawDigit(backgroundCtx, player1Score, player1X, 30); // Pontuação do Jogador 1
    drawDigit(backgroundCtx, player2Score, player2X, 30); // Pontuação do Jogador 2
}






function drawRect(x, y, width, height, color, ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall() {
    drawRect(ballX, ballY, ballSize, ballSize, "#fff", ctx);
}

function drawPaddles() {
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx); // Left paddle
    drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx); // Right paddle
}

function drawDashedLine() {
    backgroundCtx.beginPath();
    backgroundCtx.setLineDash([20, 20]);  // Dash length and space between dashes
    backgroundCtx.moveTo(canvasWidth / 2, 0);  // Start at the top middle
    backgroundCtx.lineTo(canvasWidth / 2, canvasHeight);  // Draw to the bottom middle
    backgroundCtx.strokeStyle = "#fff";  // White color for the line
    backgroundCtx.lineWidth = 20;  // Line width
    backgroundCtx.stroke();  // Render the line
    backgroundCtx.setLineDash([]);  // Reset the dash settings
}

function movePaddles() {
    // Move left paddle (Player 1)
    if (wPressed && leftPaddleY > 0) {
        leftPaddleY -= paddleSpeed;
    }
    if (sPressed && leftPaddleY < canvasHeight - paddleHeight) {
        leftPaddleY += paddleSpeed;
    }

    // Move right paddle (Player 2)
    if (upPressed && rightPaddleY > 0) {
        rightPaddleY -= paddleSpeed;
    }
    if (downPressed && rightPaddleY < canvasHeight - paddleHeight) {
        rightPaddleY += paddleSpeed;
    }
}

function moveBall() {
    ballX += ballDirX;
    ballY += ballDirY;

    // Ball collision with top/bottom walls
    if (ballY <= 0 || ballY + ballSize >= canvasHeight) {
        ballDirY *= -1;
    }

    // Ball collision with paddles
    if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
        ballDirX *= -1;
    }
    if (ballX + ballSize >= canvasWidth - paddleWidth && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
        ballDirX *= -1;
    }

    // Ball out of bounds
    if (ballX <= 0) {
        player2Score++;
        resetBall();
    }
    if (ballX + ballSize >= canvasWidth) {
        player1Score++;
        resetBall();
    }
}

function resetBall() {
    ballX = canvasWidth / 2 - ballSize / 2;
    ballY = canvasHeight / 2 - ballSize / 2;
    ballDirX = -ballSpeedX; // Start ball moving towards player 2
    ballDirY = ballSpeedY;
}

function updateGame() {
    // Clear the canvas for the ball and paddles
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the background and scores
    drawScores();

    // Update paddle and ball positions
    movePaddles();
    moveBall();

    // Draw paddles and ball
    drawPaddles();
    drawBall();

    // Request next frame
    requestAnimationFrame(updateGame);
}

// Handle keydown events
document.addEventListener("keydown", function (e) {
    if (e.key === "w") {
        wPressed = true;
    } else if (e.key === "s") {
        sPressed = true;
    } else if (e.key === "ArrowUp") {
        upPressed = true;
    } else if (e.key === "ArrowDown") {
        downPressed = true;
    }
});

// Handle keyup events
document.addEventListener("keyup", function (e) {
    if (e.key === "w") {
        wPressed = false;
    } else if (e.key === "s") {
        sPressed = false;
    } else if (e.key === "ArrowUp") {
        upPressed = false;
    } else if (e.key === "ArrowDown") {
        downPressed = false;
    }
});

// Start the game
updateGame();
