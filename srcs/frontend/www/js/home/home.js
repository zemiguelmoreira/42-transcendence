import { navigateTo } from "../app.js";
import { register_page } from "../register/registerPage.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile, fetchUserProfileSettings } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";
import { handleSignUp } from "../register/register.js";
import { displaySlidingMessage, displayError } from "../utils/utils1.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeHomePage , makeSimpleHomePage } from "./homepage.js";
import { goTo } from "../app.js";
import chatSocketInstance from "../chat/chat_socket.js";
import WebSocketInstance from "../socket/websocket.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";
import { userSignIn42 } from "../login/login42.js";
import { makeChatWindow } from "../chat/chat_html.js";
import { initializeChat } from '../chat/chat.js';

let chatLoaded = false;

function changeChatLoaded () {
    if (chatLoaded)
        chatLoaded = false;
}

function home() {
	document.getElementById('root').innerHTML = '';
	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
	document.getElementById('form1Example1').focus();
	document.getElementById('signIn').addEventListener('click', (e) => {
		e.preventDefault();
		(!localStorage.getItem('access_token')) ? navigateTo('/signIn') : goTo(); // função para evitar o login quando tenho token
	});
	const inputField = document.querySelector('#form1Example1');
	const limitChar = document.querySelector('#limitChar');
	handleInput(inputField, limitChar);
	handleInputBlur(inputField, limitChar);
	const signInUser42 = document.querySelector('#signInUser42');
	signInUser42.addEventListener('click', function (e) {
		e.preventDefault();
		if (!viewToken())
			userSignIn42();	
		else 
			displayError("To login with another user, you have to logout.");
	});
	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp);
}

function closeSlidingWindow() {
	let slidingWindow = document.querySelector('.sliding-window');
	if (slidingWindow && slidingWindow.classList.contains('open')) {
		slidingWindow.classList.remove('open');
		slidingWindow.classList.add('closed');
	}
}

function openSlidingWindow() {
	let slidingWindow = document.querySelector('.sliding-window');
	if (slidingWindow && slidingWindow.classList.contains('closed')) {
		slidingWindow.classList.remove('closed');
		slidingWindow.classList.add('open');
	}
}

function initButtonListeners(username) {
	
    const homeButton = document.getElementById('homeButton');
    if (homeButton && !homeButton.hasListener) {
        homeButton.hasListener = true;
        homeButton.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(`/user/${username}`);
        });
    }

    const snakeNavbar = document.getElementById('snake-navbar');
    if (snakeNavbar && !snakeNavbar.hasListener) {
        snakeNavbar.hasListener = true;
        snakeNavbar.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(`/user/${username}/snake`);
        });
    }

    const pongCard = document.getElementById('pong-card');
    if (pongCard && !pongCard.hasListener) {
        pongCard.hasListener = true;
        pongCard.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(`/user/${username}/pong`);
        });
    }

    const pongNavbar = document.getElementById('pong-navbar');
    if (pongNavbar && !pongNavbar.hasListener) {
        pongNavbar.hasListener = true;
        pongNavbar.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(`/user/${username}/pong`);
        });
    }

    const snakeCard = document.getElementById('snake-card');
    if (snakeCard && !snakeCard.hasListener) {
        snakeCard.hasListener = true;
        snakeCard.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(`/user/${username}/snake`);
        });
    }

    const viewProfileButton = document.getElementById('viewProfile');
    if (viewProfileButton && !viewProfileButton.hasListener) {
        viewProfileButton.hasListener = true;
        viewProfileButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (viewToken()) {
                fetchUserProfile(username);
            } else {
                navigateTo('/signIn');
            }
        });
    }

    const viewSettingsButton = document.getElementById('viewSettings');
    if (viewSettingsButton && !viewSettingsButton.hasListener) {
        viewSettingsButton.hasListener = true;
        viewSettingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (viewToken()) {
                fetchUserProfileSettings(username);
            } else {
                navigateTo('/signIn');
            }
        });
    }

    const logOutButton = document.getElementById('logOut');
    if (logOutButton && !logOutButton.hasListener) {
        logOutButton.hasListener = true;
        logOutButton.addEventListener('click', (e) => {
            e.preventDefault();
            removeToken(username);
            chatLoaded = false; // introduzido para carregar de novo toda a página home
            chatSocketInstance.close();
            WebSocketInstance.close();
            setTimeout(function () {
                navigateTo('/');
            }, 2000);
        });
    }

    const chatCard = document.getElementById('chatCard');
    if (chatCard && !chatCard.hasListener) {
        chatCard.hasListener = true;
        chatCard.addEventListener('click', (e) => {
            e.preventDefault();
            openSlidingWindow();
        });
    }

    const searchForm = document.getElementById('search-form');
    if (searchForm && !searchForm.hasListener) {
        searchForm.hasListener = true;
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            getUser(username);
        });
    }

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn && !searchBtn.hasListener) {
        searchBtn.hasListener = true;
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            getUser(username);
        });
    }

    displaySlidingMessage('Welcome to the game! Prepare yourself for an epic adventure!');
}



async function homeLogin(username) {
	let dataUser = await getUserProfileByUsername(username);
	const home_page = makeHomePage(dataUser);
	const home_page_simple = makeSimpleHomePage();
	const chat_window = makeChatWindow(username);
	
	if (!chatLoaded) {
		chatLoaded = true;
		document.getElementById('root').innerHTML = '';
		document.getElementById('root').insertAdjacentHTML('afterbegin', home_page);
		document.getElementById('root').insertAdjacentHTML('afterbegin', chat_window);
		initializeChat(username);
		document.getElementById('chatButton').addEventListener('click', function (e) {
			e.preventDefault();
			let slidingWindow = document.querySelector('.sliding-window');
			if (slidingWindow.classList.contains('closed')) {
				slidingWindow.classList.remove('closed');
				slidingWindow.classList.add('open');
			} else {
				slidingWindow.classList.remove('open');
				slidingWindow.classList.add('closed');
			}
		});
	} else {
		document.getElementById('mainContent').innerHTML = '';
		document.getElementById('mainContent').insertAdjacentHTML('afterbegin', home_page_simple);
	}
	
	initButtonListeners(username);
}

export { home, homeLogin, closeSlidingWindow, changeChatLoaded }