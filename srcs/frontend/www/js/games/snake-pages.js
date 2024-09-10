import { navigateTo } from "../app.js";
import { initializeSnakeGameLocal } from '../../js/games/snake-local.js';

let snakeRemoteScriptLoaded = false;
let snake4allScriptLoaded = false;
let guest;

function startLocalSnakePopup() {
	return `
		<div class="local-pending" id="localPending">
			<div class="local-box">
				<div class="logo-box1">SNAKE</div>
				<div class="font-custom">Guest Name</div>
				<input id="guestInput" class="local-input" type="text" placeholder="Enter guest name" maxlength="10" autofocus value="Guest">
				<button id="playButton" class="btn btn-success local-btn">Play</button>
				<button id="cancelButton" class="btn btn-danger local-btn">Cancel</button>
		
				<div class="local-instructions-title myFont-title">Game Instructions</div>
		
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

function snakeCanvasPage() {
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

function loadSnakeLocalScript(username, guest) {
	console.log('DOMContentLoaded event listener');
	const localPendingDiv = document.getElementById('localPending');
	if (localPendingDiv && typeof initializeSnakeGameLocal === 'function') {
		localPendingDiv.remove();
		document.getElementById('snakeName1').textContent = username;
		document.getElementById('snakeName2').textContent = guest;
		initializeSnakeGameLocal(username, guest);
	}
}

function loadSnakeScript(username) {
	console.log('Loading snake guest window');
	if (document.readyState === 'loading') {
		// O DOM ainda não está carregado, então adicione o listener
		document.addEventListener('DOMContentLoaded', () => {
			loadSnakeLocalScript(username, guest);
		});
	} else {
		// O DOM já está carregado, então execute imediatamente
		loadSnakeLocalScript(username, guest);
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
		runSnakeLocal.innerHTML = snakeCanvasPage();
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
        console.error('Error loading:', error);
    }
    if (!snake4allScriptLoaded) {
        const scriptElement = document.createElement('script');
        scriptElement.src = '../../js/games/snake-free-for-all.js';
        scriptElement.onload = () => {
            snake4allScriptLoaded = true;
            if (typeof initializeSnakeGameFreeForAll === 'function') {
                initializeSnakeGameFreeForAll(); 
            }
        };
        scriptElement.onerror = () => {
            console.error('Error loading script snake-free-for-all.js');
        };
        document.body.appendChild(scriptElement);
    } else {
        if (typeof initializeSnakeGameFreeForAll === 'function') {
            initializeSnakeGameFreeForAll(); 
        }
    }
}

export { snakeGameLocal , snakeGameRemote , snakeGameFreeForAll , loadSnakeScript }