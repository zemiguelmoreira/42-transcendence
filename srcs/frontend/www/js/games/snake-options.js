import { navigateTo } from "../app.js";
import { snakeGameLocal } from "./snake-pages.js";

function snakeOptions(username) {

	try {
		document.getElementById('mainContent').innerHTML = `
			<div class="card" style="width: 18rem;">
				<img src="../../files/1vs1SnakeLocal.png" class="card-img-top" alt="alt="Enter to play"">
				<div class="card-body">
					<h5 class="card-title">SNAKE LOCAL</h5>
					<p class="card-text">Game where a "snake" eats food to grow and must avoid collisions. <b>Local friendly unranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="snakeGameLocal">Let's Play</a>
				</div>
			</div>
	
			<div class="card" style="width: 18rem;">
				<img src="../../files/1vs1SnakeRemote.png" class="card-img-top" alt="alt="Enter to play"">
				<div class="card-body">
					<h5 class="card-title">SNAKE REMOTE</h5>
					<p class="card-text">Game where a "snake" eats food to grow and must avoid collisions. <b>Remote ranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="snakeGameRemote">Let's Play</a>
				</div>
			</div>
	
			<div class="card" style="width: 18rem;">
				<img src="../../files/4SnakeFreeForAll.png" class="card-img-top" alt="alt="Enter to chat"">
				<div class="card-body">
					<h5 class="card-title">SNAKE FREE FOR ALL</h5>
					<p class="card-text"> Survive this epic 4 multiplayer "free for all" snake adventure. <b>Remote unranked game.</b></p>
					<a href="" class="btn btn-primary card-btn" id="snakeGameFreeForAll">Let's Play</a>
				</div>
			</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	document.getElementById('snakeGameLocal').addEventListener('click', (e) => {
		e.preventDefault();
		snakeGameLocal(username);
	});

	document.getElementById('snakeGameRemote').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/snake-game-remote`);
	});

	document.getElementById('snakeGameFreeForAll').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/snake-game-free-for-all`);
	});

}

export { snakeOptions }