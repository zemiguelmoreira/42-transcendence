console.log('snake.js carregado');

// Função para inicializar o jogo
function initializeSnakeGame() {
    // Certifique-se de que a variável do canvas é sempre inicializada corretamente
    const canvas = document.querySelector("canvas");
    if (!canvas) {
        console.error("Canvas não encontrado!");
        return;
    }
    const ctx = canvas.getContext("2d");
    const score1 = document.querySelector(".snake-score1--value");
    const score2 = document.querySelector(".snake-score2--value");
    const finalScore = document.querySelector(".final-score > span");
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const audio = new Audio("./assets/audio.mp3");
    const size = 20;
    const initialPosition1 = { x: size * 3, y: size * 3 };
    const initialPosition2 = { x: canvasWidth - (size * 4), y: canvasHeight - (size * 4) };

    let player1Name = document.querySelector(".snake-ply1");
    let player2Name = document.querySelector(".snake-ply2");
    let isGameRunning = true;
    let snake1 = [initialPosition1];
    let snake2 = [initialPosition2];
    let gameSpeed = 200;
    let direction1, direction2, loopId;

    player1Name.textContent = "Ivo";
    player2Name.textContent = "Daniel";

    // Funções do jogo
    const incrementScore = (scoreElement) => {
        scoreElement.innerText = +scoreElement.innerText + 10;
    };

    const randomNumber = (min, max) => {
        return Math.round(Math.random() * (max - min) + min);
    };

    const randomPositionX = () => {
        const number = randomNumber(0, canvas.width - size);
        return Math.round(number / size) * size;
    };

    const randomPositionY = () => {
        const number = randomNumber(0, canvas.height - size);
        return Math.round(number / size) * size;
    };

    const randomColor = () => {
        const red = randomNumber(0, 255);
        const green = randomNumber(0, 255);
        const blue = randomNumber(0, 255);
        return `rgb(${red}, ${green}, ${blue})`;
    };

    const food = {
        x: randomPositionX(),
        y: randomPositionY(),
        color: randomColor()
    };

    const drawFood = () => {
        const { x, y, color } = food;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        ctx.shadowBlur = 0;
    };

    const drawSnake = (snake, color) => {
        snake.forEach((position, index) => {
            const alpha = 0.5 + (index / snake.length) * 0.5;
            ctx.globalAlpha = alpha;

            ctx.fillStyle = (index === snake.length - 1) ? color : color;

            ctx.fillRect(position.x, position.y, size, size);
        });

        ctx.globalAlpha = 1;
    };

    const moveSnake = (snake, direction) => {
        if (!direction) return;

        const head = snake[snake.length - 1];

        if (direction === "right") {
            snake.push({ x: head.x + size, y: head.y });
        } else if (direction === "left") {
            snake.push({ x: head.x - size, y: head.y });
        } else if (direction === "down") {
            snake.push({ x: head.x, y: head.y + size });
        } else if (direction === "up") {
            snake.push({ x: head.x, y: head.y - size });
        }

        snake.shift();
    };

    const drawGrid = () => {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        for (let i = size; i < canvas.width; i += size) {
            ctx.beginPath();
            ctx.lineTo(i, 0);
            ctx.lineTo(i, canvasHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineTo(0, i);
            ctx.lineTo(canvasWidth, i);
            ctx.stroke();
        }
    };

    const checkEat = (snake, scoreElement) => {
        const head = snake[snake.length - 1];

        if (head.x === food.x && head.y === food.y) {
            incrementScore(scoreElement);
            gameSpeed -= 5;
            snake.push(head);
            audio.play();

            let x = randomPositionX();
            let y = randomPositionY();

            while (snake.find((position) => position.x === x && position.y === y) ||
                snake1.find((position) => position.x === x && position.y === y) ||
                snake2.find((position) => position.x === x && position.y === y)) {
                x = randomPositionX();
                y = randomPositionY();
            }
            food.x = x;
            food.y = y;
            food.color = randomColor();
        }
    };

    const checkCollision = (snake, player) => {
        const head = snake[snake.length - 1];
        const canvasLimitX = canvas.width - size;
        const canvasLimitY = canvas.height - size;
        const neckIndex = snake.length - 2;

        const wallCollision = head.x < 0 || head.x > canvasLimitX || head.y < 0 || head.y > canvasLimitY;
        const selfCollision = snake.find((position, index) => {
            return index < neckIndex && position.x === head.x && position.y === head.y;
        });
        if (wallCollision || selfCollision) {
            gameOver(player);
        }
    };

    const checkCollisionWithOtherSnake = (snake1, snake2) => {
        const head1 = snake1[snake1.length - 1];
        const head2 = snake2[snake2.length - 1];

        const collision1 = snake2.find(position => position.x === head1.x && position.y === head1.y);
        const collision2 = snake1.find(position => position.x === head2.x && position.y === head2.y);

        if (collision1) {
            gameOver(1);
        }
        if (collision2) {
            gameOver(2);
        }
    };

    const gameOver = (collidedPlayer) => {
        const player1Score = parseInt(score1.innerText);
        const player2Score = parseInt(score2.innerText);

        let winner, loser, winnerScore;

        isGameRunning = false;
        direction1 = undefined;
        direction2 = undefined;
        gameSpeed = 200;

        if (collidedPlayer === 1) {
            winner = player2Name.textContent;
            loser = player1Name.textContent;
            winnerScore = player2Score;
        } else if (collidedPlayer === 2) {
            winner = player1Name.textContent;
            loser = player2Name.textContent;
            winnerScore = player1Score;
        }

        finalScore.innerText = `${winner} wins with ${winnerScore} points`;

        const gameData = {
            winner: winner,
            loser: loser,
            winnerScore: winnerScore,
            dateTime: new Date().toLocaleString()
        };

        saveGameData(gameData);
    };

    // Tempo mínimo em milissegundos entre mudanças de direção
    const keyDelay = 1000; // Ajuste esse valor conforme necessário
    console.log(keyDelay)

    // Armazena o último tempo em que cada tecla foi pressionada
    const lastKeyPressWASD = {
        'w': 0,
        'a': 0,
        's': 0,
        'd': 0
    };

    const lastKeyPressArrows = {
        'ArrowUp': 0,
        'ArrowDown': 0,
        'ArrowLeft': 0,
        'ArrowRight': 0
    };

    // Manipulador de eventos keydown
    document.addEventListener("keydown", ({ key }) => {
        const now = Date.now();

        // Verifica o tempo decorrido desde a última pressão para as teclas WASD
        if (lastKeyPressWASD.hasOwnProperty(key) && now - lastKeyPressWASD[key] < keyDelay) {
            return;
        }
        // Verifica o tempo decorrido desde a última pressão para as teclas de seta
        if (lastKeyPressArrows.hasOwnProperty(key) && now - lastKeyPressArrows[key] < keyDelay) {
            return;
        }

        // Atualiza o tempo da última pressão da tecla
        if (lastKeyPressWASD.hasOwnProperty(key)) {
            lastKeyPressWASD[key] = now;
        }
        if (lastKeyPressArrows.hasOwnProperty(key)) {
            lastKeyPressArrows[key] = now;
        }

        // Player 1 controls (WASD)
        if (key === "d" && direction1 !== "left") direction1 = "right";
        if (key === "a" && direction1 !== "right") direction1 = "left";
        if (key === "s" && direction1 !== "up") direction1 = "down";
        if (key === "w" && direction1 !== "down") direction1 = "up";

        // Player 2 controls (setas)
        if (key === "ArrowRight" && direction2 !== "left") direction2 = "right";
        if (key === "ArrowLeft" && direction2 !== "right") direction2 = "left";
        if (key === "ArrowDown" && direction2 !== "up") direction2 = "down";
        if (key === "ArrowUp" && direction2 !== "down") direction2 = "up";
    });

    const saveGameData = (data) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gameData.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const gameLoop = () => {
        if (!isGameRunning) return;

        clearInterval(loopId);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGrid();
        drawFood();
        moveSnake(snake1, direction1);
        moveSnake(snake2, direction2);
        drawSnake(snake1, "red");
        drawSnake(snake2, "blue");
        checkEat(snake1, score1);
        checkEat(snake2, score2);
        checkCollision(snake1, 1);
        checkCollision(snake2, 2);
        checkCollisionWithOtherSnake(snake1, snake2);

        loopId = setTimeout(() => {
            gameLoop();
        }, gameSpeed);
    };

    // Inicia o jogo automaticamente
    gameLoop();
}

// Certifique-se de que o código de inicialização seja executado quando o script for carregado
if (document.readyState === 'complete') {
    initializeSnakeGame();
} else {
    window.addEventListener('load', initializeSnakeGame);
}


// console.log('snake.js carregado');

// const canvas = document.querySelector("canvas");
// const ctx = canvas.getContext("2d");
// const score1 = document.querySelector(".snake-score1--value");
// const score2 = document.querySelector(".snake-score2--value");
// const finalScore = document.querySelector(".final-score > span");
// const canvasWidth = canvas.width;
// const canvasHeight = canvas.height;
// const audio = new Audio("./assets/audio.mp3");
// const size = 20;
// const initialPosition1 = { x: size * 3, y: size * 3 };
// const initialPosition2 = { x: canvasWidth - (size * 4), y: canvasHeight - (size * 4) };

// let player1Name = document.querySelector(".snake-ply1");
// let player2Name = document.querySelector(".snake-ply2");
// let isGameRunning = true;
// let snake1 = [initialPosition1];
// let snake2 = [initialPosition2];
// let gameSpeed = 200;
// let direction1, direction2, loopId;

// player1Name.textContent = "Ivo";
// player2Name.textContent = "Daniel";


// const incrementScore = (scoreElement) => {
//     scoreElement.innerText = +scoreElement.innerText + 10;
// };

// const randomNumber = (min, max) => {
//     return Math.round(Math.random() * (max - min) + min);
// };

// const randomPositionX = () => {
//     const number = randomNumber(0, canvas.width - size);
//     return Math.round(number / size) * size;
// };

// const randomPositionY = () => {
//     const number = randomNumber(0, canvas.height - size);
//     return Math.round(number / size) * size;
// };

// const randomColor = () => {
//     const red = randomNumber(0, 255);
//     const green = randomNumber(0, 255);
//     const blue = randomNumber(0, 255);
//     return `rgb(${red}, ${green}, ${blue})`;
// };

// const food = {
//     x: randomPositionX(),
//     y: randomPositionY(),
//     color: randomColor()
// };

// const drawFood = () => {
//     const { x, y, color } = food;
//     ctx.shadowColor = color;
//     ctx.shadowBlur = 6;
//     ctx.fillStyle = color;
//     ctx.fillRect(x, y, size, size);
//     ctx.shadowBlur = 0;
// };

// const drawSnake = (snake, color) => {
//     snake.forEach((position, index) => {
//         const alpha = 0.5 + (index / snake.length) * 0.5;
//         ctx.globalAlpha = alpha;

//         ctx.fillStyle = (index === snake.length - 1) ? color : color;

//         ctx.fillRect(position.x, position.y, size, size);
//     });

//     ctx.globalAlpha = 1;
// };

// const moveSnake = (snake, direction) => {
//     if (!direction) return;

//     const head = snake[snake.length - 1];

//     if (direction === "right") {
//         snake.push({ x: head.x + size, y: head.y });
//     } else if (direction === "left") {
//         snake.push({ x: head.x - size, y: head.y });
//     } else if (direction === "down") {
//         snake.push({ x: head.x, y: head.y + size });
//     } else if (direction === "up") {
//         snake.push({ x: head.x, y: head.y - size });
//     }

//     snake.shift();
// };

// const drawGrid = () => {
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "black";

//     for (let i = size; i < canvas.width; i += size) {
//         ctx.beginPath();
//         ctx.lineTo(i, 0);
//         ctx.lineTo(i, canvasHeight);
//         ctx.stroke();

//         ctx.beginPath();
//         ctx.lineTo(0, i);
//         ctx.lineTo(canvasWidth, i);
//         ctx.stroke();
//     }
// };

// const checkEat = (snake, scoreElement) => {
//     const head = snake[snake.length - 1];

//     if (head.x === food.x && head.y === food.y) {
//         incrementScore(scoreElement);
//         gameSpeed -= 5;
//         snake.push(head);
//         audio.play();

//         let x = randomPositionX();
//         let y = randomPositionY();

//         while (snake.find((position) => position.x === x && position.y === y) ||
//             snake1.find((position) => position.x === x && position.y === y) ||
//             snake2.find((position) => position.x === x && position.y === y)) {
//             x = randomPositionX();
//             y = randomPositionY();
//         }
//         food.x = x;
//         food.y = y;
//         food.color = randomColor();
//     }
// };

// const checkCollision = (snake, player) => {
//     const head = snake[snake.length - 1];
//     const canvasLimitX = canvas.width - size;
//     const canvasLimitY = canvas.height - size;
//     const neckIndex = snake.length - 2;

//     const wallCollision = head.x < 0 || head.x > canvasLimitX || head.y < 0 || head.y > canvasLimitY;
//     const selfCollision = snake.find((position, index) => {
//         return index < neckIndex && position.x === head.x && position.y === head.y;
//     });
//     if (wallCollision || selfCollision) {
//         gameOver(player);
//     }
// };

// const checkCollisionWithOtherSnake = (snake1, snake2) => {
//     const head1 = snake1[snake1.length - 1];
//     const head2 = snake2[snake2.length - 1];

//     const collision1 = snake2.find(position => position.x === head1.x && position.y === head1.y);
//     const collision2 = snake1.find(position => position.x === head2.x && position.y === head2.y);

//     if (collision1) {
//         gameOver(1);
//     }
//     if (collision2) {
//         gameOver(2);
//     }
// };

// const gameOver = (collidedPlayer) => {
//     const player1Score = parseInt(score1.innerText);
//     const player2Score = parseInt(score2.innerText);
    
//     let winner, loser, winnerScore;

//     isGameRunning = false;
//     direction1 = undefined;
//     direction2 = undefined;
//     gameSpeed = 200;

//     if (collidedPlayer === 1) {
//         winner = player2Name.textContent;
//         loser = player1Name.textContent;
//         winnerScore = player2Score;
//     } else if (collidedPlayer === 2) {
//         winner = player1Name.textContent;
//         loser = player2Name.textContent;
//         winnerScore = player1Score;
//     }

//     finalScore.innerText = `${winner} wins with ${winnerScore} points`;

//     const gameData = {
//         winner: winner,
//         loser: loser,
//         winnerScore: winnerScore,
//         dateTime: new Date().toLocaleString()
//     };

//     saveGameData(gameData);
// };

// // Tempo mínimo em milissegundos entre mudanças de direção
// const keyDelay = 500; // Ajuste esse valor conforme necessário

// // Armazena o último tempo em que cada tecla foi pressionada
// const lastKeyPressWASD = {
//     'w': 0,
//     'a': 0,
//     's': 0,
//     'd': 0
// };

// const lastKeyPressArrows = {
//     'ArrowUp': 0,
//     'ArrowDown': 0,
//     'ArrowLeft': 0,
//     'ArrowRight': 0
// };

// // Manipulador de eventos keydown
// document.addEventListener("keydown", ({ key }) => {
//     const now = Date.now();

//     // Verifica o tempo decorrido desde a última pressão para as teclas WASD
//     if (lastKeyPressWASD.hasOwnProperty(key) && now - lastKeyPressWASD[key] < keyDelay) {
//         return;
//     }
//     // Verifica o tempo decorrido desde a última pressão para as teclas de seta
//     if (lastKeyPressArrows.hasOwnProperty(key) && now - lastKeyPressArrows[key] < keyDelay) {
//         return;
//     }

//     // Atualiza o tempo da última pressão da tecla
//     if (lastKeyPressWASD.hasOwnProperty(key)) {
//         lastKeyPressWASD[key] = now;
//     }
//     if (lastKeyPressArrows.hasOwnProperty(key)) {
//         lastKeyPressArrows[key] = now;
//     }

//     // Player 1 controls (WASD)
//     if (key === "d" && direction1 !== "left") direction1 = "right";
//     if (key === "a" && direction1 !== "right") direction1 = "left";
//     if (key === "s" && direction1 !== "up") direction1 = "down";
//     if (key === "w" && direction1 !== "down") direction1 = "up";

//     // Player 2 controls (setas)
//     if (key === "ArrowRight" && direction2 !== "left") direction2 = "right";
//     if (key === "ArrowLeft" && direction2 !== "right") direction2 = "left";
//     if (key === "ArrowDown" && direction2 !== "up") direction2 = "down";
//     if (key === "ArrowUp" && direction2 !== "down") direction2 = "up";
// });


// const saveGameData = (data) => {
//     const jsonString = JSON.stringify(data, null, 2);
//     const blob = new Blob([jsonString], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "gameData.json";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
// };

// const gameLoop = () => {
//     if (!isGameRunning) return;

//     clearInterval(loopId);
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//     drawGrid();
//     drawFood();
//     moveSnake(snake1, direction1);
//     moveSnake(snake2, direction2);
//     drawSnake(snake1, "red");
//     drawSnake(snake2, "blue");
//     checkEat(snake1, score1);
//     checkEat(snake2, score2);
//     checkCollision(snake1, 1);
//     checkCollision(snake2, 2);
//     checkCollisionWithOtherSnake(snake1, snake2);

//     loopId = setTimeout(() => {
//         gameLoop();
//     }, gameSpeed);
// };

// // Inicia o jogo automaticamente
// gameLoop();
