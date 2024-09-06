import { initializeTournament } from './pong-tournament-bracket.js';

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

	let pongScriptElement = null;

	function loadPongScript() {
		if (pongScriptElement) {
			document.body.removeChild(pongScriptElement);
			pongScriptElement = null;
		}

		// Create a div to show that the game invite is pending
		// const gameDiv = document.createElement('div');
		// gameDiv.classList.add('pongDiv');
		// gameDiv.id = 'pongDiv';
		// document.getElementById('root').appendChild(gameDiv);

		// Create a script element to load the pong-local.js script
		pongScriptElement = document.createElement('script');
		pongScriptElement.type = 'module';
		pongScriptElement.src = '../../js/games/pong-local.js';
		pongScriptElement.onload = () => {

			// Dispara um evento personalizado com o username
			console.log('Script pong-local.js carregado com sucesso');
			const event = new CustomEvent('pongGameLoaded', { detail: { username } });
			document.dispatchEvent(event);
		};

		pongScriptElement.onerror = () => {
			console.error('Erro ao carregar o script pong-local.js');
			pongScriptElement = null;
		};

		document.body.appendChild(pongScriptElement);
	}

	loadPongScript();

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

            // Verifica se todos os inputs ativos estão preenchidos
            for (let i = 0; i < activePlayerCount; i++) {
                inputs[i].classList.remove('input-error');
                if (inputs[i].value.trim() === '') {
                    inputs[i].classList.add('input-error');
                    allFieldsFilled = false;
                } else {
                    players[`player${i + 1}`] = inputs[i].value.trim(); // Adiciona os nomes ao objeto players
                }
            }

            if (allFieldsFilled) {
                document.getElementById('loadTournament').remove();
				displayTournamentBracket();
                // document.querySelector("#goBack").style.display = "none";
				document.getElementById('canvas-confetti').style.display = "none";
				initializeTournament(players);
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
			<!--<button id="goBack" class="sm-start-button">BACK TO PONG PAGE</button>-->
		</div>
		
		<div id="tournament-bracket" class="tournament-bracket"></div>		
	`;
}

export { pongGameLocal, pongGameRemote, pongGameTournament }