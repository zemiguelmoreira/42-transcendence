let snakeScriptLoaded = false; // Variável global para rastrear se o script foi carregado
let snake4allScriptLoaded = false; // Variável global para rastrear se o script foi carregado

function snakeGameLocal(username) {

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
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGame();
		}
	}
}

function snakeGameFreeForAll(username) {

	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="snake-content">
			<div class="snake-container">
				<div class="snake-box snake-score1">
					<span class="snake-ply1">Snake 1</span>
					<span class="snake-score1--value">00</span>
				</div>
				<div class="snake-box snake-score1">
					<span class="snake-ply2">Snake 2</span>
					<span class="snake-score2--value">00</span>
				</div>
				<div class="snake-logo">
					<img src="../../files/macro2snake.png" alt="Snake Logo">
				</div>
				<div class="snake-box snake-score1">
					<span class="snake-ply3">Snake 3</span>
					<span class="snake-score3--value">00</span>
				</div>
				<div class="snake-box snake-score1">
					<span class="snake-ply4">Snake 4</span>
					<span class="snake-score4--value">00</span>
				</div>
			</div>
			<div class="snake-box"><canvas width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	if (!snake4allScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake-free-for-all.js';
		scriptElement.onload = () => {
			snake4allScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Erro ao carregar o script snake-free-for-all.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		if (typeof initializeSnakeGameFreeForAll === 'function') {
			initializeSnakeGameFreeForAll();
		}
	}
}

export { snakeGameLocal , snakeGameFreeForAll }