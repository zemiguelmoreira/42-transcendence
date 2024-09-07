async function runPongMatch(player1Name, player2Name, username) {
    
	return new Promise((resolve) => {
		console.log('Tournament Pong - Player1:', player1Name);
		console.log('Tournament Pong - Player2:', player2Name);

		// Get the two canvases and their contexts
		const backgroundCanvas = document.getElementById("pongBackgroundCanvas");
		const backgroundCtx = backgroundCanvas.getContext("2d");

		const canvas = document.getElementById("pongCanvas");
		const ctx = canvas.getContext("2d");

		const canvasWidth = document.getElementById("pongCanvas").width;
		const canvasHeight = document.getElementById("pongCanvas").height;

		const paddleWidth = 10;
		const paddleHeight = 90;
		const ballSize = 10;

		const winningScore = 10;

		let paddleSpeed = 15;
		let ballSpeedX = 6;
		let ballSpeedY = 6;

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


		// Variáveis globais para os sons
		let leftPaddleSound = new Audio('../../files/pong-assets/ping.wav');
		let rightPaddleSound = new Audio('../../files/pong-assets/pong.wav');
		let wallSound = new Audio('../../files/pong-assets/wall.wav');
		let goalSound = new Audio('../../files/pong-assets/goal.wav');

		// let player1Name = username; // Nome do Jogador 1
		// let player2Name = guest; // Nome do Jogador 2

		let gameOver = false;

		function showEndScreen(winnerName) {
			console.log('Game over! The winner is:', winnerName);
		
			// Configurações do retângulo
			const rectWidth = 400;
			const rectHeight = 200;
			const rectX = (canvasWidth - rectWidth) / 2;
			const rectY = (canvasHeight - rectHeight) / 2;
		
			// Desenha o retângulo
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
		
			// Texto do vencedor
			ctx.fillStyle = "#fff";
			ctx.font = "50px CustomFont";
			ctx.textAlign = "center";
			ctx.fillText(`WINNER: ${winnerName}`, canvasWidth / 2, canvasHeight / 2 + 20);
		
			// Retorna uma Promise que resolve após o jogo fechar
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('Closing the game...');
					const closeGame = document.getElementById('runPong');
					if (closeGame) {
						closeGame.remove();
					}
					resolve();  // Resolve a Promise com o nome do vencedor
				}, 3000);
			});
		}
		

		function drawPONG(letterSpacing = -5) {
			// Definir a fonte e o tamanho do texto
			ctx.font = "100px PongFont";
			ctx.fillStyle = "#69696950";

			// A palavra que queremos desenhar
			const text = "PONG";

			// Iniciar a posição X (a partir do centro do canvas, ajustando para o tamanho do texto e espaçamento)
			const totalTextWidth = ctx.measureText(text).width + (text.length - 1) * letterSpacing - 15;
			let xPosition = (canvasWidth - totalTextWidth) / 2;

			// Definir a posição Y para o texto ficar na parte inferior do canvas
			const yPosition = canvasHeight - 20;

			// Desenhar cada letra individualmente, aplicando o espaçamento
			for (let i = 0; i < text.length; i++) {
				ctx.fillText(text[i], xPosition, yPosition);
				xPosition += ctx.measureText(text[i]).width + letterSpacing;  // Avançar a posição X, adicionando o espaçamento
			}
		}

		function drawPlayerNames() {
			backgroundCtx.font = "20px CustomFont"; // Defina o tamanho e a fonte do texto
			backgroundCtx.fillStyle = "gray"; // Defina a cor do texto

			// Posição X da linha vertical central
			const centerLineX = canvasWidth / 2;

			// Calcule a largura do nome do Player 1
			const player1NameWidth = backgroundCtx.measureText(player1Name).width;

			// Ajuste a posição X do nome do Player 1 para que a última letra fique a 20px da linha central
			const player1X = centerLineX - player1NameWidth - 20;

			// Alinhe o texto do Player 1 à esquerda
			backgroundCtx.textAlign = "left";

			// Posicione o Player 2 normalmente, à direita da linha central
			const player2X = centerLineX + 20;

			// Posição Y para os nomes
			const nameY = 170; // Ajuste o valor conforme necessário para posicionar o nome abaixo dos dígitos

			// Desenhe os nomes dos jogadores
			backgroundCtx.fillText(player1Name, player1X, nameY); // Nome do Jogador 1
			backgroundCtx.fillText(player2Name, player2X, nameY); // Nome do Jogador 2
		}

		function drawDigit(ctx, n, x, y) {
			const segmentSize = 20; // Tamanho de cada segmento (20x20 pixels)
			const segmentMargin = 0; // Espaçamento entre segmentos

			// Define os números de 0 a 9 usando uma matriz 5x3
			const digits = [
				[[1, 1, 1],[1, 0, 1],[1, 0, 1],[1, 0, 1],[1, 1, 1]], // 0
				[[0, 1, 0],[0, 1, 0],[0, 1, 0],[0, 1, 0],[0, 1, 0]], // 1
				[[1, 1, 1],[0, 0, 1],[1, 1, 1],[1, 0, 0],[1, 1, 1]], // 2
				[[1, 1, 1],[0, 0, 1],[1, 1, 1],[0, 0, 1],[1, 1, 1]], // 3
				[[1, 0, 1],[1, 0, 1],[1, 1, 1],[0, 0, 1],[0, 0, 1]], // 4
				[[1, 1, 1],[1, 0, 0],[1, 1, 1],[0, 0, 1],[1, 1, 1]], // 5
				[[1, 1, 1],[1, 0, 0],[1, 1, 1],[1, 0, 1],[1, 1, 1]], // 6
				[[1, 1, 1],[0, 0, 1],[0, 0, 1],[0, 0, 1],[0, 0, 1]], // 7
				[[1, 1, 1],[1, 0, 1],[1, 1, 1],[1, 0, 1],[1, 1, 1]], // 8
				[[1, 1, 1],[1, 0, 1],[1, 1, 1],[0, 0, 1],[0, 0, 1]]  // 9
			];

			// Define a cor do segmento
			ctx.fillStyle = "white"; // Branco

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
			backgroundCtx.lineWidth = 10;  // Line width
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

			// Colisão da bola com as paredes superiores/inferiores
			if (ballY <= 0 || ballY + ballSize >= canvasHeight) {
				ballDirY *= -1;
				wallSound.play();  // Som de colisão com a parede
			}

			// Colisão da bola com os paddles
			if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
				ballDirX *= -1;
				leftPaddleSound.play();  // Som de colisão com o paddle esquerdo
			}
			if (ballX + ballSize >= canvasWidth - paddleWidth && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
				ballDirX *= -1;
				rightPaddleSound.play();  // Som de colisão com o paddle direito
			}

			// Verificação de golo
			if (ballX <= 0) {
				player2Score++;
				goalSound.play();  // Som de golo
				resetBall();

				// Verifica se o jogador 2 venceu
				if (player2Score >= winningScore) {
					endGame();
				}
			}
			if (ballX + ballSize >= canvasWidth) {
				player1Score++;
				goalSound.play();  // Som de golo
				resetBall();

				// Verifica se o jogador 1 venceu
				if (player1Score >= winningScore) {
					endGame();
				}
			}
		}

		function resetBall() {
			ballX = canvasWidth / 2 - ballSize / 2;
			ballY = canvasHeight / 2 - ballSize / 2;

			// Randomiza a direção da bola no eixo X e Y
			ballDirX = (Math.random() < 0.5 ? -1 : 1) * ballSpeedX;
			ballDirY = (Math.random() < 0.5 ? -1 : 1) * ballSpeedY;
		}

		async function endGame() {
			// Para o jogo
			gameOver = true;
		
			// Determina o vencedor e o perdedor
			let winner, loser, winnerScore, loserScore;
			
			if (player1Score > player2Score) {
				winner = player1Name;
				loser = player2Name;
				winnerScore = player1Score;
				loserScore = player2Score;
			} else {
				winner = player2Name;
				loser = player1Name;
				winnerScore = player2Score;
				loserScore = player1Score;
			}
		
			console.log('End Game - Winner:', winner, 'Player1:', player1Name, 'Player2:', player2Name);
		
			await showEndScreen(winner);
			resolve(winner);
		}

        function updateGame() {
            if (gameOver) {
                return;  // Se o jogo acabou, para o loop de atualização
            }

            // Verifica se o usuário ainda está na página do jogo
            if (window.location.pathname !== `/user/${username}/pong-game-tournament`) {
                console.log('Usuário saiu da página do jogo, interrompendo o loop.');
				resolve(null);
                return;  // Interrompe o loop
            }

            // Clear the canvas for the ball and paddles
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw the background and scores
            drawScores();

            // Desenhar o título "PONG"
            drawPONG();

            // Draw player names
            drawPlayerNames();

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
    });
}

export { runPongMatch };