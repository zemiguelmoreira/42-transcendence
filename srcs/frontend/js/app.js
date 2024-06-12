
// import { navbar2, navbar3 } from "./html/navbar2.js";
// import { setup, setupGame, start, start1 } from "./game/pong.js";
// import { limparDiv, limparDivAll } from "./utils/utils1.js";
// import { register } from "./login/register.js";
// import { signIn } from "./login/login.js";
// import { removeToken2, viewToken } from "./login/session.js";
// import { home, makeHome } from "./html/home.js";
// import { chatFunction } from "./chat/chat.js";

// const baseURL = "https://localhost/api";
// const gameScript = `<script id="game" src="./js/game/pong.js"></script>`;
// const chatScript = `<script id="game" src="./js/chat/chat.js"></script>`;

// // let data;

// //Verificar se o data-value não é zero

// function makeLinks(links, gameLink, chatLink) {
// 	console.log(links);
// 	for (let link of links) {
// 		if (link.dataset.value) {
// 			link.addEventListener('click', newpage);
// 			if (link.dataset.value === "game")
// 				gameLink.addEventListener('click', start1);
// 			if (link.dataset.value === "chat")
// 				chatLink.addEventListener('click', chatFunction);
// 		}
// 	}
// }

// function deactivateLinks(links) {
// 	console.log(viewToken());
// 	if (!viewToken()) {
// 		for (let link of links) {
// 			if (link.dataset.value) {
// 				link.style.pointerEvents = 'none';
// 				link.style.cursor = 'default';
// 			}
// 		}
// 	}
// }


// // link.style.pointerEvents = 'none'; prevents any mouse interactions with the link (e.g., clicking, dragging).
// // link.style.cursor = 'default'; changes the cursor to the default cursor (usually an arrow) when hovering over the link, indicating that the link is not clickable.


// document.addEventListener('DOMContentLoaded', function () {
// 	// document.getElementById('root').innerHTML = ''; //só teste
// 	// document.getElementById('root').insertAdjacentHTML('afterbegin', navbar2);
// 	// const gameArea = createCanvas(data);
// 	// setupGame();
// 	// document.getElementById('root').insertAdjacentHTML('beforeend', gameArea);
// 	// console.log(gameArea);
// 	makeHome();
// 	// home();
// 	// signIn();
// 	// register();
// 	// const gameLink = document.getElementById('gameLink');
// 	// const links = document.querySelectorAll('.nav-link');
// 	// // removeToken2(); // para já desligar tenho que fazer a página apó login
// 	// makeLinks(links, gameLink);
// 	// deactivateLinks(links);
	
// })


// async function newpage(e) {
// 	e.preventDefault();
// 	console.log(this.dataset.value);
// 	limparDiv("root");

// 	if (document.getElementById('game'))
// 		document.getElementById('game').remove();

// 	const gameArea = document.getElementById('canvas');
// 	if (this.dataset.value === 'game') {
    // 		document.querySelector('#navBar').remove();
    // 			document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);
    // 			gameArea.style.display = 'block';
    // 			home(); // para a navbar do game
    // 			if (!document.getElementById('game'))
    // 				document.body.insertAdjacentHTML('beforeend', gameScript);
    // 	} else {
        // 		if (this.dataset.value !== "game")
// 			gameArea.style.display = 'none';
// 	}
// }


// export { baseURL, makeLinks, deactivateLinks }

import { viewToken } from "./login/session.js";
// import { getCsrfToken } from './utils/csrf.js';
import { createNavbarNotLogged, createNavbarLogged } from './html/navbar.js';


function loadPage(pageName) {
    fetch(`js/pages/${pageName}/${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('root').innerHTML = html;
            loadScript(`js/pages/${pageName}/${pageName}.js`);
        })
        .catch(error => console.error('Error loading page: ', error));
}

function loadScript(scriptName) {
    var scriptElement = document.createElement('script');
    scriptElement.src = scriptName;
    scriptElement.type = 'module';  // Adiciona o tipo "module" ao script
    document.body.appendChild(scriptElement);
}

function isLoggedIn() {
    
    const token = viewToken();

    console.log(token);
    return (token)
}

function generateNavBar(is_logged_in) {

    document.getElementById('navbar-logged-out').innerHTML = createNavbarNotLogged();
    document.getElementById('navbar-logged-in').innerHTML = createNavbarLogged();

    if (is_logged_in) {
        document.getElementById('navbar-logged-out').style.display = 'none';
        document.getElementById('navbar-logged-in').style.display = 'block';
    } else {
        document.getElementById('navbar-logged-out').style.display = 'block';
        document.getElementById('navbar-logged-in').style.display = 'none';
    }
}

generateNavBar(isLoggedIn());
// handleNavbarButtons();


window.loadPage = loadPage;
// window.getCsrfToken = getCsrfToken;