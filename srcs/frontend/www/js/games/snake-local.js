let snakeScriptLoaded = false; // Variável global para rastrear se o script foi carregado

function snakeGameLocal(username) {
	const snakeGamePage = snakePage();

	// Verificar se o script já foi carregado
	if (!snakeScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake.js';
		scriptElement.onload = () => {
			snakeScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Erro ao carregar o script snake.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		// Se o script já foi carregado, executa o código manualmente
		// Se o script não for executado automaticamente após o carregamento,
		// você pode chamar funções específicas diretamente aqui.
		// Por exemplo:
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGame(); // Chame uma função de inicialização definida em snake.js
		}
	}
}

function snakePage() {
	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="snake-content">
			<div class="snake-container">
				<div class="snake-box snake-score1">
					<span class="snake-ply1">Snake 1</span>
					<span class="snake-score1--value">00</span>
				</div>
				<div class="snake-logo">
					<img src="../../files/macro2snake.png" alt="Snake Logo">
				</div>
				<div class="snake-box snake-score2">
					<span class="snake-ply2">Snake 2</span>
					<span class="snake-score2--value">00</span>
				</div>
			</div>
			<div class="snake-box"><canvas width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
}

export { snakeGameLocal }