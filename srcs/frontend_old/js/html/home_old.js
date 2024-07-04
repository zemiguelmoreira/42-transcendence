import { navbar1, navbar3 } from "./navbar.js";
import { createCanvas } from "../game/canvas.js";
import { setupGame, stopGame } from "../game/pong.js";
import { signIn, handleSignIn } from "../login/login.js";
import { register } from "../login/register.js";
import { makeGame, deactivateLinks } from "../app.js";
import { linkTeste } from "../profile/profile.js";
import { myProfile } from "../profile/myprofile.js";
// import { searchUserForm } from "../profile/search_user_dinamic.js";
import { searchUserForm, searchBtn } from "../profile/search_user.js";



function makeHome() {
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar1);
	const gameArea = createCanvas();
	console.log(gameArea);
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	// const gameLink = document.getElementById('gameLink');
	const links = document.querySelectorAll('.nav-link');
	// deactivateLinks(links);
	history.pushState({ page: 'home' }, 'Home', '/');

	window.addEventListener('popstate', (event) => {
		if (event.state) {
			switch (event.state.page) {
				case 'signIn':
					handleSignIn();
					break;
				case 'register':
					register();
					break;
				case 'home':
					home();
					break;
				default:
					makeHome();
					break;
			}
		} else {
			home();
		}
	});

	const links_pages = document.querySelectorAll('[data-page]');
    links_pages.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Previne o comportamento padrão do link
            const page = event.target.getAttribute('data-page'); // Obtém a página a ser carregada
            switch (page) {
                case 'signIn':
                    signIn();
                    break;
                case 'register':
                    register();
                    break;
                case 'home':
                    home();
                    break;
                default:
                    home();
                    break;
            }
        });
    });
	// signIn();
	// register();
	// home();
}


function makeHomeTransc(e) {
	e.preventDefault();
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar1);
	const gameArea = createCanvas();
	console.log(gameArea);
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	history.pushState({ page: 'home' }, 'Home', '/');
	// const gameLink = document.getElementById('gameLink');
	const links = document.querySelectorAll('.nav-link');
	// deactivateLinks(links);
	signIn();
	register();
	home();
}


function home() {
	const titleTransc = document.querySelector('#home');
	console.log(titleTransc);
	titleTransc.addEventListener('click', makeHomeTransc);
}


function makeTeste() {
	const teste = document.getElementById('testeLink');
	teste.addEventListener('click', linkTeste);
}


function makeHomeLogin() {
	document.getElementById('root').innerHTML = ''; //só teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);
	const gameArea = createCanvas();
	console.log(gameArea);
	// setupGame(); mudou para a função newpage
	document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
	const gameLink = document.getElementById('gameLink');
	const links = document.querySelectorAll('.nav-link');
	const logout = document.getElementById('logOut');
	logout.addEventListener('click', goHome);
	makeGame(gameLink);
	makeTeste();
	myProfile();
	searchUserForm();
	searchBtn();
	// deactivateLinks(links);
	homeLogin();
}


function homeLogin1(e) {
	e.preventDefault(e);
	makeHomeLogin();
}


function homeLogin()  {
	const titleTransc = document.querySelector('#home');
	console.log(titleTransc);
	titleTransc.addEventListener('click', homeLogin1);
}


function goHome(e) {
	e.preventDefault();
	makeHome();
}


export { makeHome, home, makeHomeTransc, goHome, makeHomeLogin, homeLogin}