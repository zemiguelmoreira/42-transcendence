import { navigateTo } from "../app.js";
import { initializeSnakeGameLocal } from '../../js/games/snake-local.js';
import { initializeSnakeGameFreeForAll } from '../../js/games/snake-free-for-all.js';

let guest, guest1, guest2, guest3;

function startLocalSnakePopup() {
	return `
		<div class="local-pending" id="localPending">
			<div class="local-box">
				<div class="logo-box1">SNAKE</div>
				<div class="font-custom">GUEST NAME</div>
				<input id="guestInput" class="local-input" type="text" placeholder="Enter guest name" maxlength="10" autofocus value="GUEST">
				<button id="playButton" class="btn btn-success local-btn">Play</button>
				<button id="cancelButton" class="btn btn-danger local-btn">Cancel</button>
		
				<div class="local-instructions-title myFont-title">GAME INSTRUCTIONS</div>
		
				<div class="local-instructions-container">
					<div class="local-instructions-column">
						<div class="local-instructions myFont-title">PLAYER 1</div>
						<div class="local-instructions myFont">w</div>
						<div class="local-instructions myFont">s</div>
						<div class="local-instructions myFont">a</div>
						<div class="local-instructions myFont">d</div>
					</div>
		
					<div class="local-instructions-column controls">
						<div class="local-instructions myFont"> - </div> <!-- Espaço em branco para alinhar -->
						<div class="local-instructions myFont">UP</div>
						<div class="local-instructions myFont">DOWN</div>
						<div class="local-instructions myFont">LEFT</div>
						<div class="local-instructions myFont">RIGHT</div>
					</div>
		
					<div class="local-instructions-column">
						<div class="local-instructions myFont-title">PLAYER 2</div>
						<div class="local-instructions myFont">&#8593;</div>
						<div class="local-instructions myFont">&#8595;</div>
						<div class="local-instructions myFont">&#8592;</div>
						<div class="local-instructions myFont">&#8594;</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

function startMultiplayerSnakePopup() {
	return `
		<div class="local-pending" id="localPending">
			<div class="local-box-container-custom">
				<div class="local-box-custom">
					<div class="logo-box-custom1">SNAKE</div>
					<div class="font-custom">GUEST NAMES</div>
					<input id="guestInput1" class="local-input-custom" type="text" placeholder="Enter guest 1 name" maxlength="10" autofocus value="Guest1">
					<input id="guestInput2" class="local-input-custom" type="text" placeholder="Enter guest 2 name" maxlength="10" autofocus value="Guest2">
					<input id="guestInput3" class="local-input-custom" type="text" placeholder="Enter guest 3 name" maxlength="10" autofocus value="Guest3">
					<button id="playButton" class="btn btn-success local-btn-custom">Play</button>
					<button id="cancelButton" class="btn btn-danger local-btn-custom">Cancel</button>
				</div>
		
				<!-- Centralize this box at the bottom -->
				<div class="local-instructions-box-custom">
					<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
					<div class="local-instructions-container-custom myFont">
						<!-- Players 1 and 2 on the left -->
						<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">PLAYER 1</div>
							<div class="local-instructions-custom">w</div>
							<div class="local-instructions-custom">s</div>
							<div class="local-instructions-custom">a</div>
							<div class="local-instructions-custom">d</div>
						</div>
		
						<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">PLAYER 2</div>
							<div class="local-instructions-custom">8</div>
							<div class="local-instructions-custom">5</div>
							<div class="local-instructions-custom">4</div>
							<div class="local-instructions-custom">6</div>
						</div>
		
						<!-- Central controls -->
						<div class="local-instructions-column-controls">
							<div class="local-instructions-custom"> - </div>
							<div class="local-instructions-custom">UP</div>
							<div class="local-instructions-custom">DOWN</div>
							<div class="local-instructions-custom">LEFT</div>
							<div class="local-instructions-custom">RIGHT</div>
						</div>
		
						<!-- Players 3 and 4 on the right -->
						<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">PLAYER 3</div>
							<div class="local-instructions-custom">&#8593;</div>
							<div class="local-instructions-custom">&#8595;</div>
							<div class="local-instructions-custom">&#8592;</div>
							<div class="local-instructions-custom">&#8594;</div>
						</div>
		
						<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">PLAYER 4</div>
							<div class="local-instructions-custom">i</div>
							<div class="local-instructions-custom">k</div>
							<div class="local-instructions-custom">j</div>
							<div class="local-instructions-custom">l</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

function snakeGameLocalPage() {
	return `
		<div class="snake-content">
			<div class="snake-container">
				<div class="snake-box snake-score1">
					<span class="snake-ply1" id="snakeName1">Snake 1</span>
					<span class="snake-score1--value" id="snakeScore1">0</span>
				</div>
				<div class="snake-logo">
					<img src="../../files/macro2snake.png" alt="Snake Logo">
				</div>
				<div class="snake-box snake-score2">
					<span class="snake-ply2" id="snakeName2">Snake 2</span>
					<span class="snake-score2--value" id="snakeScore2">0</span>
				</div>
			</div>
			<div class="snake-box"><canvas id="gameCanvasSnakeLocal" width="980" height="500"></canvas></div>
		</div>
	`;
}

function snakeGameMultiplayerPage() {
	return `
	<div class="snake-content">
		<div class="snake-container">
			<div class="snake-box snake-score1">
				<span id="snakeName1" class="snake-ply1">Snake 1</span>
				<span id="snakeScore1" class="snake-score1--value">0</span>
			</div>
			<div class="snake-box snake-score1">
				<span id="snakeName2" class="snake-ply2">Snake 2</span>
				<span id="snakeScore2" class="snake-score1--value">0</span>
			</div>
			<div class="snake-logo">
				<img src="../../files/macro2snake.png" alt="Snake Logo">
			</div>
			<div class="snake-box snake-score1">
				<span id="snakeName3" class="snake-ply3">Snake 3</span>
				<span id="snakeScore3" class="snake-score1--value">0</span>
			</div>
			<div class="snake-box snake-score1">
				<span id="snakeName4" class="snake-ply4">Snake 4</span>
				<span id="snakeScore4" class="snake-score1--value">0</span>
			</div>
		</div>
		<div class="snake-box"><canvas id="gameCanvasSnakeFreeForAll" width="980" height="500"></canvas></div>
	</div>
	`;
}

function loadSnakeLocalScript(username) {
	console.log('Loading snake guest window');
	if (document.readyState === 'loading') {
		// O DOM ainda não está carregado, então adicione o listener
		document.addEventListener('DOMContentLoaded', () => {
			const localPendingDiv = document.getElementById('localPending');
			if (localPendingDiv && typeof initializeSnakeGameLocal === 'function') {
				localPendingDiv.remove();
				document.getElementById('snakeName1').textContent = username;
				document.getElementById('snakeName2').textContent = guest;
				initializeSnakeGameLocal(username, guest);
			}
		});
	} else {
		// O DOM já está carregado, então execute imediatamente
		const localPendingDiv = document.getElementById('localPending');
		if (localPendingDiv && typeof initializeSnakeGameLocal === 'function') {
			localPendingDiv.remove();
			document.getElementById('snakeName1').textContent = username;
			document.getElementById('snakeName2').textContent = guest;
			initializeSnakeGameLocal(username, guest);
		}
	}
}

function loadSnakeMultiplayerScript(username) {
	console.log('Loading snake guest window');
	if (document.readyState === 'loading') {
		// O DOM ainda não está carregado, então adicione o listener
		document.addEventListener('DOMContentLoaded', () => {
			const localPendingDiv = document.getElementById('localPending');
			if (localPendingDiv && typeof initializeSnakeGameFreeForAll === 'function') {
				localPendingDiv.remove();
				document.getElementById('snakeName1').textContent = username;
				document.getElementById('snakeName2').textContent = guest1;
				document.getElementById('snakeName3').textContent = guest2;
				document.getElementById('snakeName4').textContent = guest3;
				initializeSnakeGameFreeForAll(username, guest1, guest2, guest3);
			}
		});
	} else {
		// O DOM já está carregado, então execute imediatamente
		const localPendingDiv = document.getElementById('localPending');
		if (localPendingDiv && typeof initializeSnakeGameFreeForAll === 'function') {
			localPendingDiv.remove();
			document.getElementById('snakeName1').textContent = username;
			document.getElementById('snakeName2').textContent = guest1;
			document.getElementById('snakeName3').textContent = guest2;
			document.getElementById('snakeName4').textContent = guest3;
			initializeSnakeGameFreeForAll(username, guest1, guest2, guest3);
		}
	}
}

function snakeGameLocal(username) {
	document.getElementById('root').insertAdjacentHTML('afterbegin', startLocalSnakePopup());
	document.getElementById('guestInput').focus();
	
	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		console.log('Cancel button clicked');
		const localPendingDiv = document.getElementById('localPending');
		localPendingDiv.remove();
	});

	const playButton = document.getElementById('playButton');
	playButton.addEventListener('click', () => {
		guest = document.querySelector('#guestInput').value;
		const runSnakeLocal = document.createElement('div');
		runSnakeLocal.classList.add('invite-pending');
		runSnakeLocal.id = 'runSnake';
		runSnakeLocal.innerHTML = snakeGameLocalPage();
		document.getElementById('root').appendChild(runSnakeLocal);
		navigateTo(`/user/${username}/snake-game-local`);
	});
}

function snakeGameRemote(username) {
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
			<div class="snake-box"><canvas id="gameCanvasSnakeRemote" width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Error loading:', error);
	}
	if (!snakeRemoteScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake-remote.js';
		scriptElement.onload = () => {
			snakeRemoteScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Error loading script snake-remote.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGameRemote();
		}
	}
}

function snakeGameMultiplayer(username) {
	document.getElementById('root').insertAdjacentHTML('afterbegin', startMultiplayerSnakePopup());
	document.getElementById('guestInput1').focus();
	
	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		console.log('Cancel button clicked');
		const localPendingDiv = document.getElementById('localPending');
		localPendingDiv.remove();
	});

	const playButton = document.getElementById('playButton');
	playButton.addEventListener('click', () => {
		guest1 = document.querySelector('#guestInput1').value;
		guest2 = document.querySelector('#guestInput2').value;
		guest3 = document.querySelector('#guestInput3').value;
		const runSnakeLocal = document.createElement('div');
		runSnakeLocal.classList.add('invite-pending');
		runSnakeLocal.id = 'runSnake';
		runSnakeLocal.innerHTML = snakeGameMultiplayerPage();
		document.getElementById('root').appendChild(runSnakeLocal);
		navigateTo(`/user/${username}/snake-game-free-for-all`);
	});
}

export { snakeGameLocal , snakeGameRemote , snakeGameMultiplayer , loadSnakeLocalScript , loadSnakeMultiplayerScript };