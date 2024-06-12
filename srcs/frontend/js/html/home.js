import { navbar2 } from "./navbar2.js";
import { createCanvas } from "../game/canvas.js";
import { setupGame, stopGame } from "../game/pong.js";
import { signIn } from "../login/login.js";
import { register } from "../login/register.js";
import { makeLinks, deactivateLinks } from "../app.js";


function makeHome() {
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar2);
	const gameArea = createCanvas();
	console.log(gameArea);
	setupGame();
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	const gameLink = document.getElementById('gameLink');
	const chatLink = document.getElementById('chatLink');
	const links = document.querySelectorAll('.nav-link');
	makeLinks(links, gameLink, chatLink);
	deactivateLinks(links);
	signIn();
	register();

	home();
}


function makeHomeTransc(e) {
	e.preventDefault();
	stopGame();
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar2);
	const gameArea = createCanvas();
	console.log(gameArea);
	setupGame();
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	const gameLink = document.getElementById('gameLink');
	const links = document.querySelectorAll('.nav-link');
	makeLinks(links, gameLink, chatLink);
	deactivateLinks(links);
	signIn();
	register();
	home();
}


function home() {
	const titleTransc = document.querySelector('#home');
	console.log(titleTransc);
	titleTransc.addEventListener('click', makeHomeTransc);
}


function goHome(e) {
	e.preventDefault();
	makeHome();
}


export { makeHome, home, makeHomeTransc, goHome }