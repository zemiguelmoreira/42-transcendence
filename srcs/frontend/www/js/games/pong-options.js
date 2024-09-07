import { navigateTo } from "../app.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";

console.log('Pong Options loaded');

function emptyPage(data) {
	console.log('emptyPage:', data)
	return `
	<div class="navbar-div">
		<nav class="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
			<div class="container-fluid">
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarSupportedContent">
					<ul class="navbar-nav me-auto mb-2 mb-lg-0">
						<li class="nav-item">
							<a class="nav-link active" aria-current="page" href="" id="homeButton">HOME</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" id="chatButton" href="">CHAT</a>
						</li>
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="" role="button" data-bs-toggle="dropdown" aria-expanded="false">GAMES</a>
							<ul class="dropdown-menu">
								<li><a id="pong-navbar" class="dropdown-item" href="">Pong</a></li>
								<li><a id="snake-navbar" class="dropdown-item" href="">Snake</a></li>
							</ul>
						</li>
					</ul>
					<form id="search-form" class="d-flex" role="search">
						<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
						<button id="search-btn" class="btn btn-outline-success" type="submit">Search</button>
					</form>
					<ul class="navbar-nav">
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="" role="button" data-bs-toggle="dropdown" aria-expanded="false">
								<img src="${data.profile.profile_image_url}" alt="User Icon" width="30" height="30">
							</a>
							<ul class="dropdown-menu dropdown-menu-end">
								<li><a class="dropdown-item" id="viewProfile" href="">Profile</a></li>
								<li><a class="dropdown-item" id="viewSettings" href="">Settings</a></li>
								<li>
									<hr class="dropdown-divider">
								</li>
								<li><a class="dropdown-item" id="logOut" href="">Logout</a></li>
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</nav>
	</div>
	<div class="chatContainer">
		<div class="sliding-window closed">
			<div class="slidingChatContainer">
				<div class="chat-container">
					<div class="users-list">
						<ul id="online-users-list"></ul>
					</div>
					<div class="chat-window">
						<div class="messages" id="chat-log"></div>
						<div class="message-input">
							<input id="chat-message-input" type="text" placeholder="Type a message...">
							<button id="chat-message-submit">Send</button>
							<!-- <button id="inviteButton">Invite to play</button> -->
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="home-box" id="mainContent"></div>
	<div class="message-bar">
		<div id="slidingMessage" class="sliding-message"></div>
	</div>
	`;
}

// Função para carregar as opções de Pong
async function pongOptions(username) {

    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="card" style="width: 18rem;">
                <img src="../../files/1vs1PongLocal.png" class="card-img-top" alt="alt="Enter to play"">
                <div class="card-body">
                    <h5 class="card-title">PONG LOCAL</h5>
                    <p class="card-text">Old classic nostalgic table tennis game with paddles and a ball. <b>Local friendly unranked game.</b></p>
                    <a href="" class="btn btn-primary card-btn" id="pongGameLocal">Let's Play</a>
                </div>
            </div>
            <div class="card" style="width: 18rem;">
                <img src="../../files/1vs1PongRemote.png" class="card-img-top" alt="alt="Enter to play"">
                <div class="card-body">
                    <h5 class="card-title">PONG REMOTE</h5>
                    <p class="card-text">Classic Pong online challenge against a ranked remote player. <b>Remote ranked game.</b></p>
                    <a href="" class="btn btn-primary card-btn" id="pongGameRemote">Let's Play</a>
                </div>
            </div>
            <div class="card" style="width: 18rem;">
                <img src="../../files/4PongTournament.png" class="card-img-top" alt="alt="Enter to chat"">
                <div class="card-body">
                    <h5 class="card-title">PONG TOURNMENT</h5>
                    <p class="card-text">Organize a Pong tournament between several players locally. <b>Local friendly unranked game.</b></p>
                    <a href="" class="btn btn-primary card-btn" id="pongGameTournament">Let's Talk</a>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }

    document.getElementById('pongGameLocal').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(`/user/${username}/pong-game-local`);
    });

    document.getElementById('pongGameRemote').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(`/user/${username}/pong-game-remote`);
    });

    document.getElementById('pongGameTournament').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(`/user/${username}/pong-game-tournament`);
    });
}

export { pongOptions };
