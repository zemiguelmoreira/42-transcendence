import { navigateTo } from '../app.js';
import { displaySlidingMessage } from '../utils/utils1.js';

function initializeSnakeGameLocal(username, guest) {

	// Verifica se o canvas foi carregado corretamente
	const canvas = document.getElementById('gameCanvasSnakeLocal');
	if (!canvas) {
		console.error("Canvas not found!");
		return;
	}

	const ctx = canvas.getContext('2d');

	// Continuação do código do jogo...
	const gridSize = 20;
	const cols = canvas.width / gridSize;
	const rows = canvas.height / gridSize;

	// Configuração inicial das cobrinhas
	const snakes = [
		{ color: '#0000FF', segments: [{ x: 5, y: 10 }, { x: 4, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: username },
		{ color: '#00FF00', segments: [{ x: 10, y: 5 }, { x: 10, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: guest },
	];

	// Continue com a configuração do jogo aqui...
	// Controla a velocidade do jogo (menor valor = mais rápido)
	let gameSpeed = 100;

	let snakeScore1 = 0;
	let snakeScore2 = 0;

	// Função para desenhar a grelha
	function drawGrid() {
		ctx.strokeStyle = '#345678'; // Cor das linhas da grelha
		ctx.lineWidth = 1; // Espessura das linhas

		// Desenha as linhas verticais
		for (let x = 0; x <= canvas.width; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}

		// Desenha as linhas horizontais
		for (let y = 0; y <= canvas.height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}
	}

	// Mapeia teclas para controle das cobrinhas
	const controls = {
		'#0000FF': { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
		'#00FF00': { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
		'#FFFF00': { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' },
		'#FF0000': { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6' }
	};

	// Mapeia teclas para direções
	const keyMap = {
		'KeyW': 'UP', 'KeyS': 'DOWN', 'KeyA': 'LEFT', 'KeyD': 'RIGHT',
		'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
		'KeyI': 'UP', 'KeyK': 'DOWN', 'KeyJ': 'LEFT', 'KeyL': 'RIGHT',
		'Numpad8': 'UP', 'Numpad5': 'DOWN', 'Numpad4': 'LEFT', 'Numpad6': 'RIGHT'
	};

	// Função para gerar uma cor aleatória
	const randomColor = () => {
		let red, green, blue;
		do {
			red = Math.floor(Math.random() * 256);
			green = Math.floor(Math.random() * 256);
			blue = Math.floor(Math.random() * 256);
		} while (red < 100 && green < 100 && blue < 100);
		return `rgb(${red}, ${green}, ${blue})`;
	};

	// Variáveis para a comida
	let food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
	let foodColor = randomColor();

	// Função para lidar com eventos de tecla pressionada
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
		// Previne que a cobrinha se mova na direção oposta à sua direção atual
		return oppositeDirections[newDirection] !== snake.direction;
	}

	function drawFood() {
		ctx.fillStyle = foodColor; // Usa a cor armazenada
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

	// Função para converter hexadecimal para RGB
	function hexToRgb(hex) {
		let r = 0, g = 0, b = 0;

		// 3 dígitos
		if (hex.length === 4) {
			r = parseInt(hex[1] + hex[1], 16);
			g = parseInt(hex[2] + hex[2], 16);
			b = parseInt(hex[3] + hex[3], 16);
		}
		// 6 dígitos
		else if (hex.length === 7) {
			r = parseInt(hex[1] + hex[2], 16);
			g = parseInt(hex[3] + hex[4], 16);
			b = parseInt(hex[5] + hex[6], 16);
		}

		return `${r},${g},${b}`;
	}

	// Função para checar colisão da cobrinha com ela mesma
	function checkCollision(head, snake) {
		for (let i = 1; i < snake.segments.length; i++) {
			if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
				return true;
			}
		}
		return false;
	}

	function moveSnake(snake) {
		// Atualiza a direção da cobrinha se a nova direção for válida
		snake.direction = snake.newDirection;

		const head = { ...snake.segments[0] };

		// Atualiza a posição da cabeça da cobrinha baseado na direção
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

		// Verifica colisão com as bordas do canvas (sem colisão)
		if (head.x < 0) head.x = cols - 1;
		if (head.x >= cols) head.x = 0;
		if (head.y < 0) head.y = rows - 1;
		if (head.y >= rows) head.y = 0;

		// Verifica colisão com o próprio corpo
		if (checkCollision(head, snake)) {
			snake.alive = false;
			return;
		}

		// Verifica colisão com outras cobrinhas
		for (const otherSnake of snakes) {
			if (otherSnake !== snake && otherSnake.alive) {
				const otherHead = otherSnake.segments[0];

				// Colisão cabeça com cabeça
				if (head.x === otherHead.x && head.y === otherHead.y) {
					if (snake.segments.length > otherSnake.segments.length) {
						otherSnake.alive = false;
					} else if (snake.segments.length < otherSnake.segments.length) {
						snake.alive = false;
					} else {
						// Ambas cobras têm o mesmo tamanho, decide aleatoriamente quem morre
						const randomDeath = Math.random() < 0.5; // Gera um valor aleatório entre 0 e 1
						if (randomDeath) {
							snake.alive = false;
						} else {
							otherSnake.alive = false;
						}
					}
					return;
				}

				// Verifica colisão da cabeça de uma cobra com o corpo da outra
				for (const segment of otherSnake.segments) {
					if (head.x === segment.x && head.y === segment.y) {
						snake.alive = false;
					}
				}
			}
		}

		// Verifica se a cabeça da cobrinha colidiu com a comida
		if (head.x === food.x && head.y === food.y) {
			snake.segments.unshift(head);
			food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; // Gera nova comida
			foodColor = randomColor();
			if (snake.name === username) {
				snakeScore1 = snake.segments.length - 2;
				document.getElementById('snakeScore1').innerText = snakeScore1;
			} else {
				snakeScore2 = snake.segments.length - 2;
				document.getElementById('snakeScore2').innerText = snakeScore2;
			}
		} else {
			// Move a cobrinha: adiciona o novo segmento na frente e remove o último
			snake.segments.unshift(head);
			snake.segments.pop();
		}
	}

	function update() {
		// Limpa o canvas antes de desenhar o próximo frame
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Verifica se o usuário ainda está na página do jogo
		if (window.location.pathname !== `/user/${username}/snake-game-local`) {
			document.getElementById('runSnake').remove();
			clearInterval(gameInterval);
			return;
		}

		// Desenha a grelha
		drawGrid();

		// Atualiza e desenha cada cobrinha
		snakes.forEach(snake => {
			if (snake.alive)
				moveSnake(snake);
			if (snake.alive)
				drawSnake(snake);
		});

		// Verifica se restou apenas uma cobrinha viva ou nenhuma
		const aliveSnakes = snakes.filter(snake => snake.alive);
		if (aliveSnakes.length === 1) {
			clearInterval(gameInterval);
			endGame(aliveSnakes[0].name);
		}

		// Desenha a comida
		drawFood();
	}

	async function endGame(snake_winner) {
		let winner, loser, winnerScore, loserScore;
		
		try {
			// Determina o vencedor e o perdedor
			winner = snake_winner;

			// Define o vencedor e o perdedor com base no nome da cobrinha
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
		// Limpa o canvas antes de desenhar a mensagem de fim de jogo
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Desenha o fundo para a mensagem de fim de jogo
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Ajuste da altura total disponível para o conteúdo
		const totalHeight = canvas.height * 0.7; // Usamos 70% da altura do canvas para os textos
		const partHeight = totalHeight / 4; // Divide essa altura em 4 partes

		// Define a posição de início para centrar os textos verticalmente
		const startY = (canvas.height - totalHeight) / 2; // Centraliza o conteúdo no canvas

		// Texto para "WINNER" na segunda parte do canvas
		ctx.textAlign = "center";
		ctx.fillStyle = "#fff";
		ctx.font = "50px CustomFont";
		ctx.fillText("WINNER", canvas.width / 2, startY + partHeight); // Elevar um pouco mais o texto

		// Desenhar "WINNER" em vermelho deslocado
		ctx.fillStyle = "red";
		ctx.fillText("WINNER", canvas.width / 2 + 4, startY + partHeight + 4);

		// Nome e pontuação do vencedor
		ctx.fillStyle = "#fff"; // Texto em branco
		ctx.font = "40px CustomFont"; // Tamanho do texto para o nome
		ctx.fillText(`${winnerName}`, canvas.width / 2, startY + partHeight + 60); // Ajustar a posição do nome


		// Após um atraso de 3 segundos, remove o jogo da tela
		setTimeout(() => {
			const closeGame = document.getElementById('runSnake');
			if (closeGame) {
				closeGame.remove();
				displaySlidingMessage('Cool game right? What about another match?');
				navigateTo(`/user/${username}/snake`);
			}
		}, 3000);
	}

	// Inicializa o loop do jogo com base na velocidade definida
	const gameInterval = setInterval(update, gameSpeed);
}

export { initializeSnakeGameLocal };