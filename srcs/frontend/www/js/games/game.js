    // Verifica se o canvas foi carregado corretamente
    const canvas = document.getElementById('gameCanvasSnakeFreeForAll');
    if (!canvas) {
        console.error("Canvas not found!");
    }

    const ctx = canvas.getContext('2d');

    // Continuação do código do jogo...
    const gridSize = 20;
    const cols = canvas.width / gridSize;
    const rows = canvas.height / gridSize;

    // Configuração inicial das cobrinhas
    const snakes = [
        { color: '#0000FF', segments: [{ x: 5, y: 10 }, { x: 4, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true },
        { color: '#00FF00', segments: [{ x: 10, y: 5 }, { x: 10, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true },
        { color: '#FFFF00', segments: [{ x: 15, y: 10 }, { x: 14, y: 10 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true },
        { color: '#FF0000', segments: [{ x: 20, y: 5 }, { x: 20, y: 6 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true }
    ];

    // Continue com a configuração do jogo aqui...
    // Controla a velocidade do jogo (menor valor = mais rápido)
    let gameSpeed = 150; // Em milissegundos

	// Função para desenhar a grelha
	function drawGrid() {
		ctx.strokeStyle = 'black'; // Cor das linhas da grelha
		ctx.lineWidth = 0.5; // Espessura das linhas

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
        for (const otherSnake of snakes) {
            if (otherSnake !== snake && otherSnake.alive) {
                for (const segment of otherSnake.segments) {
                    if (head.x === segment.x && head.y === segment.y) {
                        snake.alive = false;
                        return;
                    }
                }
            }
        }
    
        // Verifica se a cabeça da cobrinha colidiu com a comida
        if (head.x === food.x && head.y === food.y) {
            snake.segments.unshift(head); // Adiciona o novo segmento na frente
            food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; // Gera nova comida
            foodColor = randomColor(); // Atualiza a cor da comida
        } else {
            // Move a cobrinha: adiciona o novo segmento na frente e remove o último
            snake.segments.unshift(head);
            snake.segments.pop();
        }
    }
    
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

		drawGrid(); // Desenha a grelha antes de desenhar outros elementos
	
        snakes.forEach(snake => {
            moveSnake(snake);
            if (snake.alive) {
                drawSnake(snake);
            }
        });
    
        drawFood(); // Desenha a comida
    
        // Verifica se há apenas uma cobrinha viva
        const aliveSnakes = snakes.filter(snake => snake.alive);
        if (aliveSnakes.length === 1) {
            clearInterval(gameInterval);
            alert(`Game Over! The winner is the ${aliveSnakes[0].color} snake.`);
        }
    }
    
    // Inicializa o loop do jogo com base na velocidade definida
    const gameInterval = setInterval(update, gameSpeed);