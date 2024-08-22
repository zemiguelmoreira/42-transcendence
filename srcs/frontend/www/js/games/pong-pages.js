let pongScriptLoaded = false; // Variável global para rastrear se o script foi carregado

function pongGameLocal(username) {
	try {
		document.getElementById('root').innerHTML = `
			<div class="home-box">
				<div class="pong-content">
					<div class="pong-box">
						<canvas id="pongBackgroundCanvas" width="960" height="560"></canvas>
						<canvas id="pongCanvas" width="960" height="560"></canvas>
					</div>
				</div>
			</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
	if (!pongScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.type = 'module';  // Define o script como módulo ES6
		scriptElement.src = '../../js/games/pong-local.js';
		scriptElement.onload = () => {
			pongScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Erro ao carregar o script pong-local.js');
		};
		document.body.appendChild(scriptElement);
	}
}

function pongGameRemote(username) {
	try {
		document.getElementById('root').innerHTML = `
			<div class="home-box">
				<div class="pong-content">
					<div class="pong-box">
						<canvas id="pongBackgroundCanvas" width="960" height="560"></canvas>
						<canvas id="pongCanvas" width="960" height="560"></canvas>
					</div>
				</div>
			</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
	if (!pongScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.type = 'module';  // Define o script como módulo ES6
		scriptElement.src = '../../js/games/pong-remote.js';
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