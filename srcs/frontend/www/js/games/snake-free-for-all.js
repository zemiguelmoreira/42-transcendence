import { navigateTo } from '../app.js';

function initializeSnakeGameFreeForAll(username, guest1, guest2, guest3) {
    const canvas = document.getElementById('gameCanvasSnakeFreeForAll');
    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const cols = canvas.width / gridSize;
    const rows = canvas.height / gridSize;
    const snakes = [
        { color: '#0000FF', segments: [{ x: 5, y: 10 }, { x: 4, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: username },
        { color: '#00FF00', segments: [{ x: 10, y: 5 }, { x: 10, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: guest1 },
        { color: '#FFFF00', segments: [{ x: 15, y: 10 }, { x: 14, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: guest2 },
        { color: '#FF0000', segments: [{ x: 20, y: 5 }, { x: 20, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true, name: guest3 }
    ];

    let gameSpeed = 150;
	let snakeScore1 = 0;
	let snakeScore2 = 0;
	let snakeScore3 = 0;
	let snakeScore4 = 0;

	function drawGrid() {
		ctx.strokeStyle = 'black'; // Cor das linhas da grelha
		ctx.lineWidth = 0.5; // Espessura das linhas
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
    
    // Mapeia teclas para direções
    const keyMap = {
        'KeyW': 'UP', 'KeyS': 'DOWN', 'KeyA': 'LEFT', 'KeyD': 'RIGHT',
        'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
        'KeyI': 'UP', 'KeyK': 'DOWN', 'KeyJ': 'LEFT', 'KeyL': 'RIGHT',
        'Numpad8': 'UP', 'Numpad5': 'DOWN', 'Numpad4': 'LEFT', 'Numpad6': 'RIGHT'
    };
    
    // Função para gerar uma cor aleatória
    const randomColor = () => {
        const red = Math.floor(Math.random() * 256); // Gera um valor entre 0 e 255
        const green = Math.floor(Math.random() * 256); // Gera um valor entre 0 e 255
        const blue = Math.floor(Math.random() * 256); // Gera um valor entre 0 e 255
        return `rgb(${red}, ${green}, ${blue})`;
    };
    
    // Variáveis para a comida
    let food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    let foodColor = randomColor(); // Gera a cor inicial da comida
    
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
                            snake.newDirection = newDirection; // Atualiza a nova direção
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
            const alpha = 1 - (i / (segmentCount - 1)) * 0.5; // Calcula o valor alfa baseado na posição do segmento
            const color = snake.color;
    
            ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`; // Ajusta a cor com opacidade
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
        if (!snake.alive) return; // Se a cobrinha está "morta", não a move
    
        // Atualiza a direção da cobrinha se a nova direção for válida
        snake.direction = snake.newDirection;
    
        const head = { ...snake.segments[0] };
    
        // Atualiza a posição do cabeça da cobrinha baseado na direção
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
		// Verifica colisão com outras cobrinhas
		for (const otherSnake of snakes) {
			if (otherSnake !== snake && otherSnake.alive) {
				const otherHead = otherSnake.segments[0];

				// Colisão cabeça com cabeça
				if (head.x === otherHead.x && head.y === otherHead.y) {
					if (snake.segments.length > otherSnake.segments.length) {
						otherSnake.alive = false; // Cobra menor morre
					} else if (snake.segments.length < otherSnake.segments.length) {
						snake.alive = false; // Cobra maior morre
					} else {
						// Ambas cobras têm o mesmo tamanho, decide aleatoriamente quem morre
						const randomDeath = Math.random() < 0.5; // Gera um valor aleatório entre 0 e 1
						if (randomDeath) {
							snake.alive = false; // Cobra atual morre
						} else {
							otherSnake.alive = false; // Outra cobra morre
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
			snake.segments.unshift(head); // Adiciona o novo segmento na frente
			food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; // Gera nova comida
			foodColor = randomColor(); // Atualiza a cor da comida
			if (snake.name === username) {
				snakeScore1 = snake.segments.length - 2;
				document.getElementById('snakeScore1').innerText = snakeScore1;
			} else if (snake.name === guest1) {
				snakeScore2 = snake.segments.length - 2;
				document.getElementById('snakeScore2').innerText = snakeScore2;
			} else if (snake.name === guest2) {
				snakeScore3 = snake.segments.length - 2;
				document.getElementById('snakeScore3').innerText = snakeScore3;
			} else if (snake.name === guest3) {
				snakeScore4 = snake.segments.length - 2;
				document.getElementById('snakeScore4').innerText = snakeScore4;
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
		if (window.location.pathname !== `/user/${username}/snake-game-free-for-all`) {
			console.log('Usuário saiu da página do jogo, interrompendo o loop.');
			document.getElementById('runSnake').remove();
			clearInterval(gameInterval); // Stop the game loop
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
		// Aguarda um segundo antes de exibir a tela de fim de
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

		// Define o estilo do texto
		ctx.fillStyle = "#fff";
		ctx.font = "50px CustomFont";
		ctx.textAlign = "center";

		// Se o nome do vencedor for "No winner", significa que houve empate
		if (winnerName === "No winner") {
			console.log('Game over! No winner.');
			ctx.fillText("DRAW!", canvas.width / 2, canvas.height / 2 + 20);
		} else {
			console.log('Game over! The winner is:', winnerName);
			ctx.fillText(`WINNER: ${winnerName}`, canvas.width / 2, canvas.height / 2 + 20);
		}

		// Após um atraso de 3 segundos, remove o jogo da tela
		setTimeout(() => {
			console.log('Closing the game...');
			const closeGame = document.getElementById('runSnake');
			if (closeGame) {
				closeGame.remove();
				navigateTo(`/user/${username}/snake`);
			}
		}, 3000);
	}
    
    // Inicializa o loop do jogo com base na velocidade definida
    const gameInterval = setInterval(update, gameSpeed);

}

export { initializeSnakeGameFreeForAll }