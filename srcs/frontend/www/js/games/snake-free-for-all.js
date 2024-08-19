console.log("Snake game script loaded!");

let activeSnakes = 4;

function initializeSnakeGameFreeForAll() {
	console.log("ENTROU NO SNAKE GAME FREE FOR ALL");

	const canvas = document.querySelector("canvas");
	if (!canvas) {
		console.error("Canvas não encontrado!");
		return;
	}
	const ctx = canvas.getContext("2d");
	const score1 = document.querySelector(".snake-score1--value");
	const score2 = document.querySelector(".snake-score2--value");
	const score3 = document.querySelector(".snake-score3--value");
	const score4 = document.querySelector(".snake-score4--value");
	console.log(score1, score2, score3, score4);

	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;
	const audio = new Audio("../../assets/audio.mp3");
	const size = 20;

	// Posições iniciais para as 4 cobras
	const initialPosition1 = { x: size * 3, y: size * 3 };
	const initialPosition2 = { x: canvasWidth - (size * 4), y: canvasHeight - (size * 4) };
	const initialPosition3 = { x: size * 3, y: canvasHeight - (size * 4) };
	const initialPosition4 = { x: canvasWidth - (size * 4), y: size * 3 };

	let player1Name = document.querySelector(".snake-ply1");
	let player2Name = document.querySelector(".snake-ply2");
	let player3Name = document.querySelector(".snake-ply3");
	let player4Name = document.querySelector(".snake-ply4");
	console.log(player1Name, player2Name, player3Name, player4Name);

	let isGameRunning = true;
	let snake1 = [initialPosition1];
	let snake2 = [initialPosition2];
	let snake3 = [initialPosition3];
	let snake4 = [initialPosition4];
	let gameSpeed = 200;

	// Direções iniciais para cada cobra (em direção ao centro horizontalmente)
	let direction1 = "right", direction2 = "left", direction3 = "right", direction4 = "left";
	let nextDirection1, nextDirection2, nextDirection3, nextDirection4, loopId;

	player1Name.textContent = "Ivo";
	player2Name.textContent = "Daniel";
	player3Name.textContent = "Carlos";
	player4Name.textContent = "Ana";

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
			ctx.fillStyle = color;
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
				snake2.find((position) => position.x === x && position.y === y) ||
				snake3.find((position) => position.x === x && position.y === y) ||
				snake4.find((position) => position.x === x && position.y === y)) {
				x = randomPositionX();
				y = randomPositionY();
			}
			food.x = x;
			food.y = y;
			food.color = randomColor();
		}
	};

	// Atualize a função checkCollision para desativar uma cobra ao colidir
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

	// Atualize a função checkCollisionWithOtherSnake para considerar que uma cobra pode estar desativada
	const checkCollisionWithOtherSnake = (snake1, snake2, player1, player2) => {
		if (snake1.length === 0 || snake2.length === 0) return; // Cobra desativada não pode colidir

		const head1 = snake1[snake1.length - 1];
		const head2 = snake2[snake2.length - 1];

		const collision1 = snake2.find(position => position.x === head1.x && position.y === head1.y);
		const collision2 = snake1.find(position => position.x === head2.x && position.y === head2.y);

		if (collision1) gameOver(player1);
		if (collision2) gameOver(player2);
	};

	const gameOver = (collidedPlayer) => {
		if (collidedPlayer === 1) {
			snake1 = [];
			direction1 = undefined;
		} else if (collidedPlayer === 2) {
			snake2 = [];
			direction2 = undefined;
		} else if (collidedPlayer === 3) {
			snake3 = [];
			direction3 = undefined;
		} else if (collidedPlayer === 4) {
			snake4 = [];
			direction4 = undefined;
		}
		activeSnakes--;
	
		// Verifica se apenas uma cobra resta viva
		if (activeSnakes === 1) {
			// Identifica a cobra sobrevivente
			let winner = snake1.length > 0 ? 1 : snake2.length > 0 ? 2 : snake3.length > 0 ? 3 : 4;
			setTimeout(() => alert(`Jogador ${winner} venceu!`), 100);
			clearInterval(loopId);
		}
	};

	const gameLoop = () => {
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		drawGrid();
		drawFood();

		if (isGameRunning) {
			if (direction1) moveSnake(snake1, direction1);
			if (direction2) moveSnake(snake2, direction2);
			if (direction3) moveSnake(snake3, direction3);
			if (direction4) moveSnake(snake4, direction4);

			if (direction1) checkCollision(snake1, 1);
			if (direction2) checkCollision(snake2, 2);
			if (direction3) checkCollision(snake3, 3);
			if (direction4) checkCollision(snake4, 4);

			checkCollisionWithOtherSnake(snake1, snake2, 1, 2);
			checkCollisionWithOtherSnake(snake1, snake3, 1, 3);
			checkCollisionWithOtherSnake(snake1, snake4, 1, 4);
			checkCollisionWithOtherSnake(snake2, snake3, 2, 3);
			checkCollisionWithOtherSnake(snake2, snake4, 2, 4);
			checkCollisionWithOtherSnake(snake3, snake4, 3, 4);

			checkEat(snake1, score1);
			checkEat(snake2, score2);
			checkEat(snake3, score3);
			checkEat(snake4, score4);

			drawSnake(snake1, "red");
			drawSnake(snake2, "blue");
			drawSnake(snake3, "green");
			drawSnake(snake4, "yellow");
		}
	};

	document.addEventListener("keydown", (event) => {
		const keyPressed = event.key;

		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyPressed)) {
			event.preventDefault();
		}

		switch (keyPressed) {
			case "ArrowUp":
				if (direction1 !== "down") nextDirection1 = "up";
				break;
			case "ArrowDown":
				if (direction1 !== "up") nextDirection1 = "down";
				break;
			case "ArrowLeft":
				if (direction1 !== "right") nextDirection1 = "left";
				break;
			case "ArrowRight":
				if (direction1 !== "left") nextDirection1 = "right";
				break;

			case "w":
				if (direction2 !== "down") nextDirection2 = "up";
				break;
			case "s":
				if (direction2 !== "up") nextDirection2 = "down";
				break;
			case "a":
				if (direction2 !== "right") nextDirection2 = "left";
				break;
			case "d":
				if (direction2 !== "left") nextDirection2 = "right";
				break;

			case "i":
				if (direction3 !== "down") nextDirection3 = "up";
				break;
			case "k":
				if (direction3 !== "up") nextDirection3 = "down";
				break;
			case "j":
				if (direction3 !== "right") nextDirection3 = "left";
				break;
			case "l":
				if (direction3 !== "left") nextDirection3 = "right";
				break;

			case "t":
				if (direction4 !== "down") nextDirection4 = "up";
				break;
			case "g":
				if (direction4 !== "up") nextDirection4 = "down";
				break;
			case "f":
				if (direction4 !== "right") nextDirection4 = "left";
				break;
			case "h":
				if (direction4 !== "left") nextDirection4 = "right";
				break;
		}
	});

	loopId = setInterval(() => {
		if (nextDirection1) direction1 = nextDirection1;
		if (nextDirection2) direction2 = nextDirection2;
		if (nextDirection3) direction3 = nextDirection3;
		if (nextDirection4) direction4 = nextDirection4;

		gameLoop();
	}, gameSpeed);
}

initializeSnakeGameFreeForAll();
