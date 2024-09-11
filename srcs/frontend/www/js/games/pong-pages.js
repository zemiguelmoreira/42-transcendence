import { initializeTournament } from './pong-tournament-bracket.js';
import { initializePongGameLocal } from './pong-local.js';
import { navigateTo } from '../app.js';

let pongScriptLoaded = false;
let guest;

function startLocalPongPopup(username) {
	return `
		<div class="local-pending" id="localPending">
			<div class="local-box">
				<div class="logo-box1">PONG</div>
				<div class="local-instructions-title-custom myFont-title">LOCAL MATCH</div>
				<input id="guestInput" class="local-input-custom" type="text" placeholder="Enter guest name" maxlength="10" autofocus value="Player 2">
				<button id="playButton" class="btn btn-success local-btn-custom">Play</button>
				<button id="cancelButton" class="btn btn-danger local-btn-custom">Cancel</button>
				<div class="local-instructions-title-custom myFont-title">GAME INSTRUCTIONS</div>
				<div class="local-instructions-container">
					<div class="local-instructions-column">
						<div class="local-instructions-custom myFont-title">${username}</div>
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

function loadPongLocalScript(username, guest) {
	const path = window.location.pathname;
	if (path === '/user/' + username + '/pong-game-local') {
		const localPendingDiv = document.getElementById('localPending');
		if (localPendingDiv && typeof initializePongGameLocal === 'function') {
			localPendingDiv.remove();
			initializePongGameLocal(username, guest);
		}
	} else {
		navigateTo(`/user/${username}/pong`);
	}
}

function loadPongScript(username) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			loadPongLocalScript(username, guest);
		});
	} else {
		loadPongLocalScript(username, guest);
	}
}

function pongGameLocal(username) {
	document.getElementById('root').insertAdjacentHTML('afterbegin', startLocalPongPopup(username));
	document.getElementById('guestInput').focus();
	const cancelButton = document.getElementById('cancelButton');
	cancelButton.addEventListener('click', () => {
		const localPendingDiv = document.getElementById('localPending');
		localPendingDiv.remove();
	});
	const playButton = document.getElementById('playButton');
	playButton.addEventListener('click', () => {
		guest = document.querySelector('#guestInput').value;
		const runPongLocal = document.createElement('div');
		runPongLocal.classList.add('invite-pending');
		runPongLocal.id = 'runPong';
		runPongLocal.innerHTML = pongCanvasPage();
		document.getElementById('root').appendChild(runPongLocal);
		navigateTo(`/user/${username}/pong-game-local`);
	});
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
		scriptElement.type = 'module';
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

function pongGameTournament(username) {
    try {
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
                            <input type="text" id="player1" placeholder="${username}" value="${username}"/>
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
            if (allFieldsFilled) {
                document.getElementById('loadTournament').remove();
				displayTournamentBracket();
				document.getElementById('canvas-confetti').style.display = "none";
				initializeTournament(players, username);
            }
        });
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

export { pongGameLocal, pongGameRemote, pongGameTournament , pongCanvasPage , loadPongScript }