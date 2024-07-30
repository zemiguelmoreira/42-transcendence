import { navigateTo } from "../app.js";



function snakeOptions(username) {
	const snakePage = snakeGameOptions();
	console.log("SNAKE TESTE");
	document.getElementById('homeButton').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});
}

function snakeGameOptions() {
	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="organize">
			<div class="organize-title">SNAKE OPTIONS</div>
			<div class="home-box">
				<div class="card" style="width: 18rem;">
					<img src="../../files/local_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">LOCAL DUEL</h5>
						<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
						<a href="#" class="btn btn-primary card-btn" id="snakeGame">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../../files/online_play.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">MULTIPLAYER</h5>
						<p class="card-text">Game where a "snake" eats food to grow and must avoid walls, enemy and itself.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Play</a>
					</div>
				</div>

				<div class="card" style="width: 18rem;">
					<img src="../../files/tournment.jpg" class="card-img-top" alt="...">
					<div class="card-body">
						<h5 class="card-title">TOURNMENT</h5>
						<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
						<a href="#" class="btn btn-primary card-btn">Let's Talk</a>
					</div>
				</div>
			</div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
}

export { snakeOptions }