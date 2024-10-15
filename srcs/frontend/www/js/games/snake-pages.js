import { navigateTo } from "../app.js";
import { initializeSnakeGameLocal } from '../../js/games/snake-local.js';
import { initializeSnakeGameFreeForAll } from '../../js/games/snake-free-for-all.js';
import { joinSnakeRoom } from "../games/snake-remote.js";
import { displaySlidingMessage } from "../utils/utils1.js";

let guest, guest1, guest2, guest3;
let matchmakingSocket = null;

function startLocalSnakePopup(username) {
	return `
		<div class="local-pending" id="snakePopup">
			<div class="local-box">
				<div class="logo-box1">SNAKE</div>
				<div class="local-instructions-title-custom myFont-title">LOCAL MATCH</div>
				<form id="gameForm">
					<input id="guestInput" class="local-input-custom" type="text" value="Guest" maxlength="10" autofocus>
					<button id="playButton" class="btn btn-success local-btn-custom" type="submit">PLAY</button>
					<button id="cancelButton" class="btn btn-danger local-btn-custom">CANCEL</button>
				</form>
					<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
				<div class="local-instructions-container">
					<div class="local-instructions-column">
						<div class="local-instructions-custom myFont-title">${username}</div>
						<div class="local-instructions-custom myFont">W</div>
						<div class="local-instructions-custom myFont">S</div>
						<div class="local-instructions-custom myFont">A</div>
						<div class="local-instructions-custom myFont">D</div>
					</div>
					<div class="local-instructions-column controls">
						<div class="local-instructions-custom myFont"> - </div>
						<div class="local-instructions-custom myFont">UP</div>
						<div class="local-instructions-custom myFont">DOWN</div>
						<div class="local-instructions-custom myFont">LEFT</div>
						<div class="local-instructions-custom myFont">RIGHT</div>
					</div>
					<div class="local-instructions-column">
						<div class="local-instructions-custom myFont-title">P2</div>
						<div class="local-instructions-custom myFont">&#8593;</div>
						<div class="local-instructions-custom myFont">&#8595;</div>
						<div class="local-instructions-custom myFont">&#8592;</div>
						<div class="local-instructions-custom myFont">&#8594;</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

function startRemoteSnakePopup() {
	return `
	<div class="local-pending" id="snakePopup">
		<div class="local-box">
			<img src="../../files/snakeMatch.png" alt="Game Image" width="150" height="50">
			<div class="local-instructions-title-custom myFont-title">REMOTE MATCH</div>
			<button id="joinMatchmaking" class="btn btn-success local-btn-custom">FIND OPPONENT</button>
			<button id="cancelMatchmaking" class="btn btn-danger local-btn-custom">CANCEL</button>
			<div id="status" class="local-instructions-title myFont-title">READY TO PLAY?</div>
			<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
			<div class="local-instructions-container">
				<div class="local-instructions-row">
					<div class="local-instructions-column2">
						<div class="local-instructions-custom myFont">UP</div>
						<div class="local-instructions-custom myFont">DOWN</div>
					</div>
					<div class="local-instructions-column2">
						<div class="local-instructions-custom myFont">&#8593;</div>
						<div class="local-instructions-custom myFont">&#8595;</div>
					</div>
					<div class="local-instructions-column2">
						<div class="local-instructions-custom myFont">LEFT</div>
						<div class="local-instructions-custom myFont">RIGHT</div>
					</div>
					<div class="local-instructions-column2">
						<div class="local-instructions-custom myFont">&#8592;</div>
						<div class="local-instructions-custom myFont">&#8594;</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	`;
}

function startMultiplayerSnakePopup(username) {
	return `
		<div class="local-pending" id="snakePopup">
			<div class="local-box-container-custom">
				<div class="local-box-custom">
					<div class="logo-box-custom1">SNAKE</div>
					<div class="local-instructions-title-custom myFont-title">MULTIPLAYER MATCH</div>
					<input id="guestInput1" class="local-input-custom" type="text" maxlength="10" autofocus value="Guest1">
					<input id="guestInput2" class="local-input-custom" type="text" maxlength="10" autofocus value="Guest2">
					<input id="guestInput3" class="local-input-custom" type="text" maxlength="10" autofocus value="Guest3">
					<button id="playButton" class="btn btn-success local-btn-custom">PLAY</button>
					<button id="cancelButton" class="btn btn-danger local-btn-custom">CANCEL</button>
				</div>
				<div class="local-instructions-box-custom">
					<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
					<div class="local-instructions-container-custom myFont">
						<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">${username}</div>
							<div class="local-instructions-custom">W</div>
							<div class="local-instructions-custom">S</div>
							<div class="local-instructions-custom">A</div>
							<div class="local-instructions-custom">D</div>
						</div>
						<div class="local-instructions-column-custom">
						<div class="local-instructions myFont-title">P1</div>
							<div class="local-instructions-custom">&#8593;</div>
							<div class="local-instructions-custom">&#8595;</div>
							<div class="local-instructions-custom">&#8592;</div>
							<div class="local-instructions-custom">&#8594;</div>
						</div>
							<div class="local-instructions-column-custom">
							<div class="local-instructions-custom"> - </div>
							<div class="local-instructions-custom">UP</div>
							<div class="local-instructions-custom">DOWN</div>
							<div class="local-instructions-custom">LEFT</div>
							<div class="local-instructions-custom">RIGHT</div>
						</div>
							<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">P2</div>
							<div class="local-instructions-custom">I</div>
							<div class="local-instructions-custom">K</div>
							<div class="local-instructions-custom">J</div>
							<div class="local-instructions-custom">L</div>
						</div>
							<div class="local-instructions-column-custom">
							<div class="local-instructions myFont-title">P3</div>
							<div class="local-instructions-custom">8</div>
							<div class="local-instructions-custom">5</div>
							<div class="local-instructions-custom">4</div>
							<div class="local-instructions-custom">6</div>
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

function snakeGameRemotePage() {
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
			<div class="snake-box"><canvas id="gameCanvasSnakeRemote" width="980" height="500"></canvas></div>
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
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			const snakePopupDiv = document.getElementById('snakePopup');
			if (snakePopupDiv && typeof initializeSnakeGameLocal === 'function') {
				snakePopupDiv.remove();
				document.getElementById('snakeName1').textContent = username;
				document.getElementById('snakeName2').textContent = guest;
				initializeSnakeGameLocal(username, guest);
			}
		});
	} else {
		const snakePopupDiv = document.getElementById('snakePopup');
		if (snakePopupDiv && typeof initializeSnakeGameLocal === 'function') {
			snakePopupDiv.remove();
			document.getElementById('snakeName1').textContent = username;
			document.getElementById('snakeName2').textContent = guest;
			initializeSnakeGameLocal(username, guest);
		}
	}
}

function loadSnakeMultiplayerScript(username) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			const snakePopupDiv = document.getElementById('snakePopup');
			if (snakePopupDiv && typeof initializeSnakeGameFreeForAll === 'function') {
				snakePopupDiv.remove();
				document.getElementById('snakeName1').textContent = username;
				document.getElementById('snakeName2').textContent = guest1;
				document.getElementById('snakeName3').textContent = guest2;
				document.getElementById('snakeName4').textContent = guest3;
				initializeSnakeGameFreeForAll(username, guest1, guest2, guest3);
			}
		});
	} else {
		const snakePopupDiv = document.getElementById('snakePopup');
		if (snakePopupDiv && typeof initializeSnakeGameFreeForAll === 'function') {
			snakePopupDiv.remove();
			document.getElementById('snakeName1').textContent = username;
			document.getElementById('snakeName2').textContent = guest1;
			document.getElementById('snakeName3').textContent = guest2;
			document.getElementById('snakeName4').textContent = guest3;
			initializeSnakeGameFreeForAll(username, guest1, guest2, guest3);
		}
	}
}

function snakeGameLocal(username) {
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', startLocalSnakePopup(username));
	document.getElementById('guestInput').focus();

	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		const snakePopupDiv = document.getElementById('snakePopup');
		snakePopupDiv.remove();
		navigateTo(`/user/${username}/snake`);
	});

	document.getElementById("gameForm").addEventListener("submit", function (event) {
		const inputField = document.getElementById("guestInput");
		const userInput = inputField.value.trim();
		const validNamePattern = /^[a-zA-Z0-9]+$/;

		if (userInput.length === 0 || userInput.length > 10 || !validNamePattern.test(userInput)) {
			event.preventDefault();
			displaySlidingMessage("Invalid input: Name must be 1-10 characters long and contain only letters or numbers.");
			inputField.classList.add('input-error');
			return;
		} else {
			inputField.classList.remove('input-error');
		}

		guest = userInput;
		const runSnakeLocal = document.createElement('div');
		runSnakeLocal.classList.add('invite-pending');
		runSnakeLocal.id = 'runSnake';
		runSnakeLocal.innerHTML = snakeGameLocalPage();
		document.getElementById('root').appendChild(runSnakeLocal);
		loadSnakeLocalScript(username);
	});
}

function snakeGameRemote(username) {
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', startRemoteSnakePopup());

	let token = localStorage.getItem('access_token');

	if (matchmakingSocket && matchmakingSocket.readyState !== WebSocket.CLOSED) {
		matchmakingSocket.close();
		matchmakingSocket = null;
	}

	matchmakingSocket = new WebSocket(`wss://${window.location.host}/mm/ws/?token=${token}`);
	matchmakingSocket.onopen = (event) => {
		console.log("Matchmaking WebSocket connection opened.");
	};

	matchmakingSocket.onerror = function (event) {
		console.error('Matchmaking WebSocket error observed:', event);
		if (matchmakingSocket.readyState === WebSocket.OPEN) {
			matchmakingSocket.close();
			console.log('Matchmaking Socket Closed on error');
		}
		matchmakingSocket = null;
	};

	matchmakingSocket.onmessage = async (event) => {
		const data = JSON.parse(event.data);


		if (data.match === "match_created") {
			// Close the matchmaking socket if the user navigates away from the matchmaking page
			if (window.location.pathname !== `/user/${username}/snake-game-remote`) {
				const data = JSON.stringify({
					type: "cancel"
				});

				matchmakingSocket.send(data);
				if (matchmakingSocket && matchmakingSocket.readyState !== WebSocket.CLOSED) {
					matchmakingSocket.close();
					console.log('Matchmaking WebSocket connection closed.');
				}
			}

			console.log("Match created!", data.roomCode);

			if (document.getElementById('status')) {
				document.getElementById('status').innerText = `Match found!\nOpponent: ${data.opponent}`;
				const popupWindow = document.getElementById('snakePopup');
				popupWindow.remove();
			}

			const runSnakeRemote = document.createElement('div');
			runSnakeRemote.classList.add('invite-pending');
			runSnakeRemote.id = 'invitePending';
			runSnakeRemote.innerHTML = snakeGameRemotePage();
			document.getElementById('root').appendChild(runSnakeRemote);

			console.log("Joining room...", data.roomCode);
			if (data.game === 'snake') {
				await joinSnakeRoom(data.roomCode, username, matchmakingSocket);
				setTimeout(() => {
					if (matchmakingSocket && matchmakingSocket.readyState !== WebSocket.CLOSED) {
						matchmakingSocket.close();
						console.log('Matchmaking WebSocket connection closed after joining the room.');
					}
				}, 1000);
			}

		} else if (data.system) {
			document.getElementById('status').innerText = data.message;

		} else if (data.error) {
			document.getElementById('status').innerText = `Error: ${data.message}`;

		} else {
			document.getElementById('status').innerText = "READY TO PLAY?";
		}
	};

	matchmakingSocket.onclose = () => {
		matchmakingSocket = null;
	};

	document.getElementById('joinMatchmaking').addEventListener('click', () => {
		const data = JSON.stringify({
			type: "join",
			game: "snake"
		});
		matchmakingSocket.send(data);
		document.getElementById('status').innerText = "MATCHMAKING...";
	});

	document.getElementById('cancelMatchmaking').addEventListener('click', () => {
		const data = JSON.stringify({
			type: "cancel"
		});

		matchmakingSocket.send(data);
		if (matchmakingSocket && matchmakingSocket.readyState !== WebSocket.CLOSED) {
			matchmakingSocket.close();
			console.log('Matchmaking WebSocket connection closed.');
		}

		document.getElementById('status').innerText = "CANCELLING MATCHMAKING...";
		setTimeout(() => {
			document.getElementById('snakePopup').remove();
			navigateTo(`/user/${username}/snake`);
		}, 1000);
	});
}

function snakeGameMultiplayer(username) {
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', startMultiplayerSnakePopup(username));
	document.getElementById('guestInput1').focus();

	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		const snakePopupDiv = document.getElementById('snakePopup');
		snakePopupDiv.remove();
		navigateTo(`/user/${username}/snake`);
	});

	function checkForDuplicates(names) {
		const lowerCaseNames = names.map(name => name.toLowerCase());
		return new Set(lowerCaseNames).size !== lowerCaseNames.length;
	}

	function validateNames() {
		const inputs = document.querySelectorAll('.local-input-custom');
		const validNamePattern = /^[a-zA-Z0-9]+$/;
		let allFieldsValid = true;
		let playerNames = [];

		inputs.forEach(input => {
			const name = input.value.trim();
			guest1 = input.value.trim();
			guest2 = input.value.trim();
			guest3 = input.value.trim();
			if (name.length === 0 || !validNamePattern.test(name)) {
				input.classList.add('input-error');
				displaySlidingMessage('Error: Name must be 1-10 characters long and contain only letters or numbers.');
				allFieldsValid = false;
			} else {
				input.classList.remove('input-error');
				playerNames.push(name);
			}
		});

		if (allFieldsValid && checkForDuplicates(playerNames)) {
			displaySlidingMessage('Error: Player names must be unique!');
			allFieldsValid = false;
		}

		return allFieldsValid;
	}

	const playButton = document.getElementById('playButton');
	playButton.addEventListener('click', (event) => {
		event.preventDefault();
		const allFieldsValid = validateNames();

		if (allFieldsValid) {
			const runSnakeLocal = document.createElement('div');
			runSnakeLocal.classList.add('invite-pending');
			runSnakeLocal.id = 'runSnake';
			runSnakeLocal.innerHTML = snakeGameMultiplayerPage();
			document.getElementById('root').appendChild(runSnakeLocal);
			loadSnakeMultiplayerScript(username);
		}
	});
}

export { snakeGameLocal, snakeGameRemote, snakeGameMultiplayer, loadSnakeLocalScript, loadSnakeMultiplayerScript, snakeGameRemotePage };
