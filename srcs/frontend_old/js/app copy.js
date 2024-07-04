
import { navbar2 } from "./html/navbar.js";
import { start1 } from "./game/pong.js";
import { limparDiv, limparDivAll } from "./utils/utils1.js";
import { viewToken } from "./login/session.js";
import { home, makeHome, makeHomeLogin} from "./html/home.js";
import { setupGame } from "./game/pong.js";

const baseURL = "http://127.0.0.1:8000";
const gameScript = `<script id="game" src="./js/game/pong.js"></script>`;

// let data;

//Verificar se o data-value não é zero


function makeGame(gamelink) {
	gamelink.addEventListener('click', newpage);
}


function deactivateLinks(links) {
	console.log('desativar links', viewToken());
	if (!viewToken()) {
		for (let link of links) {
			if (link.dataset.value) {
				link.style.pointerEvents = 'none';
				link.style.cursor = 'default';
			}
		}
	}
}


// link.style.pointerEvents = 'none'; prevents any mouse interactions with the link (e.g., clicking, dragging).
// link.style.cursor = 'default'; changes the cursor to the default cursor (usually an arrow) when hovering over the link, indicating that the link is not clickable.


document.addEventListener('DOMContentLoaded', function () {
	makeHome();
	history.pushState({ page: 'home' }, 'Home', '/');
	// gerir o histórico

})


function shutdownGame(e) {
	e.preventDefault();
	if (document.getElementById('game'))
		document.getElementById('game').remove();

	document.getElementById('canvas').style.display = 'none';
	// gameArea.style.display = 'none';
	makeHomeLogin();
}


function newpage(e) {
	e.preventDefault();
	console.log(this.dataset.value);
	limparDiv("root");

	if (document.getElementById('game'))
		document.getElementById('game').remove();

	const gameArea = document.getElementById('canvas');
	console.log(gameArea);
	document.querySelector('#navBar').remove();
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar2);
	setupGame(); // quando se clica para ir para o home desliga o jogo
	gameArea.style.display = 'block';
	start1();
	const transc = document.getElementById('home');
	transc.addEventListener('click', shutdownGame)
	// homeLogin(); // para a navbar do game
	document.body.insertAdjacentHTML('beforeend', gameScript);
}


export { baseURL, makeGame, deactivateLinks }
