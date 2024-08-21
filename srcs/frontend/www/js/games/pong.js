// Get the two canvases and their contexts
const backgroundCanvas = document.getElementById("pongBackgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = 980;
const canvasHeight = 500;

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

function drawRect(x, y, width, height, color, ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall() {
    drawRect(ballX, ballY, ballSize, ballSize, "#fff", backgroundCtx);
}

function drawPaddles() {
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx); // Left paddle
    drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx); // Right paddle
}

// Function to draw a dashed line in the middle of the background canvas
function drawDashedLine() {
    backgroundCtx.beginPath();
    backgroundCtx.setLineDash([20, 20]);  // Dash length and space between dashes
    backgroundCtx.moveTo(canvasWidth / 2, 0);  // Start at the top middle
    backgroundCtx.lineTo(canvasWidth / 2, canvasHeight);  // Draw to the bottom middle
    backgroundCtx.strokeStyle = "#fff";  // White color for the line
    backgroundCtx.lineWidth = 20;  // Line width (matching ball size)
    backgroundCtx.stroke();  // Render the line
    backgroundCtx.setLineDash([]);  // Reset the dash settings (optional)
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
    if (ballX <= 0 || ballX + ballSize >= canvasWidth) {
        resetBall();
    }
}

function resetBall() {
    ballX = canvasWidth / 2 - ballSize / 2;
    ballY = canvasHeight / 2 - ballSize / 2;
    ballDirX *= -1;
    ballDirY = ballSpeedY;
}

function updateGame() {
    // Clear paddle canvas for drawing paddles
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw a semi-transparent rectangle on the background canvas to create the trail effect
    backgroundCtx.fillStyle = "rgba(0, 0, 0, .39)";
    backgroundCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw the dashed line after clearing the background canvas
    drawDashedLine();

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

// Call this function once when initializing the game to draw the dashed line
drawDashedLine();

// Start the game
updateGame();
