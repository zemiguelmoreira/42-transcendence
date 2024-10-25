import { initializeTournament } from './pong-tournament-bracket.js';
import { initializePongGameLocal } from './pong-local.js';
import { navigateTo } from '../app.js';
import { joinPongRoom } from './pong-remote.js';
import { displaySlidingMessage } from '../utils/utils1.js';

let guest;
let matchmakingSocketPong = null;

function startLocalPongPopup(alias_name) {
	return `
		<div class="local-pending" id="localPending">
			<div class="local-box">
				<div class="logo-box1">PONG</div>
				<div class="local-instructions-title-custom myFont-title">LOCAL MATCH</div>
				<form id="gameForm">
					<input id="guestInput" class="local-input-custom" type="text" maxlength="10" autofocus value="Guest">
					<button id="playButton" class="btn btn-success local-btn-custom">Play</button>
					<button id="cancelButton" class="btn btn-danger local-btn-custom">Cancel</button>
				</form>
					<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
				<div class="local-instructions-container">
					<div class="local-instructions-column">
						<div class="local-instructions-custom myFont-title">${alias_name}</div>
						<div class="local-instructions-custom myFont">W</div>
						<div class="local-instructions-custom myFont">S</div>
					</div>
					<div class="local-instructions-column controls">
						<div class="local-instructions-custom myFont"> - </div>
						<div class="local-instructions-custom myFont">UP</div>
						<div class="local-instructions-custom myFont">DOWN</div>
					</div>
					<div class="local-instructions-column">
						<div class="local-instructions-custom myFont-title">P2</div>
						<div class="local-instructions-custom myFont">&#8593;</div>
						<div class="local-instructions-custom myFont">&#8595;</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

function startRemotePongPopup() {
	return `
	<div class="local-pending" id="pongPopup">
		<div class="local-box">
			<img src="../../files/snakeMatch.png" width="150" height="50">
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
						<div class="local-instructions-custom myFont">W</div>
						<div class="local-instructions-custom myFont">S</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	`;
}

function pongCanvasPage() {
	return `
		<div class="pong-content">
			<div class="pong-box">
				<canvas id="pongBackgroundCanvas" width="960" height="560"></canvas>
				<canvas id="pongCanvas" width="960" height="560"></canvas>
			</div>
		</div>
	`;
}

function loadPongLocalScript(username, guest, dataUsername) {
	const path = window.location.pathname;
	if (path === '/user/' + username + '/pong-game-local') {
		const localPendingDiv = document.getElementById('localPending');
		if (localPendingDiv && typeof initializePongGameLocal === 'function') {
			localPendingDiv.remove();
			initializePongGameLocal(username, guest, dataUsername);
		}
	} else {
		navigateTo(`/user/${username}/pong`);
	}
}

function pongGameLocal(username, dataUsername) {
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', startLocalPongPopup(dataUsername.profile.alias_name));
	document.getElementById('guestInput').focus();
	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		const localPendingDiv = document.getElementById('localPending');
		localPendingDiv.remove();
		navigateTo(`/user/${username}/pong`);
	});

	document.getElementById("gameForm").addEventListener("submit", function (event) {
		event.preventDefault();
		event.stopPropagation();
		const inputField = document.getElementById("guestInput");
		const userInput = inputField.value.trim();
		const validNamePattern = /^[a-zA-Z0-9]+$/;

		if (userInput.length === 0 || userInput.length > 10 || !validNamePattern.test(userInput)) {
			event.preventDefault();
			displaySlidingMessage("Invalid input: Name must be 1-8 characters long and contain only letters or numbers.");
			inputField.classList.add('input-error');
			return;
		} else {
			inputField.classList.remove('input-error');
		}

		guest = userInput;
		const runPongLocal = document.createElement('div');
		runPongLocal.classList.add('invite-pending');
		runPongLocal.id = 'runPong';
		runPongLocal.innerHTML = pongCanvasPage();
		document.getElementById('root').appendChild(runPongLocal);
		loadPongLocalScript(username, guest, dataUsername);
	});
}

function pongGameRemote(username) {
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', startRemotePongPopup());

	let token = localStorage.getItem('access_token');

	if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
		matchmakingSocketPong.close();
		matchmakingSocketPong = null;
	}

	matchmakingSocketPong = new WebSocket(`wss://${window.location.host}/mm/ws/?token=${token}`);
	matchmakingSocketPong.onopen = () => {
		console.log("Matchmaking socket opened.");
	};

	matchmakingSocketPong.onmessage = (event) => {
		const data = JSON.parse(event.data);

		if (data.match == "match_created") {
			console.log("Match created: ", data.roomCode);
			document.getElementById('status').innerText = `Match found!\nOpponent: ${data.opponent}`;

			const popupWindow = document.getElementById('pongPopup');
			popupWindow.remove();
			const runPongRemote = document.createElement('div');
			runPongRemote.classList.add('invite-pending');
			runPongRemote.id = 'invitePending';
			runPongRemote.innerHTML = pongCanvasPage();
			document.getElementById('root').appendChild(runPongRemote);

			console.log("Joining room: ", data.roomCode);
			if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED)
				console.log("Joining... ", matchmakingSocketPong);
			joinPongRoom(data.roomCode, username, matchmakingSocketPong);

			setTimeout(() => {
				if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
					matchmakingSocketPong.close();
					console.log('Matchmaking WebSocket connection closed after joining the room.');
				}
			}, 1000);

		} else if (data.system) {
			document.getElementById('status').innerText = data.message;

		} else if (data.error) {
			document.getElementById('status').innerText = `Error: ${data.message}`;

		} else {
			document.getElementById('status').innerText = "READY TO PLAY?";
		}
	};

	matchmakingSocketPong.onclose = () => {
	};

	document.getElementById('joinMatchmaking').addEventListener('click', () => {
		const data = JSON.stringify({
			type: "join",
			game: "pong"
		});
		matchmakingSocketPong.send(data);
		document.getElementById('status').innerText = "MATCHMAKING...";
	});

	document.getElementById('cancelMatchmaking').addEventListener('click', () => {
		const data = JSON.stringify({
			type: "cancel",
			game: "pong"
		});

		matchmakingSocketPong.send(data);
		if (matchmakingSocketPong && matchmakingSocketPong.readyState !== WebSocket.CLOSED) {
			matchmakingSocketPong.close();
			matchmakingSocketPong = null;
			console.log("Matchmaking socket closed.");
		}

		document.getElementById('status').innerText = "CANCELLING MATCHMAKING...";
		setTimeout(() => {
			document.getElementById('pongPopup').remove();
			navigateTo(`/user/${username}/pong`);
		}, 1000)
	});
}

function pongGameTournament(username, dataUsername) {
	try {
		document.getElementById('mainContent').innerHTML = '';
		document.getElementById('mainContent').innerHTML = `
		<div id="loadTournament" class="tournament-gradient-box">
			<div class="tournament-setup">
				<div class="text-title-box">
					<p>SETUP</p>
				</div>
				<div class="text-box">
					<p>Insert your opponents' names and start the game. <br>Choose 4 or 8 player match.</p>
				</div>
				<div class="player-selection">
					<button id="btn-4-players" class="btn btn-primary active">4 Players</button>
					<button id="btn-8-players" class="btn btn-secondary">8 Players</button>
				</div>
				<div class="player-inputs">
					<div id="player-inputs-left" class="input-column">
						<div class="box">
							<input type="text" id="player1" placeholder="${dataUsername.profile.alias_name}" value="${dataUsername.profile.alias_name}"/>
						</div>
						<div class="box">
							<input type="text" id="player2" placeholder="Player 2 Name" value=""/>
						</div>
						<div class="box">
							<input type="text" id="player3" placeholder="Player 3 Name" value=""/>
						</div>
						<div class="box">
							<input type="text" id="player4" placeholder="Player 4 Name" value=""/>
						</div>
					</div>
					<div id="player-inputs-right" class="input-column">
						<div class="box">
							<input type="text" id="player5" placeholder="Player 5 Name" value=""/>
						</div>
						<div class="box">
							<input type="text" id="player6" placeholder="Player 6 Name" value=""/>
						</div>
						<div class="box">
							<input type="text" id="player7" placeholder="Player 7 Name" value=""/>
						</div>
						<div class="box">
							<input type="text" id="player8" placeholder="Player 8 Name" value=""/>
						</div>
					</div>
				</div>
				<div class="button-box">
					<button id="create-tournament" class="btn btn-primary btn-lg">Create Tournament</button>
				</div>
			</div>
			<div class="tournament-logo">
				<div class="logo-box1"><span class="tournament-title">TOURNAMENT</span></div>
				<div class="logo-box2"></div>
				<div class="logo-box3">PONG</div>
			</div>
		</div>
        `;

		function validatePlayerName(input) {
			input.addEventListener('input', function () {
				let value = input.value;

				value = value.replace(/[^a-zA-Z0-9-]/g, '');

				if (value.length > 10) {
					value = value.substring(0, 10);
				}

				input.value = value;

				validateNames();
			});
		}

		const playerInputs = [
			document.getElementById('player1'),
			document.getElementById('player2'),
			document.getElementById('player3'),
			document.getElementById('player4'),
			document.getElementById('player5'),
			document.getElementById('player6'),
			document.getElementById('player7'),
			document.getElementById('player8')
		];

		playerInputs.forEach(input => {
			if (input) {
				validatePlayerName(input);
			}
		});

		function checkForDuplicates(names) {
			const lowerCaseNames = names.map(name => name.toLowerCase());
			return new Set(lowerCaseNames).size !== lowerCaseNames.length;
		}

		function validateNames() {
			const playerNames = playerInputs
				.map(input => input.value.trim())
				.filter(name => name !== '');

			const hasDuplicates = checkForDuplicates(playerNames);

			if (hasDuplicates) {
				displaySlidingMessage('Error: Player names must be unique!');
				return false;
			}
			return true;
		}

		document.getElementById('create-tournament').addEventListener('click', function () {
			const activePlayerCount = document.querySelector('.player-selection .btn.active').id === 'btn-4-players' ? 4 : 8;
			const inputs = document.querySelectorAll('.player-inputs .box input');
			let allFieldsFilled = true;
			let players = {};

			for (let i = 0; i < activePlayerCount; i++) {
				inputs[i].classList.remove('input-error');
				if (inputs[i].value.trim() === '') {
					inputs[i].classList.add('input-error');
					allFieldsFilled = false;
				} else {
					players[`player${i + 1}`] = inputs[i].value.trim();
				}
			}

			if (allFieldsFilled && validateNames()) {
				document.getElementById('loadTournament').remove();
				displayTournamentBracket();
				document.getElementById('canvas-confetti').style.display = "none";
				displaySlidingMessage('Welcome to the Ultimate Pong Tournament!');
				initializeTournament(players, username, dataUsername);
			} else if (!allFieldsFilled) {
				displaySlidingMessage('Error: Please fill in all player names!');
			}

		});

		document.getElementById('btn-4-players').addEventListener('click', function () {
			this.classList.add('active');
			document.getElementById('btn-8-players').classList.remove('active');
			togglePlayerInputs(4);
		});
		document.getElementById('btn-8-players').addEventListener('click', function () {
			this.classList.add('active');
			document.getElementById('btn-4-players').classList.remove('active');
			togglePlayerInputs(8);
		});

		function togglePlayerInputs(count) {
			const allInputs = document.querySelectorAll('.player-inputs .box input');
			allInputs.forEach((input, index) => {
				input.disabled = index >= count;
			});
		}

		togglePlayerInputs(4);

	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
}

function displayTournamentBracket() {
	document.getElementById('mainContent').innerHTML = `
		<canvas id="canvas-confetti"></canvas>
		<div class="sm-start-menu">
			<span class="sm-title">TOURNAMENT</span>
			<span class="sm-logo"><img src="../../files/trophy.png"></span>
			<span class="sm-subtitle">Next Match</span>
			<div id="sm-match-box" class="sm-match">
				<span id="sm-player1" class="sm-player">Player 1</span>
				<span class="sm-vs">VS</span>
				<span id="sm-player2" class="sm-player">Player 2</span>
			</div>
			<button id="startMatchBtn" class="sm-start-button">START MATCH</button>
		</div>
		<div id="tournament-bracket" class="tournament-bracket"></div>
	`;
}

export { pongGameLocal, pongGameRemote, pongGameTournament, pongCanvasPage, matchmakingSocketPong }
