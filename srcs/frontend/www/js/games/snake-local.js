import { navigateTo } from '../app.js';
import { displaySlidingMessage } from '../utils/utils1.js';

function initializeSnakeGameLocal(username, guest, dataUsername) {

	const canvas = document.getElementById('gameCanvasSnakeLocal');
	if (!canvas) {
		console.error("Canvas not found!");
		return;
	}

	const ctx = canvas.getContext('2d');
	const gridSize = 20;
	const cols = canvas.width / gridSize;
	const rows = canvas.height / gridSize;
	const snakes = [
		{ color: '#0000FF', segments: [{ x: 5, y: 10 }, { x: 4, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: dataUsername.profile.alias_name },
		{ color: '#00FF00', segments: [{ x: 10, y: 5 }, { x: 10, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: guest },
	];

	let gameSpeed = 100;
	let snakeScore1 = 0;
	let snakeScore2 = 0;

	function drawGrid() {
		ctx.strokeStyle = '#345678';
		ctx.lineWidth = 1;
		for (let x = 0; x <= canvas.width; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= canvas.height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}
	}

	const controls = {
		'#0000FF': { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
		'#00FF00': { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
		'#FFFF00': { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' },
		'#FF0000': { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6' }
	};

	const keyMap = {
		'KeyW': 'UP', 'KeyS': 'DOWN', 'KeyA': 'LEFT', 'KeyD': 'RIGHT',
		'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
		'KeyI': 'UP', 'KeyK': 'DOWN', 'KeyJ': 'LEFT', 'KeyL': 'RIGHT',
		'Numpad8': 'UP', 'Numpad5': 'DOWN', 'Numpad4': 'LEFT', 'Numpad6': 'RIGHT'
	};

	const randomColor = () => {
		let red, green, blue;
		do {
			red = Math.floor(Math.random() * 256);
			green = Math.floor(Math.random() * 256);
			blue = Math.floor(Math.random() * 256);
		} while (red < 100 && green < 100 && blue < 100);
		return `rgb(${red}, ${green}, ${blue})`;
	};

	let food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
	let foodColor = randomColor();

	document.addEventListener('keydown', (event) => {
		const key = event.code;
		snakes.forEach(snake => {
			const controlsForSnake = controls[snake.color];
			if (controlsForSnake) {
				for (const [direction, controlKey] of Object.entries(controlsForSnake)) {
					if (key === controlKey) {
						const newDirection = keyMap[key];
						if (newDirection && isValidDirection(snake, newDirection)) {
							snake.newDirection = newDirection;
						}
						break;
					}
				}
			}
		});
	});

	function isValidDirection(snake, newDirection) {
		const oppositeDirections = {
			'UP': 'DOWN',
			'DOWN': 'UP',
			'LEFT': 'RIGHT',
			'RIGHT': 'LEFT'
		};
		return oppositeDirections[newDirection] !== snake.direction;
	}

	function drawFood() {
		ctx.fillStyle = foodColor;
		ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
	}

	function drawSnake(snake) {
		const segmentCount = snake.segments.length;

		for (let i = 0; i < segmentCount; i++) {
			const segment = snake.segments[i];
			const alpha = 1 - (i / (segmentCount - 1)) * 0.5;
			const color = snake.color;

			ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`;
			ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
		}
	}

	function hexToRgb(hex) {
		let r = 0, g = 0, b = 0;

		if (hex.length === 4) {
			r = parseInt(hex[1] + hex[1], 16);
			g = parseInt(hex[2] + hex[2], 16);
			b = parseInt(hex[3] + hex[3], 16);
		}
		else if (hex.length === 7) {
			r = parseInt(hex[1] + hex[2], 16);
			g = parseInt(hex[3] + hex[4], 16);
			b = parseInt(hex[5] + hex[6], 16);
		}

		return `${r},${g},${b}`;
	}

	function checkCollision(head, snake) {
		for (let i = 1; i < snake.segments.length; i++) {
			if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
				return true;
			}
		}
		return false;
	}

	function moveSnake(snake) {
		snake.direction = snake.newDirection;
		const head = { ...snake.segments[0] };

		switch (snake.direction) {
			case 'RIGHT':
				head.x += 1;
				break;
			case 'LEFT':
				head.x -= 1;
				break;
			case 'UP':
				head.y -= 1;
				break;
			case 'DOWN':
				head.y += 1;
				break;
		}

		if (head.x < 0) head.x = cols - 1;
		if (head.x >= cols) head.x = 0;
		if (head.y < 0) head.y = rows - 1;
		if (head.y >= rows) head.y = 0;

		if (checkCollision(head, snake)) {
			snake.alive = false;
			return;
		}

		for (const otherSnake of snakes) {
			if (otherSnake !== snake && otherSnake.alive) {
				const otherHead = otherSnake.segments[0];

				if (head.x === otherHead.x && head.y === otherHead.y) {
					if (snake.segments.length > otherSnake.segments.length) {
						otherSnake.alive = false;
					} else if (snake.segments.length < otherSnake.segments.length) {
						snake.alive = false;
					} else {
						const randomDeath = Math.random() < 0.5;
						if (randomDeath) {
							snake.alive = false;
						} else {
							otherSnake.alive = false;
						}
					}
					return;
				}

				for (const segment of otherSnake.segments) {
					if (head.x === segment.x && head.y === segment.y) {
						snake.alive = false;
					}
				}
			}
		}

		if (head.x === food.x && head.y === food.y) {
			snake.segments.unshift(head);
			food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
			foodColor = randomColor();
			if (snake.name === username) {
				snakeScore1 = snake.segments.length - 2;
				document.getElementById('snakeScore1').innerText = snakeScore1;
			} else {
				snakeScore2 = snake.segments.length - 2;
				document.getElementById('snakeScore2').innerText = snakeScore2;
			}
		} else {
			snake.segments.unshift(head);
			snake.segments.pop();
		}
	}

	function update() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (window.location.pathname !== `/user/${username}/snake-game-local`) {
			document.getElementById('runSnake').remove();
			clearInterval(gameInterval);
			return;
		}

		drawGrid();

		snakes.forEach(snake => {
			if (snake.alive)
				moveSnake(snake);
			if (snake.alive)
				drawSnake(snake);
		});

		const aliveSnakes = snakes.filter(snake => snake.alive);
		if (aliveSnakes.length === 1) {
			clearInterval(gameInterval);
			endGame(aliveSnakes[0].name);
		}

		drawFood();
	}

	async function endGame(snake_winner) {
		let winner, loser, winnerScore, loserScore;
		
		try {
			winner = snake_winner;

			if (winner === username) {
				loser = guest;
				winnerScore = snakeScore1;
				loserScore = snakeScore2;
			} else {
				loser = username;
				winnerScore = snakeScore2;
				loserScore = snakeScore1;
			}

			const gameType = 'snake';
			const timestamp = new Date().toISOString();

			const pong_accessToken = localStorage.getItem('access_token');
			const response = await fetch('/api/profile/update_match_history/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${pong_accessToken}`,
				},
				body: JSON.stringify({
					game_type: gameType,
					winner: winner,
					loser: loser,
					winner_score: winnerScore,
					loser_score: loserScore,
					timestamp: timestamp,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				console.log('Error:', data.error || 'Failed to update match history');
			}

		} catch (error) {
			console.error('Error during match history update:', error.message);
		}

		setTimeout(() => {
			showEndScreen(snake_winner);
		}, 1000)
	}

	function showEndScreen(winnerName) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		const totalHeight = canvas.height * 0.7;
		const partHeight = totalHeight / 4;
		const startY = (canvas.height - totalHeight) / 2;
		ctx.textAlign = "center";
		ctx.fillStyle = "#fff";
		ctx.font = "50px CustomFont";
		ctx.fillText("WINNER", canvas.width / 2, startY + partHeight);
		ctx.fillStyle = "red";
		ctx.fillText("WINNER", canvas.width / 2 + 4, startY + partHeight + 4);
		ctx.fillStyle = "#fff";
		ctx.font = "40px CustomFont";
		ctx.fillText(`${winnerName}`, canvas.width / 2, startY + partHeight + 60);
		setTimeout(() => {
			const closeGame = document.getElementById('runSnake');
			if (closeGame) {
				closeGame.remove();
				displaySlidingMessage('Cool game right? What about another match?');
				navigateTo(`/user/${username}/snake`);
			}
		}, 3000);
	}
	const gameInterval = setInterval(update, gameSpeed);
}

export { initializeSnakeGameLocal };