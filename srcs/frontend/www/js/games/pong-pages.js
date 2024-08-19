let pongScriptLoaded = false; // Variável global para rastrear se o script foi carregado

function pongGameLocal(username) {

	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="pong-content">
			<div class="pong-container">
				<div class="pong-box pong-score1">
					<span class="pong-ply1">pong 1</span>
					<span class="pong-score1--value">00</span>
				</div>
				<div class="pong-logo">
					<img src="../../files/macro2snake.png" alt="pong Logo">
				</div>
				<div class="pong-box pong-score2">
					<span class="pong-ply2">pong 2</span>
					<span class="pong-score2--value">00</span>
				</div>
			</div>
			<div class="pong-box"><canvas width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	if (!pongScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.type = 'module';  // Define o script como módulo ES6
		scriptElement.src = '../../js/games/pong.js';
		scriptElement.onload = () => {
			pongScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Erro ao carregar o script pong.js');
		};
		document.body.appendChild(scriptElement);
	}
	
}

export { pongGameLocal }