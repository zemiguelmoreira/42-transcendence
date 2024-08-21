let snakeLocalScriptLoaded = false; // Variável global para rastrear se o script foi carregado
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
			<div class="snake-box"><canvas id="gameCanvasSnakeLocal" width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	if (!snakeLocalScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake-local.js';
		scriptElement.onload = () => {
			snakeLocalScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Erro ao carregar o script snake-local.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGame();
		}
	}
}

function snakeGameFreeForAll(username) {
    // Monta o HTML do jogo
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
                    <span class="snake-score1--value">00</span>
                </div>
                <div class="snake-logo">
                    <img src="../../files/macro2snake.png" alt="Snake Logo">
                </div>
                <div class="snake-box snake-score1">
                    <span class="snake-ply3">Snake 3</span>
                    <span class="snake-score1--value">00</span>
                </div>
				<div class="snake-box snake-score1">
                    <span class="snake-ply4">Snake 4</span>
                    <span class="snake-score1--value">00</span>
                </div>
            </div>
            <div class="snake-box"><canvas id="gameCanvasSnakeFreeForAll" width="980" height="420"></canvas></div>
        </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }

    // Aguarda o carregamento do script
    if (!snake4allScriptLoaded) {
        const scriptElement = document.createElement('script');
        scriptElement.src = '../../js/games/snake-free-for-all.js';
        scriptElement.onload = () => {
            snake4allScriptLoaded = true;
            // Só chama a inicialização do jogo depois que o script for carregado e o conteúdo estiver no DOM
            if (typeof initializeSnakeGameFreeForAll === 'function') {
                initializeSnakeGameFreeForAll(); 
            }
        };
        scriptElement.onerror = () => {
            console.error('Erro ao carregar o script snake.js');
        };
        document.body.appendChild(scriptElement);
    } else {
        // Se o script já está carregado, inicializa o jogo
        if (typeof initializeSnakeGameFreeForAll === 'function') {
            initializeSnakeGameFreeForAll(); 
        }
    }
}

export { snakeGameLocal , snakeGameFreeForAll }