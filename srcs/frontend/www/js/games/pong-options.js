import { navigateTo } from "../app.js";

function pongOptions(username) {
	try {
		document.getElementById('mainContent').innerHTML = `
			<div class="card" style="width: 18rem;">
				<img src="../../files/1vs1PongLocal.png" class="card-img-top" alt="alt="Enter to play"">
				<div class="card-body">
					<h5 class="card-title">PONG LOCAL</h5>
					<p class="card-text">Old classic nostalgic table tennis game with paddles and a ball. <b>Local friendly unranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="pongGameLocal">Let's Play</a>
				</div>
			</div>
			<div class="card" style="width: 18rem;">
				<img src="../../files/1vs1PongRemote.png" class="card-img-top" alt="alt="Enter to play"">
				<div class="card-body">
					<h5 class="card-title">PONG REMOTE</h5>
					<p class="card-text">Classic Pong online challenge against a ranked remote player. <b>Remote ranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="pongGameRemote">Let's Play</a>
				</div>
			</div>

			<div class="card" style="width: 18rem;">
				<img src="../../files/4PongTournament.png" class="card-img-top" alt="alt="Enter to chat"">
				<div class="card-body">
					<h5 class="card-title">PONG TOURNMENT</h5>
					<p class="card-text">Organize a Pong tournament between several players locally. <b>Local friendly unranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="pongGameTournament">Let's Talk</a>
				</div>
			</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	document.getElementById('pongGameLocal').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong-game-local`);
	});

	document.getElementById('pongGameRemote').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong-game-remote`);
	});

	document.getElementById('pongGameTournament').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong-game-tournament`);
	});

}

export { pongOptions }