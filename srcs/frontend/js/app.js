
import { navbar2, navbar3 } from "./utils/navbar2.js";
import { createCanvas } from "./game/canvas.js";
import { setup, setupGame, start, start1 } from "./game/pong.js";
import { limparDiv, limparDivAll } from "./utils/utils1.js";
import { signIn, register } from "./login/login.js";
import { removeToken2, viewToken } from "./login/session.js";

//const baseURL = "http://127.0.0.1:8000";
const baseURL = "django";
const gameScript = `<script id="game" src="./js/game/pong.js"></script>`;
// const gameScript = `<h2>OLA</h2>`;
let data;


//Verificar se o data-value não é zero

function makeLinks(links, gameLink) {
	console.log(links);
	for (let link of links) {
		if (link.dataset.value) {
			link.addEventListener('click', newpage);
			if (link.dataset.value === "/sections/game")
				gameLink.addEventListener('click', start1);
		}
	}
}

function deactivateLinks(links) {
	console.log(viewToken());
	if (!viewToken()) {
		for (let link of links) {
			if (link.dataset.value) {
				link.style.pointerEvents = 'none';
				link.style.cursor = 'default';
			}
		}
	}
}


document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar2);
	const gameArea = createCanvas(data);
	setupGame();
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	// console.log(gameArea);
	signIn();
	register();
	const gameLink = document.getElementById('gameLink');
	const links = document.querySelectorAll('.nav-link');
	// removeToken2(); // para já desligar tenho que fazer a página apó login
	makeLinks(links, gameLink);
	deactivateLinks(links);
	
})


async function newpage(e) {
	e.preventDefault();
	limparDiv("root");
	console.log(this.dataset.value);
	const allURL = `${baseURL}${this.dataset.value}`;
	const gameArea = document.getElementById('canvas');
	console.log(allURL);
	if (document.getElementById('game'))
		document.getElementById('game').remove();
	try {

		const response = await fetch(allURL);
		if (this.dataset.value !== "/sections/game") {
			gameArea.style.display = 'none';
			data = await response.json();
		}
		else {
			document.querySelector('#navBar').remove();
			document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);
			gameArea.style.display = 'block';
			// data = await response.text();
			if (!document.getElementById('game'))
				document.body.insertAdjacentHTML('beforeend', gameScript);
		}
		console.log(data);
	}
	catch (e) {
		console.log("Error: ", e);
	}
}